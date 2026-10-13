#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';

const categories = ['idea', 'code', 'process'];
const proofGroups = ['requirements', 'reading', 'bidi', 'font', 'preservePositive'];
const frameFlags = ['noOverlap', 'rtlReadable', 'logoContrast', 'safeArea', 'focalPoint', 'scenePurpose'];
const outcomes = new Set(['success', 'failed', 'partial', 'blocked', 'cancelled']);
const statuses = new Set(['pass', 'fail', 'not-run', 'unknown']);
const reviewScopes = new Set(['structural', 'visual', 'audio', 'content', 'process']);

function validate(productionDir, repoRoot, stage) {
  const errors = [];
  const fail = (message) => errors.push(message);
  const fileAtRoot = (relative, label) => {
    if (typeof relative !== 'string' || !relative.trim()) { fail(`${label}: path is required`); return null; }
    const full = path.resolve(repoRoot, relative);
    if (!fs.existsSync(full) || !fs.statSync(full).isFile()) { fail(`${label}: missing evidence/file: ${relative}`); return null; }
    return full;
  };
  const readJson = (filename, label) => {
    const full = path.join(productionDir, filename);
    try { return JSON.parse(fs.readFileSync(full, 'utf8')); }
    catch (error) { fail(`${label}: cannot read valid JSON (${error.message})`); return null; }
  };
  const evidence = (items, label) => {
    if (!Array.isArray(items) || items.length === 0) { fail(`${label}: at least one evidence path is required`); return; }
    items.forEach((item, i) => {
      const full = fileAtRoot(typeof item === 'string' ? item : item?.path, `${label}[${i}]`);
      if (item && typeof item === 'object' && item.sha256) {
        const actual = full && crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
        if (!/^[a-f0-9]{64}$/i.test(item.sha256) || actual?.toLowerCase() !== item.sha256.toLowerCase()) fail(`${label}[${i}]: evidence SHA-256 is missing or stale`);
      }
    });
  };
  const manifest = readJson('process.json', 'process.json');
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) { fail('process.json must be an object'); return errors; }
  if (!['draft', 'preflight', 'delivery'].includes(manifest.status)) fail('status must be draft, preflight, or delivery');
  if (stage !== 'structural' && manifest.status !== stage) fail(`${stage} gate requires status=${stage}; current status is ${manifest.status}`);

  const sourceList = [{ ...manifest.source, label: 'source' }, ...(Array.isArray(manifest.sourceFiles) ? manifest.sourceFiles.map((x, i) => ({ ...x, label: `sourceFiles[${i}]` })) : [])];
  if (stage !== 'structural' && (!Array.isArray(manifest.sourceFiles) || manifest.sourceFiles.length === 0)) fail('sourceFiles must enumerate every consumed source file with current hashes');
  if (manifest.sourceFiles !== undefined && !Array.isArray(manifest.sourceFiles)) fail('sourceFiles must be an array');
  if (Array.isArray(manifest.sourceFiles) && manifest.source && !manifest.sourceFiles.some(x => x?.path === manifest.source.path)) fail('sourceFiles must include the primary source.path');
  if (Array.isArray(manifest.sourceFiles) && new Set(manifest.sourceFiles.map(x => x?.path)).size !== manifest.sourceFiles.length) fail('sourceFiles contains duplicate paths');
  const director = manifest.director && { ...manifest.director, label: 'director' };
  if (!manifest.source || !director) fail('source and director objects are required');
  const hashItems = [...sourceList, ...(director ? [director] : [])];
  for (const item of hashItems) {
    if (!item.path || !/^[a-f0-9]{64}$/i.test(item.sha256 ?? '')) { fail(`${item.label}: path and SHA-256 are required`); continue; }
    if (stage !== 'structural') {
      const full = fileAtRoot(item.path, item.label);
      if (full) {
        const actual = crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
        if (actual.toLowerCase() !== item.sha256.toLowerCase()) fail(`${item.label}: stale SHA-256 for ${item.path}`);
      }
    }
  }

  if (!Array.isArray(manifest.decisionRefs) || manifest.decisionRefs.length === 0 || manifest.decisionRefs.some(x => typeof x !== 'string' || !x.trim())) fail('decisionRefs must name at least one decision');
  if (stage !== 'structural') {
    const ledger = fileAtRoot(manifest.decisionLedger ?? 'docs/motion/DECISIONS.jsonl', 'decisionLedger');
    if (ledger) try {
      const ids = new Set(fs.readFileSync(ledger, 'utf8').split(/\r?\n/).filter(x => x.trim()).map(x => JSON.parse(x).id).filter(Boolean));
      for (const ref of Array.isArray(manifest.decisionRefs) ? manifest.decisionRefs : []) if (!ids.has(ref)) fail('decisionRefs: unknown decision ' + ref);
    } catch { fail('decisionLedger must contain valid JSONL'); }
  }
  if (!Array.isArray(manifest.constraints) || manifest.constraints.length === 0 || manifest.constraints.some(x => typeof x !== 'string' || !x.trim())) fail('constraints must contain at least one explicit constraint');

  if (!manifest.reuseLedger || typeof manifest.reuseLedger !== 'object') fail('reuseLedger is required');
  for (const category of categories) {
    const ledger = manifest.reuseLedger?.[category];
    if (!ledger || !Array.isArray(ledger.eligible) || ledger.eligible.length === 0 || !Array.isArray(ledger.observed)) { fail(`reuseLedger.${category}: eligible[] and observed[] are required; eligible denominator cannot be empty`); continue; }
    const eligibleIds = new Set();
    for (const [i, row] of ledger.eligible.entries()) {
      if (!row?.id || eligibleIds.has(row.id)) fail(`reuseLedger.${category}.eligible[${i}]: id is missing or duplicated`);
      eligibleIds.add(row?.id);
      if (stage !== 'structural') evidence([row?.evidence], `reuseLedger.${category}.eligible[${i}]`);
    }
    const observedIds = new Set();
    for (const [i, row] of ledger.observed.entries()) {
      if (!row?.id || observedIds.has(row.id) || !eligibleIds.has(row.id)) fail(`reuseLedger.${category}.observed[${i}]: id must be unique and present in eligible[]`);
      observedIds.add(row?.id);
      if (stage !== 'structural') evidence([row?.evidence], `reuseLedger.${category}.observed[${i}]`);
    }
  }

  const actionsPath = path.join(productionDir, 'actions.jsonl');
  let actions = [];
  try {
    const lines = fs.readFileSync(actionsPath, 'utf8').split(/\r?\n/).filter(x => x.trim());
    if (!lines.length) fail('actions.jsonl must contain at least one completed action');
    actions = lines.map((line, i) => { try { return JSON.parse(line); } catch { fail(`actions.jsonl:${i + 1} is invalid JSON`); return null; } }).filter(Boolean);
  } catch { fail('actions.jsonl is missing or unreadable'); }
  const actionIds = new Set();
  for (const [i, a] of actions.entries()) {
    const label = `actions.jsonl:${i + 1}`;
    if (!a.id || actionIds.has(a.id)) fail(`${label}: id is missing or duplicated`);
    actionIds.add(a.id);
    for (const key of ['actor', 'model', 'reasoning', 'reason']) if (typeof a[key] !== 'string' || !a[key].trim()) fail(`${label}: ${key} is required`);
    if (!reviewScopes.has(a.scope)) fail(`${label}: scope must be structural, visual, audio, content, or process`);
    if (a.parentId !== null && (typeof a.parentId !== 'string' || !a.parentId.trim())) fail(`${label}: parentId must be a string or null`);
    if (a.retryOf !== null && (typeof a.retryOf !== 'string' || !a.retryOf.trim())) fail(`${label}: retryOf must be a string or null`);
    for (const key of ['phase', 'howApplied']) if (typeof a[key] !== 'string' || !a[key].trim()) fail(label + ': ' + key + ' is required');
    for (const key of ['inputs','tools','skills','components','ideaRefs']) if (!Array.isArray(a[key]) || a[key].some(x => typeof x !== 'string' || !x.trim())) fail(label + ': ' + key + ' must explicitly list used items (empty means none)');
    if (!['measured','legacy-unknown'].includes(a.timingStatus)) fail(`${label}: timingStatus must be measured or legacy-unknown`);
    if (a.timingStatus === 'measured') {
      if (!Number.isFinite(a.timeboxMinutes) || a.timeboxMinutes <= 0) fail(`${label}: positive timeboxMinutes is required for measured rows`);
      const issued = Date.parse(a.issuedAt), start = Date.parse(a.startedAt), end = Date.parse(a.endedAt);
      if (![issued,start,end].every(Number.isFinite) || issued > start || start > end) fail(`${label}: measured rows require real issuedAt <= startedAt <= endedAt timestamps`);
    } else if (a.issuedAt !== null || a.startedAt !== null || a.endedAt !== null || a.timeboxMinutes !== null) fail(`${label}: legacy-unknown rows must use null timestamps/timebox; do not infer elapsed time`);
    if (!outcomes.has(a.outcome)) fail(`${label}: outcome must be one of ${[...outcomes].join(', ')}`);
    if (!Array.isArray(a.reviewedOutcomes) || a.reviewedOutcomes.length === 0) fail(`${label}: at least one scoped reviewedOutcomes entry is required`);
    else for (const [j, review] of a.reviewedOutcomes.entries()) {
      if (!reviewScopes.has(review?.scope) || !statuses.has(review?.result)) fail(`${label}.reviewedOutcomes[${j}]: scope and result are required`);
      if (stage !== 'structural' && Array.isArray(review?.evidence) && review.evidence.length) evidence(review.evidence, `${label}.reviewedOutcomes[${j}]`);
    }
    if (a.retryOf && !actions.slice(0,i).some(x => x?.id === a.retryOf)) fail(`${label}: retryOf must reference an earlier completed action`);
    if (a.parentId === a.id || a.retryOf === a.id) fail(`${label}: action cannot link to itself`);
    if (a.parentId && !actions.some(x => x?.id === a.parentId)) fail(`${label}: parentId must reference an action id in this log`);
  }
  const visiting = new Set(), visited = new Set(), byId = new Map(actions.map(a => [a.id,a]));
  const walk = id => { if (visiting.has(id)) { fail('actions: parent/retry cycle at ' + id); return; } if (visited.has(id)) return; visiting.add(id); const a=byId.get(id); for (const link of [a?.parentId,a?.retryOf]) if (typeof link === 'string' && byId.has(link)) walk(link); visiting.delete(id); visited.add(id); };
  for (const id of byId.keys()) walk(id);
  if (stage === 'structural') return errors;

  if (stage === 'preflight' || stage === 'delivery') {
    if (!manifest.reviewedAgainst || !manifest.reviewedAgainst.director || !Array.isArray(manifest.reviewedAgainst.sourceFiles)) fail('reviewedAgainst must bind the review to current sourceFiles and director hashes');
    else {
      const same = (a,b) => a?.path === b?.path && String(a?.sha256).toLowerCase() === String(b?.sha256).toLowerCase();
      if (!same(manifest.director,manifest.reviewedAgainst.director)) fail('reviewedAgainst director hash does not match current director');
      if (!Array.isArray(manifest.sourceFiles) || manifest.sourceFiles.length !== manifest.reviewedAgainst.sourceFiles.length || manifest.sourceFiles.some(x => !manifest.reviewedAgainst.sourceFiles.some(y => same(x,y)))) fail('reviewedAgainst sourceFiles do not exactly match current hashes');
    }
    const frames = manifest.frameChecks;
    if (!Array.isArray(frames) || frames.length === 0) fail('frameChecks must include sampled-frame reviews');
    else for (const [i, frame] of frames.entries()) {
      if (!Number.isInteger(frame?.frame) || frame.frame < 0) fail('frameChecks['+i+']: frame must be a nonnegative integer');
      if (typeof frame?.composition !== 'string' || !frame.composition.trim() || !['9:16','1:1','4:5','16:9'].includes(frame?.ratio)) fail('frameChecks['+i+']: composition and supported ratio are required');
      for (const flag of frameFlags) if (frame?.[flag] !== true) fail(`frameChecks[${i}].${flag} must be true; unknown/false cannot pass preflight`);
      if (!Array.isArray(frame?.evidence) || frame.evidence.some(x => !x?.sha256)) fail(`frameChecks[${i}] evidence needs the inspected still's current SHA-256`);
      else evidence(frame.evidence, `frameChecks[${i}]`);
    }
  }
  if (stage === 'delivery') {
    if (!manifest.requiredEvidence || typeof manifest.requiredEvidence !== 'object') fail('requiredEvidence is required for delivery');
    if (JSON.stringify(manifest.reviewedAgainst?.requiredEvidence) !== JSON.stringify(manifest.requiredEvidence)) fail('reviewedAgainst.requiredEvidence must exactly match current delivery checks and hashes');
    for (const group of proofGroups) {
      const checks = manifest.requiredEvidence?.[group];
      if (!Array.isArray(checks) || checks.length === 0) { fail(`requiredEvidence.${group} needs at least one check`); continue; }
      for (const [i, check] of checks.entries()) {
        if (!check?.id || !statuses.has(check.status)) fail(`requiredEvidence.${group}[${i}] needs id and status pass|fail|not-run|unknown`);
        if (check?.status !== 'pass') fail(`requiredEvidence.${group}[${i}] is ${check?.status ?? 'unknown'}; delivery requires pass`);
        if (!Array.isArray(check?.evidence) || check.evidence.some(e => typeof e !== 'object' || !e?.sha256)) fail(`requiredEvidence.${group}[${i}]: hashed evidence objects required`);
        evidence(check?.evidence, `requiredEvidence.${group}[${i}]`);
      }
    }
  }
  return errors;
}

