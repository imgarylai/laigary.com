// Rebuild code-native SVG and PNG icons from the same geometry as the site.
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { Resvg, initWasm } from "@resvg/resvg-wasm";
import { BUBBLE_TEA_BACKGROUND, BUBBLE_TEA_SHAPES } from "../src/lib/brand.ts";

const require = createRequire(import.meta.url);
const serializeShape = ({ type, props }: { type: string; props: object }) => {
  const attributes = Object.entries(props)
    .map(
      ([key, value]) =>
        `${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}="${value}"`,
    )
    .join(" ");
  return `<${type} ${attributes}/>`;
};
const drawing = BUBBLE_TEA_SHAPES.map(serializeShape).join("");
const background = BUBBLE_TEA_BACKGROUND.map(serializeShape).join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${background}<g transform="translate(4 2)">${drawing}</g></svg>\n`;
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g transform="translate(4 2)">${drawing}</g></svg>\n`;
await writeFile("public/favicon.svg", logoSvg);
await writeFile("public/app-icon.svg", svg);
await writeFile("public/logo.svg", logoSvg);
await initWasm(await readFile(require.resolve("@resvg/resvg-wasm/index_bg.wasm")));
for (const [file, width, source] of [
  ["favicon-32.png", 32, logoSvg],
  ["apple-touch-icon.png", 180, svg],
  ["icon-192.png", 192, svg],
  ["icon-512.png", 512, svg],
  ["logo.png", 512, logoSvg],
] as const) {
  const renderer = new Resvg(source, { fitTo: { mode: "width", value: width } });
  const rendered = renderer.render();
  try {
    await writeFile(`public/${file}`, rendered.asPng());
  } finally {
    rendered.free();
    renderer.free();
  }
}
