import fs from "node:fs";
const p = "work/persian/htmlfilm/s12-pikavar-route/film.html";
const t = fs.readFileSync(p, "utf8");
const bad = '"rgba(8,32,44,0.75")';
const good = '"rgba(8,32,44,0.75)"';
const n = t.split(bad).length - 1;
fs.writeFileSync(p, t.split(bad).join(good), "utf8");
console.log("replacements:", n);