function selfTest() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'film-process-gates-'));
  const root = path.join(temp, 'repo'), prod = path.join(root, 'production');
  fs.mkdirSync(prod, { recursive: true });
  const put = (relative, value) => { const p = path.join(root, relative); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, value); };
  put('src.tsx', 'source'); put('director.json', 'director'); put('evidence.txt', 'evidence'); put('docs/motion/DECISIONS.jsonl', JSON.stringify({id:'D1'})+'\n');
  const hash = p => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, p))).digest('hex');
  const proof = () => ['requirements','reading','bidi','font','preservePositive'].map(id => ({ [id]: [{ id: 'check-1', status: 'pass', evidence: [{path:'evidence.txt',sha256:hash('evidence.txt')}] }] }));
  const manifest = () => ({ status:'delivery', source:{path:'src.tsx',sha256:hash('src.tsx')}, sourceFiles:[{path:'src.tsx',sha256:hash('src.tsx')}], director:{path:'director.json',sha256:hash('director.json')}, reviewedAgainst:{sourceFiles:[{path:'src.tsx',sha256:hash('src.tsx')}],director:{path:'director.json',sha256:hash('director.json')}}, decisionRefs:['D1'], constraints:['Keep title readable'], reuseLedger:Object.fromEntries(categories.map(c => [c,{eligible:[{id:'op-1',evidence:'evidence.txt'}],observed:[{id:'op-1',evidence:'evidence.txt'}]}])), frameChecks:[{frame:12,composition:'Example',ratio:'9:16',...Object.fromEntries(frameFlags.map(f=>[f,true])),evidence:[{path:'evidence.txt',sha256:hash('evidence.txt')}]}], requiredEvidence:Object.fromEntries(proof().map(Object.entries).flat()), });
  const write = (m, actionEvidence=['evidence.txt']) => {
    m.reviewedAgainst.requiredEvidence = JSON.parse(JSON.stringify(m.requiredEvidence ?? {}));
    fs.writeFileSync(path.join(prod,'process.json'), JSON.stringify(m));
    fs.writeFileSync(path.join(prod,'actions.jsonl'), JSON.stringify({id:'a1',parentId:null,retryOf:null,timingStatus:'measured',issuedAt:'2026-10-13T06:59:59Z',startedAt:'2026-10-13T07:00:00Z',endedAt:'2026-10-13T07:00:01Z',outcome:'success',scope:'structural',actor:'agent',model:'gpt-6-luna',reasoning:'low',reason:'bounded task',phase:'review',inputs:['src.tsx'],tools:['gate'],skills:[],components:[],ideaRefs:[],howApplied:'Validated declared record',timeboxMinutes:2,reviewedOutcomes:[{scope:'structural',result:'pass',evidence:actionEvidence}]})+'\n');
  };
  const cases = [];
  write(manifest()); cases.push(['valid delivery', validate(prod,root,'delivery').length === 0]);
  const draft = manifest(); draft.status = 'draft'; delete draft.frameChecks; delete draft.requiredEvidence; write(draft); cases.push(['honest draft passes structural only', validate(prod,root,'structural').length === 0 && validate(prod,root,'preflight').length > 0]);
  write(manifest()); const legacy=JSON.parse(fs.readFileSync(path.join(prod,'actions.jsonl'),'utf8')); legacy.timingStatus='legacy-unknown'; legacy.issuedAt=legacy.startedAt=legacy.endedAt=legacy.timeboxMinutes=null; legacy.reviewedOutcomes=[{scope:'process',result:'not-run',evidence:[]}]; fs.writeFileSync(path.join(prod,'actions.jsonl'),JSON.stringify(legacy)+'\n'); cases.push(['legacy timing unknown remains structural without duration', validate(prod,root,'structural').length === 0]);
  const legacyReady=manifest(); legacyReady.status='preflight'; fs.writeFileSync(path.join(prod,'process.json'),JSON.stringify(legacyReady)); cases.push(['legacy untimed process history does not block current preflight', validate(prod,root,'preflight').length === 0]);
  write(manifest(),['missing.txt']); cases.push(['missing evidence rejected', validate(prod,root,'delivery').length > 0]);
  const stale = manifest(); stale.sourceFiles[0].sha256 = '0'.repeat(64); write(stale); cases.push(['stale hash rejected', validate(prod,root,'preflight').some(x=>x.includes('stale SHA-256'))]);
  const staleReview = manifest(); staleReview.reviewedAgainst.sourceFiles[0].sha256 = '0'.repeat(64); write(staleReview); cases.push(['stale reviewed snapshot rejected', validate(prod,root,'preflight').some(x=>x.includes('reviewedAgainst sourceFiles'))]);
  const staleStill = manifest(); staleStill.frameChecks[0].evidence[0].sha256 = '0'.repeat(64); write(staleStill); cases.push(['stale reviewed still rejected', validate(prod,root,'preflight').some(x=>x.includes('evidence SHA-256'))]);
  write(manifest()); const oldFailure=JSON.parse(fs.readFileSync(path.join(prod,'actions.jsonl'),'utf8')); oldFailure.outcome='failed'; oldFailure.reviewedOutcomes[0].result='fail'; fs.writeFileSync(path.join(prod,'actions.jsonl'),JSON.stringify(oldFailure)+'\n'); const current=manifest(); current.status='preflight'; fs.writeFileSync(path.join(prod,'process.json'),JSON.stringify(current)); cases.push(['historical failure does not block current preflight', validate(prod,root,'preflight').length === 0]);
  const unknown = manifest(); unknown.requiredEvidence.reading[0].status = 'unknown'; write(unknown); cases.push(['unknown delivery status rejected', validate(prod,root,'delivery').some(x=>x.includes('requires pass'))]);
  const wrongStage = manifest(); wrongStage.status='preflight'; write(wrongStage); cases.push(['delivery status mismatch rejected', validate(prod,root,'delivery').some(x=>x.includes('requires status=delivery'))]);
  const noFrame=manifest(); delete noFrame.frameChecks[0].frame; write(noFrame); cases.push(['missing frame identity rejected',validate(prod,root,'delivery').some(x=>x.includes('nonnegative integer'))]);
  const fakeDecision=manifest(); fakeDecision.decisionRefs=['invented']; write(fakeDecision); cases.push(['invented decision rejected',validate(prod,root,'delivery').some(x=>x.includes('unknown decision'))]);
  write(manifest()); const cycle=JSON.parse(fs.readFileSync(path.join(prod,'actions.jsonl'),'utf8'));cycle.retryOf=cycle.parentId=cycle.id;fs.writeFileSync(path.join(prod,'actions.jsonl'),JSON.stringify(cycle));cases.push(['self cycle and non-earlier retry rejected',validate(prod,root,'delivery').some(x=>x.includes('earlier completed')) && validate(prod,root,'delivery').some(x=>x.includes('cycle'))]);
  const changed=manifest();write(changed);put('evidence.txt','changed');changed.frameChecks[0].evidence[0].sha256=hash('evidence.txt');fs.writeFileSync(path.join(prod,'process.json'),JSON.stringify(changed));cases.push(['changed required evidence rejected despite fresh still hash',validate(prod,root,'delivery').some(x=>x.includes('evidence SHA-256'))]);
  fs.rmSync(temp,{recursive:true,force:true});
  for (const [name, pass] of cases) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
  return cases.every(x=>x[1]) ? 0 : 1;
}

