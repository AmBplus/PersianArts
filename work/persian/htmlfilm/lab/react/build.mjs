// node build.mjs react|preact  -> film.<mode>.html (single self-contained file: header comment + CSS + base64 font + bundled JS)
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
const mode = process.argv[2] || "react", t0 = performance.now();
const src = readFileSync("film.jsx", "utf8");
const header = src.match(/^\/\*([\s\S]*?)\*\//)[1].replace(/--/g, "- -");
const res = await build({ entryPoints: ["film.jsx"], bundle: true, minify: true, write: false, format: "iife", target: "chrome120",
  jsx: "automatic", ...(mode === "preact" ? { jsxImportSource: "preact" } : {}),
  alias: { rt: mode === "preact" ? "./rt.preact.js" : "./rt.react.js" },
  define: { "process.env.NODE_ENV": '"production"' }, logLevel: "error" });
const js = res.outputFiles[0].text.replace(/<\/script/g, "<\\/script");
const font = readFileSync("../../pencil/fonts/Vazirmatn-Variable.ttf").toString("base64");
const html = `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>hook ${mode}</title>
<!--${header}-->
<style>@font-face{font-family:"PAHead";src:url(data:font/ttf;base64,${font}) format("truetype");font-weight:100 900;font-display:block}
html,body{margin:0;height:100%;background:#0d0c12;overflow:hidden}
#stage{position:relative;width:1080px;height:1920px;overflow:hidden;transform-origin:0 0;direction:rtl;background:#f6efe2}
#stage .layer{position:absolute;inset:0}
#stage .txt{position:absolute;display:flex;flex-direction:column;text-align:center;direction:rtl;letter-spacing:0;line-height:1.45;white-space:normal}</style></head>
<body><div id="stage"></div><script>${js}</script></body></html>`;
writeFileSync(`film.${mode}.html`, html);
console.log(mode, "build", ((performance.now() - t0) / 1000).toFixed(2) + "s", "size", html.length, "js", js.length);
