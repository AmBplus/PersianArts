// temp: find the first line where bracket depth goes negative or strings are unbalanced
import fs from "node:fs";
const src = fs.readFileSync(process.argv[2], "utf8");
let depth = 0, inS = null, inT = null, inLC = false, inBC = false, esc = false, inRe = false, prev = "";
const lines = src.split("\n");
for (let i = 0; i < lines.length; i++) {
  const L = lines[i];
  for (let j = 0; j < L.length; j++) {
    const c = L[j], n = L[j + 1];
    if (inLC) break;
    if (inBC) { if (c === "*" && n === "/") { inBC = false; j++; } continue; }
    if (inS) { if (esc) { esc = false; continue; } if (c === "\\") { esc = true; continue; } if (c === inS) inS = null; continue; }
    if (inT) { if (esc) { esc = false; continue; } if (c === "\\") { esc = true; continue; } if (c === inT) inT = null; continue; }
    if (c === "/" && n === "/") { inLC = true; break; }
    if (c === "/" && n === "*") { inBC = true; j++; continue; }
    if (c === "/" && /[=(,:\[!&|?{};]/.test(prev.trim().slice(-1)) && !inRe) { inRe = true; continue; }
    if (inRe) { if (esc) { esc = false; continue; } if (c === "\\") { esc = true; continue; } if (c === "/") inRe = false; continue; }
    if (!/\s/.test(c)) prev = c;
    if (c === '"' || c === "'") { inS = c; continue; }
    if (c === "`") { inT = c; continue; }
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") { depth--; if (depth < 0) { console.log("NEGATIVE at line " + (i + 1) + ": " + L.trim()); process.exit(0); } }
  }
  inLC = false;
  console.log("d" + depth + " | " + (i + 1) + " | " + L.trim().slice(0, 100));
  if (inS || inT) console.log("OPEN " + (inS ? "SINGLE/DOUBLE" : "TEMPLATE") + " at end of line " + (i + 1) + ": " + L.trim().slice(0, 120));
  if (inRe) console.log("OPEN REGEX at end of line " + (i + 1) + ": " + L.trim().slice(0, 120));
  if (inS || inT || inRe) { inS = inT = null; inRe = false; }
}
console.log("final depth", depth, "inS", inS, "inT", inT);
