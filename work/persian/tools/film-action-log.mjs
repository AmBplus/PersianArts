#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const outcomes = ['success','failed','partial','blocked','cancelled'];
const scopes = ['structural','visual','audio','content','process'];
const arrKeys = ['inputs','tools','skills','components','ideaRefs'];
const iso = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const atomic = (file, data) => {
  const temp = `${file}.${process.pid}.${id()}.tmp`;
  fs.writeFileSync(temp, data, {flag:'wx'});
  fs.renameSync(temp, file);
};
async function lock(dir, fn) {
  const lockDir = path.join(dir,'.action-log.lock'); let acquired = false;
  for (let i=0; i<200; i++) {
    try { fs.mkdirSync(lockDir); acquired = true; break; }
    catch (e) { if (e.code !== 'EEXIST') throw e; await delay(25); }
  }
  if (!acquired) throw new Error('Timed out waiting for action log lock; preserved source records.');
  try { return await fn(); } finally { fs.rmSync(lockDir,{recursive:true,force:true}); }
}
function ensureDirs(prod) { fs.mkdirSync(path.join(prod,'.film-actions'),{recursive:true}); }
async function rebuild(prod) {
  ensureDirs(prod);
  await lock(prod, async () => {
    const external = new Map(), externalConflicts = new Set(), local = new Map();
    const canonical = value => JSON.stringify(value && typeof value==='object' ? Array.isArray(value) ? value.map(x=>JSON.parse(canonical(x))) : Object.fromEntries(Object.keys(value).sort().map(k=>[k,JSON.parse(canonical(value[k]))])) : value);
    const add = (target,record) => {
      if(!record?.id) throw new Error('Existing action log row without id; refusing to overwrite history.');
      const prior=target.get(record.id);
      if(prior && canonical(prior)!==canonical(record)) throw new Error(`Conflicting action id ${record.id}; preserved existing logs.`);
      target.set(record.id,record);
    };
    for(const filename of ['actions.jsonl','currentprocessactions.jsonl']) {
      const file=path.join(prod,filename); if(!fs.existsSync(file)) continue;
      for(const [i,line] of fs.readFileSync(file,'utf8').split(/\r?\n/).entries()) if(line.trim()) {
        let row; try{row=JSON.parse(line);}catch{throw new Error(`${filename}:${i+1}: invalid JSON; preserved existing logs.`);}
        if(!row?.id) throw new Error(`${filename}:${i+1}: missing id; preserved existing logs.`);
        if(external.has(row.id)&&canonical(external.get(row.id))!==canonical(row)) externalConflicts.add(row.id); else if(!externalConflicts.has(row.id)) external.set(row.id,row);
      }
    }
    for(const filename of fs.readdirSync(path.join(prod,'.film-actions')).filter(x=>x.endsWith('.json'))) add(local,JSON.parse(fs.readFileSync(path.join(prod,'.film-actions',filename),'utf8')));
    for(const conflict of externalConflicts) if(!local.has(conflict)) throw new Error(`Conflicting action id ${conflict}; preserved existing logs.`);
    const merged=new Map(external); for(const [key,value] of local) merged.set(key,value);
    const records=[...merged.values()];
    records.sort((a,b)=>(a.issuedAt ?? '').localeCompare(b.issuedAt ?? '') || a.id.localeCompare(b.id));
    const data=records.map(x=>JSON.stringify(x)).join('\n')+'\n';
    atomic(path.join(prod,'actions.jsonl'),data);
    atomic(path.join(prod,'currentprocessactions.jsonl'),data);
  });
}
function readMeta(json) { try { return JSON.parse(json); } catch { throw new Error('--metadata-json/--entry-json must be valid JSON'); } }
function validateMeta(m) {
  for (const k of ['phase','model','reasoning','scope','actor','reason','howApplied']) if (typeof m[k] !== 'string' || !m[k].trim()) throw new Error(`${k} is required`);
  if (!scopes.includes(m.scope)) throw new Error(`scope must be ${scopes.join('|')}`);
  for (const k of arrKeys) if (!Array.isArray(m[k]) || m[k].some(x=>typeof x!=='string')) throw new Error(`${k} must be a string array (use [] when none)`);
  if (m.parentId !== null && typeof m.parentId !== 'string') throw new Error('parentId must be string or null');
  if (m.retryOf !== null && typeof m.retryOf !== 'string') throw new Error('retryOf must be string or null');
  if (!Number.isFinite(m.timeboxMinutes) || m.timeboxMinutes <= 0) throw new Error('positive timeboxMinutes is required');
}
function argsMap(argv) { const m={}; for(let i=0;i<argv.length;i++) { if(argv[i].startsWith('--')) m[argv[i].slice(2)]=argv[++i]; } return m; }
function usage() { console.error('Usage: node film-action-log.mjs begin|end|import-legacy|skill --production-dir <dir> [--metadata-json <json>] [--id <id>]'); }
async function main(argv) {
  const [command,...rest]=argv, a=argsMap(rest), prod=path.resolve(a['production-dir']??'');
  if (command==='self-test') return await selfTest();
  if (!a['production-dir']) { usage(); return 2; }
  if (command==='begin') {
    const m=readMeta(a['metadata-json']??'{}'); validateMeta(m); ensureDirs(prod);
    const now=iso(), action={id:id(),parentId:m.parentId,retryOf:m.retryOf,timingStatus:'measured',issuedAt:now,startedAt:now,endedAt:null,timeboxMinutes:m.timeboxMinutes,outcome:'partial',scope:m.scope,phase:m.phase,actor:m.actor,model:m.model,reasoning:m.reasoning,reason:m.reason,howApplied:m.howApplied,inputs:m.inputs,tools:m.tools,skills:m.skills,components:m.components,ideaRefs:m.ideaRefs,reviewedOutcomes:[{scope:m.scope,result:'not-run',evidence:[]}]};
    atomic(path.join(prod,'.film-actions',`${action.id}.json`),JSON.stringify(action,null,2)); await rebuild(prod); console.log(action.id); return 0;
  }
  if (command==='end') {
    if (!a.id || !outcomes.includes(a.outcome)) throw new Error('--id and valid --outcome are required');
    const f=path.join(prod,'.film-actions',`${a.id}.json`); if(!fs.existsSync(f)) throw new Error(`No action ${a.id}`);
    const action=JSON.parse(fs.readFileSync(f,'utf8')); if(action.timingStatus!=='measured'||action.endedAt) throw new Error('Action is not an open measured action');
    const reviews=readMeta(a['reviewed-outcomes-json']??'[]'); if(!Array.isArray(reviews)||reviews.length===0) throw new Error('reviewed outcomes must be a nonempty JSON array');
    for(const r of reviews) if(!scopes.includes(r.scope)||!['pass','fail','not-run','unknown'].includes(r.result)||!Array.isArray(r.evidence)) throw new Error('Each reviewed outcome needs scope, result, evidence[]');
    action.endedAt=iso(); action.outcome=a.outcome; action.reviewedOutcomes=reviews;
    atomic(f,JSON.stringify(action,null,2)); await rebuild(prod); console.log(`${action.id} ${action.startedAt} ${action.endedAt}`); return 0;
  }
  if (command==='import-legacy') {
    const m=readMeta(a['metadata-json']??'{}'); validateMeta({...m,timeboxMinutes:1});
    const action={id:id(),parentId:m.parentId,retryOf:m.retryOf,timingStatus:'legacy-unknown',issuedAt:null,startedAt:null,endedAt:null,timeboxMinutes:null,outcome:m.outcome??'partial',scope:m.scope,phase:m.phase,actor:m.actor,model:m.model,reasoning:m.reasoning,reason:m.reason,howApplied:m.howApplied,inputs:m.inputs,tools:m.tools,skills:m.skills,components:m.components,ideaRefs:m.ideaRefs,reviewedOutcomes:m.reviewedOutcomes??[{scope:m.scope,result:'unknown',evidence:[]}]};
    if(!outcomes.includes(action.outcome)) throw new Error('legacy outcome must be an allowed outcome');
    ensureDirs(prod); atomic(path.join(prod,'.film-actions',`${action.id}.json`),JSON.stringify(action,null,2)); await rebuild(prod); console.log(action.id); return 0;
  }
  if (command==='skill') {
    fs.mkdirSync(prod,{recursive:true});
    const entry=readMeta(a['entry-json']??'{}');
    for(const k of ['name','path','howApplied']) if(typeof entry[k]!=='string'||!entry[k].trim()) throw new Error(`skill ${k} is required`);
    const now=iso(); const record={id:id(),...entry,timingStatus:entry.timingStatus??'legacy-unknown',issuedAt:entry.issuedAt??null,startedAt:entry.startedAt??null,endedAt:entry.endedAt??null};
    const registry=path.join(prod,'skill-usage.json'); await lock(prod,async()=>{let all=[]; if(fs.existsSync(registry)){const prev=JSON.parse(fs.readFileSync(registry,'utf8')); all=Array.isArray(prev)?prev:prev.skills??[];} all.push(record); atomic(registry,JSON.stringify({skills:all},null,2)+'\n');});
    console.log(record.id); return 0;
  }
  usage(); return 2;
}
async function selfTest() {
  const temp=fs.mkdtempSync(path.join(process.env.TEMP??process.env.TMP??'.','film-action-log-'));
  const script=path.resolve(process.argv[1]); const prod=path.join(temp,'production'); fs.mkdirSync(prod,{recursive:true});
  const meta=JSON.stringify({phase:'test',model:'gpt-6-luna',reasoning:'low',scope:'structural',actor:'self-test',reason:'fixture',howApplied:'testing logger',inputs:[],tools:[],skills:[],components:[],ideaRefs:[],parentId:null,retryOf:null,timeboxMinutes:1});
  const call=(...args)=>spawnSync(process.execPath,[script,...args],{encoding:'utf8'});
  const callAsync=(...args)=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,[script,...args],{stdio:['ignore','pipe','pipe']});let stdout='',stderr='';child.stdout.on('data',x=>stdout+=x);child.stderr.on('data',x=>stderr+=x);child.on('error',reject);child.on('close',status=>status===0?resolve({stdout}):reject(new Error(stderr)));});
  const started=call('begin','--production-dir',prod,'--metadata-json',meta); if(started.status!==0) throw new Error(started.stderr); const actionId=started.stdout.trim();
  const bad=call('end','--production-dir',prod,'--id',actionId,'--outcome','failed','--reviewed-outcomes-json','[{"scope":"structural","result":"fail","evidence":[]}]'); if(bad.status!==0) throw new Error(bad.stderr);
  const concurrent=(await Promise.all([0,1,2].map(()=>callAsync('begin','--production-dir',prod,'--metadata-json',meta)))).map(x=>x.stdout.trim());
  const legacy=JSON.stringify({...JSON.parse(meta),outcome:'blocked',reviewedOutcomes:[{scope:'process',result:'unknown',evidence:[]}]}); const imported=call('import-legacy','--production-dir',prod,'--metadata-json',legacy); if(imported.status!==0) throw new Error(imported.stderr);
  const rows=fs.readFileSync(path.join(prod,'currentprocessactions.jsonl'),'utf8').trim().split(/\r?\n/).map(JSON.parse);
  const ok=rows.length===5&&rows.find(x=>x.id===actionId)?.outcome==='failed'&&rows.filter(x=>x.timingStatus==='measured').length===4&&rows.filter(x=>x.timingStatus==='legacy-unknown').length===1&&concurrent.every(x=>rows.some(r=>r.id===x));
  fs.rmSync(temp,{recursive:true,force:true}); console.log(ok?'PASS logger begin/end/failure retention/concurrent rebuild/legacy import':'FAIL logger fixture'); return ok?0:1;
}
main(process.argv.slice(2)).then(code=>process.exitCode=code).catch(e=>{console.error(`FAIL ${e.message}`); process.exitCode=1;});
