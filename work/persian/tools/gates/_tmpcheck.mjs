const { sceneStartsInfo } = await import("./tools/gates/lib.mjs");
for (const [f,tot] of [["../htmlfilm/s10-factory-parsa/events.json",600],["../htmlfilm/s11-sabadak-app/events.json",540]]) {
  const r = sceneStartsInfo(f, tot);
  console.log(f, "->", JSON.stringify(r.starts), "|", r.source);
}
