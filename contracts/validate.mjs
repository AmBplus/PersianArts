#!/usr/bin/env node
// Minimal JSON Schema validator for contracts/ (no dependencies).
// Supports the subset used by contracts/schemas: type, enum, const, required, properties,
// additionalProperties (boolean or schema), items, minItems, maxItems, minLength, pattern,
// minimum, maximum, anyOf. Anything else in a schema is ignored.
//
// Usage:
//   node contracts/validate.mjs <schema> <file>   schema: a path or a name (film, version, cue-sheet, brief, decision)
//                                                 file: .json, or .jsonl (every non-empty line is validated)
//   node contracts/validate.mjs --selftest         validate contracts/examples/*, then check a broken copy is rejected
//   node contracts/validate.mjs --all              validate docs/motion/DECISIONS.jsonl, films/*/film.json,
//                                                  films/*/cues.json, media/film-versions/**/VERSION.json (those that exist)
// Exit code 0 = all pass, 1 = any failure, 2 = usage error.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SCHEMA_DIR = path.join(HERE, 'schemas');
const EXAMPLE_DIR = path.join(HERE, 'examples');

function typeName(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

function hasType(v, t) {
  if (t === 'integer') return Number.isInteger(v);
  if (t === 'number') return typeof v === 'number' && Number.isFinite(v);
  if (t === 'object') return v !== null && typeof v === 'object' && !Array.isArray(v);
  return typeName(v) === t;
}

export function validate(schema, value, at = '$', errs = []) {
  if (schema === true || schema === undefined) return errs;
  if (schema === false) { errs.push(`${at}: not allowed`); return errs; }

  if (schema.type !== undefined) {
    const types = [].concat(schema.type);
    if (!types.some((t) => hasType(value, t))) {
      errs.push(`${at}: expected ${types.join(' or ')}, got ${typeName(value)}`);
      return errs; // further keywords assume the right type
    }
  }
  if (schema.enum !== undefined && !schema.enum.some((e) => JSON.stringify(e) === JSON.stringify(value))) {
    errs.push(`${at}: not one of the allowed values (${schema.enum.map((e) => JSON.stringify(e)).join(', ')})`);
  }
  if (schema.const !== undefined && JSON.stringify(schema.const) !== JSON.stringify(value)) {
    errs.push(`${at}: must equal ${JSON.stringify(schema.const)}`);
  }
  if (schema.anyOf !== undefined) {
    const ok = schema.anyOf.some((s) => validate(s, value, at, []).length === 0);
    if (!ok) errs.push(`${at}: matches none of the anyOf alternatives`);
  }

  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) errs.push(`${at}: shorter than ${schema.minLength}`);
    if (schema.pattern !== undefined && !new RegExp(schema.pattern, 'u').test(value)) errs.push(`${at}: does not match pattern ${schema.pattern}`);
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) errs.push(`${at}: below minimum ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) errs.push(`${at}: above maximum ${schema.maximum}`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errs.push(`${at}: fewer than ${schema.minItems} items`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errs.push(`${at}: more than ${schema.maxItems} items`);
    if (schema.items !== undefined) value.forEach((v, i) => validate(schema.items, v, `${at}[${i}]`, errs));
  }
  if (hasType(value, 'object')) {
    const props = schema.properties || {};
    for (const key of schema.required || []) {
      if (!(key in value)) errs.push(`${at}: missing required property "${key}"`);
    }
    for (const [key, v] of Object.entries(value)) {
      if (key in props) validate(props[key], v, `${at}.${key}`, errs);
      else if (schema.additionalProperties === false) errs.push(`${at}: unknown property "${key}"`);
      else if (typeof schema.additionalProperties === 'object') validate(schema.additionalProperties, v, `${at}.${key}`, errs);
    }
  }
  return errs;
}

export function resolveSchema(name) {
  const direct = path.resolve(name);
  if (name.includes('/') || name.includes('\\') || name.endsWith('.json')) {
    if (fs.existsSync(direct)) return JSON.parse(fs.readFileSync(direct, 'utf8'));
  }
  const byName = path.join(SCHEMA_DIR, `${name.replace(/\.schema\.json$/, '')}.schema.json`);
  if (fs.existsSync(byName)) return JSON.parse(fs.readFileSync(byName, 'utf8'));
  throw new Error(`schema not found: ${name}`);
}

// Returns an array of {line, errors}; a .json file gives one entry with line 0.
export function validateFile(schema, file) {
  const text = fs.readFileSync(file, 'utf8');
  const results = [];
  if (file.endsWith('.jsonl')) {
    text.split(/\r?\n/).forEach((raw, i) => {
      if (!raw.trim()) return;
      let obj;
      try { obj = JSON.parse(raw); } catch (e) { results.push({ line: i + 1, errors: [`invalid JSON: ${e.message}`] }); return; }
      results.push({ line: i + 1, errors: validate(schema, obj) });
    });
  } else {
    let obj;
    try { obj = JSON.parse(text); } catch (e) { return [{ line: 0, errors: [`invalid JSON: ${e.message}`] }]; }
    results.push({ line: 0, errors: validate(schema, obj) });
  }
  return results;
}

function report(file, results) {
  const bad = results.filter((r) => r.errors.length);
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  if (!bad.length) { console.log(`PASS ${rel}${results.length > 1 ? ` (${results.length} lines)` : ''}`); return true; }
  console.log(`FAIL ${rel}`);
  for (const r of bad) for (const e of r.errors) console.log(`  ${r.line ? `line ${r.line} ` : ''}${e}`);
  return false;
}

function walk(dir, pred, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '.git') continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, pred, out);
    else if (pred(p)) out.push(p);
  }
  return out;
}

function selftest() {
  let ok = true;
  const examples = fs.readdirSync(EXAMPLE_DIR).filter((f) => /\.(json|jsonl)$/.test(f));
  for (const f of examples) {
    const schemaName = f.split('.')[0];
    const schema = resolveSchema(schemaName === 'cue' ? 'cue-sheet' : schemaName);
    ok = report(path.join(EXAMPLE_DIR, f), validateFile(schema, path.join(EXAMPLE_DIR, f))) && ok;
  }
  // Deliberately broken copy: remove "slug" and add a bad status to the film example, must FAIL.
  const filmSchema = resolveSchema('film');
  const broken = JSON.parse(fs.readFileSync(path.join(EXAMPLE_DIR, 'film.pencil-social.json'), 'utf8'));
  delete broken.slug;
  broken.status = 'finished';
  const brokenErrs = validate(filmSchema, broken);
  if (brokenErrs.length === 0) { console.log('SELFTEST FAIL: broken film was accepted'); ok = false; }
  else console.log(`PASS broken film rejected (${brokenErrs.length} errors, e.g. "${brokenErrs[0]}")`);
  console.log(ok ? 'selftest: OK' : 'selftest: FAILED');
  return ok;
}

function all() {
  let ok = true;
  let count = 0;
  const jobs = [];
  const decisions = path.join(ROOT, 'docs', 'motion', 'DECISIONS.jsonl');
  if (fs.existsSync(decisions)) jobs.push([decisions, 'decision']);
  const filmsDir = path.join(ROOT, 'films');
  if (fs.existsSync(filmsDir)) for (const d of fs.readdirSync(filmsDir)) {
    const f = path.join(filmsDir, d, 'film.json'); if (fs.existsSync(f)) jobs.push([f, 'film']);
    const c = path.join(filmsDir, d, 'cues.json'); if (fs.existsSync(c)) jobs.push([c, 'cue-sheet']);
  }
  for (const f of walk(path.join(ROOT, 'media', 'film-versions'), (p) => path.basename(p) === 'VERSION.json')) jobs.push([f, 'version']);
  for (const [file, schemaName] of jobs) {
    count++;
    ok = report(file, validateFile(resolveSchema(schemaName), file)) && ok;
  }
  console.log(`checked ${count} file(s): ${ok ? 'all pass' : 'failures above'}`);
  return ok;
}

function main(argv) {
  if (argv[0] === '--selftest') return selftest() ? 0 : 1;
  if (argv[0] === '--all') return all() ? 0 : 1;
  if (argv.length !== 2) {
    console.error('usage: node contracts/validate.mjs <schema> <file> | --selftest | --all');
    return 2;
  }
  const schema = resolveSchema(argv[0]);
  return report(path.resolve(argv[1]), validateFile(schema, path.resolve(argv[1]))) ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
