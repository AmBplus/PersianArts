import fs from 'node:fs';
const manifest=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const source=fs.readFileSync(process.argv[3],'utf8');
const checks=[['duration',manifest.durationInFrames===405],['portrait',manifest.width===1080&&manifest.height===1920],['font',source.includes('FaRoot family="Estedad"')],['persian spacing',!source.includes('letterSpacing:1')],['four copy beats',manifest.copy.length===4]];
for(const [name,ok] of checks) console.log(`${ok?'PASS':'FAIL'} ${name}`);
if(checks.some(([,ok])=>!ok)) process.exitCode=1;
