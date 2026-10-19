import fs from "node:fs";
const t = fs.readFileSync("work/persian/htmlfilm/s12-pikavar-route/film.html", "utf8");
t.split("\n").forEach((s, i) => { const m = s.match(/"(rgba\([^"]*)"/g); if (m) for (const q of m) if (!/\)$/.test(q.slice(0, -1))) console.log((i + 1) + ": " + q + "   ||  " + s.trim().slice(0, 90)); });
