// node work/persian/htmlfilm/lib/pa-selftest.mjs : tiny self-test for the html-film libs (no browser needed)
import { readFileSync } from "node:fs";
import vm from "node:vm";
const dir = new URL(".", import.meta.url);
const ctx = vm.createContext({ Math, Object, Uint8Array, Map, Set, String, console, globalThis: null }); ctx.globalThis = ctx;
for (const f of ["pa-motion.js", "pa-camera.js", "pa-maze.js", "pa-chain.js", "pa-ink.js"]) vm.runInContext(readFileSync(new URL(f, dir), "utf8"), ctx, { filename: f });
const PA = ctx.PA;
PA.selfTest();
PA.selfTest2();
PA.selfTest3();
const m1 = PA.maze({ cols: 6, rows: 10, seed: 7 }), m2 = PA.maze({ cols: 6, rows: 10, seed: 7 });
if (JSON.stringify(m1.walls) !== JSON.stringify(m2.walls)) throw new Error("maze not deterministic");
const path = m1.solve([0, 9], [5, 0]); if (path.length < 11) throw new Error("solution too short");
if (PA.faDigits(10) !== "۱۰") throw new Error("faDigits");
console.log("pa libs selftest PASS; maze solution cells:", path.length);
