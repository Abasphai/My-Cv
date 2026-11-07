import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const assets = {};
const images = await readdir(new URL("web/images/", root));
for (const [file, type] of [
  ["index.html", "text/html; charset=utf-8"],
  ["style.css", "text/css; charset=utf-8"],
  ...images.map(name => [`images/${name}`, "image/webp"]),
]) {
  const contents = await readFile(new URL(`web/${file}`, root));
  assets[`/${file}`] = [type, contents.toString("base64")];
}
const worker = await readFile(new URL("server/worker.mjs", root), "utf8");
await mkdir(new URL("dist/server/", root), { recursive: true });
await writeFile(new URL("dist/server/index.js", root),
  `${worker}\nexport default createWorker(${JSON.stringify(assets)});\n`);
