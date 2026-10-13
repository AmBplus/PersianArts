#!/usr/bin/env node
// Confidentiality and secrets scan for the repository (no dependencies).
//
// Scans git-tracked files plus untracked files that are not ignored (git ls-files and
// git ls-files -o --exclude-standard), skipping binaries.
//   - confidentiality: terms in contracts/confidential-terms.local.txt (git-ignored), compared after
//     removing spaces, ZWNJ, underscores, hyphens, dots, tatweel, diacritics, '#', punctuation and case.
//   - secrets: API key shapes, Authorization tokens, private keys, long env-var assignments.
// Output: file paths and line numbers only. Matched terms and secret values are never printed.
//
// Usage: node contracts/scan.mjs [--confidential] [--secrets]   (default: both)
// Exit code: 0 no hits, 1 any hit, 2 usage or setup error (e.g. term file missing).

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TERMS_FILE = path.join(HERE, 'confidential-terms.local.txt');
// Reviewed false positives and legacy folders. Entries: { path, line?, classes?, reason }.
// A path ending in '/' matches every file below it. Entries must not contain any term.
const ALLOWLIST_FILE = path.join(HERE, 'scan-allowlist.json');
const BINARY_EXT = new Set(['.mp4', '.mp3', '.wav', '.ogg', '.webm', '.mov', '.png', '.jpg', '.jpeg', '.gif', '.webp',
  '.ico', '.ttf', '.otf', '.woff', '.woff2', '.zip', '.gz', '.tar', '.pdf', '.psd', '.blend', '.avif', '.heic', '.bin', '.exe', '.dll', '.so']);

const SECRET_RULES = [
  ['aws-access-key', /AKIA[0-9A-Z]{16}/],
  ['api-key-sk', /\bsk-[A-Za-z0-9_-]{20,}/],
  ['github-token', /\bgh[pousr]_[A-Za-z0-9]{36,}/],
  ['authorization-token', /Authorization:\s*(Token|Bearer)\s+[A-Za-z0-9._~+/=-]{16,}/i],
  ['private-key-block', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['env-secret-assignment', /^\s*(export\s+)?[A-Z][A-Z0-9_]*(KEY|TOKEN|SECRET|PASSWORD|PASS|API)[A-Z0-9_]*\s*[=:]\s*['"]?[A-Za-z0-9_+/=.-]{20,}/],
  ['env-long-value', /^\s*(export\s+)?[A-Z][A-Z0-9_]{2,}\s*=\s*['"]?[A-Za-z0-9_+/=.-]{40,}['"]?\s*$/],
];

function git(args, cwd = HERE) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

// Maps Arabic/Persian letter variants to one form and strips the characters that vary in practice.
export function compact(s) {
  return s
    .normalize('NFC')
    .replace(/ي/g, 'ی') // Arabic yeh -> Persian yeh
    .replace(/ى/g, 'ی') // alef maksura -> Persian yeh
    .replace(/ك/g, 'ک') // Arabic kaf -> Persian kaf
    .replace(/ة/g, 'ه') // teh marbuta -> heh
    .replace(/[\s\u200b\u200c\u200d_\-.#,\u060c\u061b:;!?\u061f"'«»()\[\]{}\u0640\u064b-\u0670]/g, "")
    .toLowerCase();
}

function loadTerms() {
  if (!fs.existsSync(TERMS_FILE)) return null;
  return fs.readFileSync(TERMS_FILE, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map(compact)
    .filter((t, i, arr) => arr.indexOf(t) === i);
}

function loadAllowlist() {
  if (!fs.existsSync(ALLOWLIST_FILE)) return [];
  const data = JSON.parse(fs.readFileSync(ALLOWLIST_FILE, 'utf8'));
  return (data.entries ?? []).map((e) => {
    if (!e.path || !e.reason) throw new Error(`scan-allowlist: entry needs path and reason: ${JSON.stringify(e)}`);
    return {
      path: e.path.replace(/\\/g, '/'),
      line: e.line ?? null,
      classes: e.classes ?? ['confidential', 'secrets'],
    };
  });
}

function isAllowed(allow, rel, lineNo, cls) {
  return allow.some((e) =>
    e.classes.includes(cls)
    && (e.path.endsWith('/') ? rel.startsWith(e.path) : rel === e.path)
    && (e.line === null || e.line === lineNo));
}

function listFiles() {
  const tracked = git(['ls-files', '-z'], ROOT).split('\0').filter(Boolean);
  const untracked = git(['ls-files', '-o', '--exclude-standard', '-z'], ROOT).split('\0').filter(Boolean);
  const all = [...new Set([...tracked, ...untracked])];
  return all.filter((f) => fs.existsSync(path.join(ROOT, f)) && fs.statSync(path.join(ROOT, f)).isFile());
}

function isBinary(file, buf) {
  if (BINARY_EXT.has(path.extname(file).toLowerCase())) return true;
  return buf.subarray(0, 8000).includes(0);
}

const ROOT = (() => {
  try { return git(['rev-parse', '--show-toplevel']).trim(); } catch { return path.resolve(HERE, '..'); }
})();

function main(argv) {
  const onlyConf = argv.includes('--confidential');
  const onlySecrets = argv.includes('--secrets');
  const doConf = onlyConf || !onlySecrets;
  const doSecrets = onlySecrets || !onlyConf;

  let terms = [];
  if (doConf) {
    const loaded = loadTerms();
    if (loaded === null) {
      console.error('scan: contracts/confidential-terms.local.txt is missing; confidentiality scan cannot run');
      return 2;
    }
    terms = loaded.filter((t) => t.length >= 4);
    console.log(`confidential terms loaded: ${terms.length} (values not printed)`);
  }

  const files = listFiles();
  let scanned = 0;
  let skippedBinary = 0;
  const confHits = [];
  const secretHits = [];
  const allow = loadAllowlist();
  const allowed = { confidential: 0, secrets: 0 };

  for (const rel of files) {
    const relPosix = rel.replace(/\\/g, '/');
    if (relPosix === 'contracts/scan.mjs') continue;
    const buf = fs.readFileSync(path.join(ROOT, rel));
    if (isBinary(rel, buf)) { skippedBinary++; continue; }
    scanned++;
    const lines = buf.toString('utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      const lineNo = i + 1;
      if (doConf && terms.length) {
        const c = compact(line);
        if (c && terms.some((t) => c.includes(t))) {
          if (isAllowed(allow, relPosix, lineNo, 'confidential')) allowed.confidential++;
          else confHits.push(`${relPosix}:${lineNo}`);
        }
      }
      if (doSecrets) {
        for (const [id, re] of SECRET_RULES) {
          if (re.test(line)) {
            if (isAllowed(allow, relPosix, lineNo, 'secrets')) allowed.secrets++;
            else secretHits.push(`${relPosix}:${lineNo} [${id}]`);
            break;
          }
        }
      }
    });
  }

  if (doConf) {
    console.log(`confidentiality hits: ${confHits.length} (allowlisted: ${allowed.confidential})`);
    for (const h of confHits) console.log(`  ${h}`);
  }
  if (doSecrets) {
    console.log(`secret-pattern hits: ${secretHits.length} (allowlisted: ${allowed.secrets})`);
    for (const h of secretHits) console.log(`  ${h}`);
  }
  console.log(`scanned ${scanned} text file(s); skipped ${skippedBinary} binary file(s); allowlist entries: ${allow.length}`);
  return confHits.length + secretHits.length > 0 ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
