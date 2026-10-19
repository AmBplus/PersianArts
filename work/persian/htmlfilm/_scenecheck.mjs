const { sceneStartsInfo } = await import("file:///D:/P/project/persianArts/work/persian/tools/gates/lib.mjs");
for (const [f,tot] of [["D:/P/project/persianArts/work/persian/htmlfilm/s10-factory-parsa/events.json",600],["D:/P/project/persianArts/work/persian/htmlfilm/s11-sabadak-app/events.json",540]]) {
  const r = sceneStartsInfo(f, tot);
  console.log(f.split("/").slice(-2).join("/"), "->", JSON.stringify(r.starts), "|", r.source);
}
