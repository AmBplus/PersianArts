import fs from "node:fs";
for (const f of ["work/persian/htmlfilm/s10-factory-parsa/film.html","work/persian/htmlfilm/s11-sabadak-app/film.html"]) {
  const t = fs.readFileSync(f,"utf8");
  const m = [...t.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const body = m[m.length-1][1];
  fs.writeFileSync("work/persian/htmlfilm/_check.js", body);
  const { execFileSync } = await import("node:child_process");
  try { execFileSync(process.execPath, ["--check","work/persian/htmlfilm/_check.js"], {stdio:"inherit"}); console.log("SYNTAX OK "+f); }
  catch(e){ console.log("SYNTAX FAIL "+f); }
}
const { sceneStartsInfo } = await import("./work/persian/tools/gates/lib.mjs");
for (const [f,tot] of [["work/persian/htmlfilm/s10-factory-parsa/events.json",600],["work/persian/htmlfilm/s11-sabadak-app/events.json",540]]) {
  const r = sceneStartsInfo(f, tot);
  console.log(f, "->", JSON.stringify(r.starts), r.source);
}