function usage() { console.error('Usage: node film-process-gates.mjs --production-dir <path> --root <repo-root> --stage structural|preflight|delivery\n       node film-process-gates.mjs --self-test'); }
const args = process.argv.slice(2);
if (args.includes('--self-test')) process.exitCode = selfTest();
else {
  const get = flag => { const i = args.indexOf(flag); return i < 0 ? null : args[i + 1]; };
  const productionDir = get('--production-dir'), repoRoot = get('--root'), stage = get('--stage');
  if (!productionDir || !repoRoot || !['structural','preflight','delivery'].includes(stage)) { usage(); process.exitCode = 2; }
  else {
    const errors = validate(path.resolve(productionDir), path.resolve(repoRoot), stage);
    if (errors.length) { console.error(`FAIL ${stage}: ${errors.length} issue(s)`); errors.forEach(e => console.error(`- ${e}`)); process.exitCode = 1; }
    else {
      console.log(`PASS ${stage}: all required declarations and evidence paths validated.`);
      const rows = fs.readFileSync(path.join(path.resolve(productionDir),'actions.jsonl'),'utf8').split(/\r?\n/).filter(x=>x.trim()).map(JSON.parse);
      const timed = rows.filter(x => x.timingStatus === 'measured');
      const retries = rows.filter(x => x.retryOf).length;
      const overruns = timed.filter(x => (Date.parse(x.endedAt)-Date.parse(x.startedAt))/60000 > x.timeboxMinutes).length;
      const phases = Object.fromEntries([...new Set(rows.map(x=>x.phase))].map(p=>[p,{measuredSeconds:timed.filter(x=>x.phase===p).reduce((n,x)=>n+(Date.parse(x.endedAt)-Date.parse(x.startedAt))/1000,0),unknownActions:rows.filter(x=>x.phase===p && x.timingStatus!=='measured').length,intervals:timed.filter(x=>x.phase===p).map(x=>({id:x.id,start:x.startedAt,end:x.endedAt}))}]));
      console.log('Measured phase intervals (sum of elapsed spans, not active work or session wall time; waits and overlaps may be included): '+JSON.stringify(phases));
      const scopes = Object.fromEntries([...reviewScopes].map(s => [s, rows.filter(x=>x.scope===s).length]));
      console.log(`Actions=${rows.length}; timing coverage=${timed.length}/${rows.length}; retries=${retries}; overruns=${overruns} among measured actions; scopes=${JSON.stringify(scopes)}.`);
      if (stage !== 'structural') {
        for (const c of categories) { const ledger = JSON.parse(fs.readFileSync(path.join(path.resolve(productionDir),'process.json'),'utf8')).reuseLedger[c]; console.log(`Reuse ${c}: ${ledger.observed.length}/${ledger.eligible.length} distinct opportunities (${(100*ledger.observed.length/ledger.eligible.length).toFixed(1)}%).`); }
        console.log('Frame and evidence flags are declarations backed by files; this command does not judge visual quality.');
      }
    }
  }
}



