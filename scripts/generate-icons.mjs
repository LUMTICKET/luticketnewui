// Regenerates every app icon from the single master mark at src/app/icon.svg.
// Run after swapping the logo: `npm run icons`.
import { readFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const root = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(root, "..");
const NAVY = "#0B1220";

const svgPath = path.join(webRoot, "src/app/icon.svg");
const svg = await readFile(svgPath);

const iconsDir = path.join(webRoot, "public/icons");
await mkdir(iconsDir, { recursive: true });

async function renderSquare(size, outPath) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log("wrote", path.relative(webRoot, outPath));
}

async function renderMaskable(size, outPath, scale = 0.72) {
  const inner = Math.round(size * scale);
  const pad = Math.round((size - inner) / 2);
  const base = await sharp(svg, { density: 384 })
    .resize(inner, inner)
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: NAVY,
    },
  })
    .composite([{ input: base, top: pad, left: pad }])
    .png()
    .toFile(outPath);
  console.log("wrote", path.relative(webRoot, outPath));
}

await renderSquare(180, path.join(webRoot, "src/app/apple-icon.png"));
await renderSquare(192, path.join(iconsDir, "icon-192.png"));
await renderSquare(512, path.join(iconsDir, "icon-512.png"));
await renderMaskable(512, path.join(iconsDir, "icon-maskable-512.png"));
