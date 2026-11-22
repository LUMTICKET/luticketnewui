// Regenerates every brand asset from the single source logo:
//   public/brand/lumina-logo-source.png  (transparent RGBA, navy + gold artwork)
//
// Run with `npm run brand` after replacing the source logo. It has no native
// dependencies (see scripts/lib/png.mjs), so it works on any machine.
//
// Outputs
//   public/brand/*            logo + mark, dark-on-light and light-on-dark, PNG and SVG
//   public/icons/*            PWA icons (192, 512, 512 maskable)
//   src/app/favicon.ico       16/32/48
//   src/app/icon.svg          scalable tab icon
//   src/app/apple-icon.png    180x180 home-screen icon
//   src/app/opengraph-image.png  1200x630 social preview
//   src/lib/brand-mark.generated.ts  vector paths + brand colors used by <Logo />
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { decodePng, encodeIco, encodePng } from "./lib/png.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const at = (...parts) => join(ROOT, ...parts);

const source = decodePng(readFileSync(at("public/brand/lumina-logo-source.png")));
const { width: W, height: H } = source;

// ---------------------------------------------------------------------------
// Pixel helpers
// ---------------------------------------------------------------------------
const hex = ([r, g, b]) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
const kindOf = (r, g, b) => (r - b > 80 ? "gold" : "navy");

function sampleBrandColors(img) {
  const tallies = { navy: new Map(), gold: new Map() };
  for (let i = 0; i < img.width * img.height; i++) {
    const o = i * 4;
    if (img.data[o + 3] < 250) continue;
    const key = `${img.data[o]},${img.data[o + 1]},${img.data[o + 2]}`;
    const tally = tallies[kindOf(img.data[o], img.data[o + 1], img.data[o + 2])];
    tally.set(key, (tally.get(key) || 0) + 1);
  }
  const mode = (tally) => [...tally.entries()].sort((a, b) => b[1] - a[1])[0][0].split(",").map(Number);
  return { navy: mode(tallies.navy), gold: mode(tallies.gold) };
}

function cleanAlpha(img) {
  const data = new Uint8Array(img.data);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] >= 250) data[i] = 255;
    else if (data[i] <= 3) data[i] = 0;
  }
  return { width: img.width, height: img.height, data };
}

function toLightVariant(img) {
  const data = new Uint8Array(img.data);
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0 && kindOf(data[i], data[i + 1], data[i + 2]) === "navy") {
      data[i] = data[i + 1] = data[i + 2] = 255;
    }
  }
  return { width: img.width, height: img.height, data };
}

function crop(img, rect) {
  const width = rect.x1 - rect.x0 + 1;
  const height = rect.y1 - rect.y0 + 1;
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const from = ((rect.y0 + y) * img.width + rect.x0) * 4;
    data.set(img.data.subarray(from, from + width * 4), y * width * 4);
  }
  return { width, height, data };
}

/** Area-average resize with premultiplied alpha — clean edges at tiny icon sizes. */
function resize(img, dw, dh) {
  const { width: sw, data } = img;
  const out = new Uint8Array(dw * dh * 4);
  const xr = img.width / dw;
  const yr = img.height / dh;
  for (let dy = 0; dy < dh; dy++) {
    const y0 = dy * yr;
    const y1 = y0 + yr;
    for (let dx = 0; dx < dw; dx++) {
      const x0 = dx * xr;
      const x1 = x0 + xr;
      let r = 0, g = 0, b = 0, a = 0, weightSum = 0;
      for (let sy = Math.floor(y0); sy < Math.ceil(y1); sy++) {
        const wy = Math.min(sy + 1, y1) - Math.max(sy, y0);
        for (let sx = Math.floor(x0); sx < Math.ceil(x1); sx++) {
          const w = (Math.min(sx + 1, x1) - Math.max(sx, x0)) * wy;
          const i = (sy * sw + sx) * 4;
          const alpha = data[i + 3] / 255;
          r += data[i] * alpha * w;
          g += data[i + 1] * alpha * w;
          b += data[i + 2] * alpha * w;
          a += alpha * w;
          weightSum += w;
        }
      }
      const o = (dy * dw + dx) * 4;
      if (a > 0) {
        out[o] = Math.round(r / a);
        out[o + 1] = Math.round(g / a);
        out[o + 2] = Math.round(b / a);
        out[o + 3] = Math.round((255 * a) / weightSum);
      }
    }
  }
  return { width: dw, height: dh, data: out };
}

const solid = (width, height, [r, g, b], a = 255) => {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) data.set([r, g, b, a], i * 4);
  return { width, height, data };
};

function over(dst, src, ox, oy) {
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const dx = ox + x;
      const dy = oy + y;
      if (dx < 0 || dy < 0 || dx >= dst.width || dy >= dst.height) continue;
      const s = (y * src.width + x) * 4;
      const d = (dy * dst.width + dx) * 4;
      const sa = src.data[s + 3] / 255;
      if (sa === 0) continue;
      const da = dst.data[d + 3] / 255;
      const outA = sa + da * (1 - sa);
      for (let c = 0; c < 3; c++) {
        dst.data[d + c] = Math.round((src.data[s + c] * sa + dst.data[d + c] * da * (1 - sa)) / outA);
      }
      dst.data[d + 3] = Math.round(outA * 255);
    }
  }
}

function roundCorners(img, radius) {
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const cx = x < radius ? radius : x >= img.width - radius ? img.width - radius : x + 0.5;
      const cy = y < radius ? radius : y >= img.height - radius ? img.height - radius : y + 0.5;
      if (cx === x + 0.5 && cy === y + 0.5) continue;
      const dist = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const coverage = Math.max(0, Math.min(1, radius - dist + 0.5));
      img.data[(y * img.width + x) * 4 + 3] = Math.round(img.data[(y * img.width + x) * 4 + 3] * coverage);
    }
  }
}

const fit = (img, maxW, maxH) => {
  const scale = Math.min(maxW / img.width, maxH / img.height);
  return resize(img, Math.max(1, Math.round(img.width * scale)), Math.max(1, Math.round(img.height * scale)));
};

function write(path, buffer) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, buffer);
  console.log("wrote", path.replace(ROOT, "").replaceAll("\\", "/").replace(/^\//, ""));
}

// ---------------------------------------------------------------------------
// Analyse the source: brand colors, mark vs wordmark, bounding boxes
// ---------------------------------------------------------------------------
const logo = cleanAlpha(source);
const colors = sampleBrandColors(logo);
console.log("brand colors:", { navy: hex(colors.navy), gold: hex(colors.gold) });

const rowInk = new Array(H).fill(0);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (logo.data[(y * W + x) * 4 + 3] > 128) rowInk[y]++;

const bands = [];
let bandStart = null;
rowInk.forEach((count, y) => {
  if (count > 0 && bandStart === null) bandStart = y;
  if (count === 0 && bandStart !== null) {
    bands.push([bandStart, y - 1]);
    bandStart = null;
  }
});
if (bandStart !== null) bands.push([bandStart, H - 1]);

// The mark sits above the widest empty gap; everything below is the wordmark.
let markEnd = bands[0][1];
let widestGap = 0;
for (let i = 0; i < bands.length - 1; i++) {
  const gap = bands[i + 1][0] - bands[i][1];
  if (gap > widestGap) {
    widestGap = gap;
    markEnd = bands[i][1];
  }
}

function inkBounds(y0, y1) {
  let x0 = W, x1 = 0, ya = H, yb = 0;
  for (let y = y0; y <= y1; y++) {
    for (let x = 0; x < W; x++) {
      if (logo.data[(y * W + x) * 4 + 3] > 128) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < ya) ya = y;
        if (y > yb) yb = y;
      }
    }
  }
  return { x0, x1, y0: ya, y1: yb };
}

const markRect = inkBounds(0, markEnd);
const wordmarkRect = inkBounds(markEnd + 1, H - 1);
const fullRect = inkBounds(0, H - 1);
console.log("mark rows", markRect.y0, "-", markRect.y1, "| full logo", fullRect);

const lightLogo = toLightVariant(logo);
const logoFull = crop(logo, fullRect);
const logoFullLight = crop(lightLogo, fullRect);
const markDark = crop(logo, markRect);
const markLight = crop(lightLogo, markRect);
const wordmark = crop(logo, wordmarkRect);
const wordmarkLight = crop(lightLogo, wordmarkRect);

// ---------------------------------------------------------------------------
// Trace the mark into vector polygons (each shape is a convex, rounded triangle)
// ---------------------------------------------------------------------------
function traceMark() {
  const mask = new Uint8Array(W * H);
  for (let y = markRect.y0; y <= markRect.y1; y++)
    for (let x = markRect.x0; x <= markRect.x1; x++) mask[y * W + x] = logo.data[(y * W + x) * 4 + 3] > 128 ? 1 : 0;

  const seen = new Uint8Array(W * H);
  const shapes = [];

  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || seen[start]) continue;
    const pixels = [];
    const stack = [start];
    seen[start] = 1;
    while (stack.length) {
      const idx = stack.pop();
      pixels.push(idx);
      const x = idx % W;
      const y = (idx - x) / W;
      for (let ny = y - 1; ny <= y + 1; ny++)
        for (let nx = x - 1; nx <= x + 1; nx++) {
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const n = ny * W + nx;
          if (mask[n] && !seen[n]) {
            seen[n] = 1;
            stack.push(n);
          }
        }
    }
    if (pixels.length < 200) continue;

    let rSum = 0, gSum = 0, bSum = 0;
    const centers = [];
    for (const idx of pixels) {
      const x = idx % W;
      const y = (idx - x) / W;
      rSum += logo.data[idx * 4];
      gSum += logo.data[idx * 4 + 1];
      bSum += logo.data[idx * 4 + 2];
      const edge = !mask[idx - 1] || !mask[idx + 1] || !mask[idx - W] || !mask[idx + W];
      if (edge) centers.push([x + 0.5, y + 0.5]);
    }

    const ring = simplifyClosed(convexHull(centers), 0.6);
    const hullArea = polygonArea(convexHull(centers));
    shapes.push({
      color: kindOf(rSum / pixels.length, gSum / pixels.length, bSum / pixels.length),
      ring,
      fidelity: hullArea / pixels.length,
    });
  }
  return shapes;
}

function convexHull(points) {
  const pts = [...new Map(points.map((p) => [`${p[0]},${p[1]}`, p])).values()].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (const p of [...pts].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

function polygonArea(ring) {
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2;
}

function perpendicular(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = Math.hypot(dx, dy);
  if (!length) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / length;
}

function simplifyOpen(points, epsilon) {
  if (points.length < 3) return points;
  let maxDistance = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicular(points[i], points[0], points[points.length - 1]);
    if (d > maxDistance) {
      maxDistance = d;
      index = i;
    }
  }
  if (maxDistance <= epsilon) return [points[0], points[points.length - 1]];
  return simplifyOpen(points.slice(0, index + 1), epsilon).slice(0, -1).concat(simplifyOpen(points.slice(index), epsilon));
}

function simplifyClosed(ring, epsilon) {
  let far = 0;
  let farDistance = 0;
  for (let i = 1; i < ring.length; i++) {
    const d = Math.hypot(ring[i][0] - ring[0][0], ring[i][1] - ring[0][1]);
    if (d > farDistance) {
      farDistance = d;
      far = i;
    }
  }
  const a = simplifyOpen(ring.slice(0, far + 1), epsilon);
  const b = simplifyOpen(ring.slice(far).concat([ring[0]]), epsilon);
  return a.slice(0, -1).concat(b.slice(0, -1));
}

const traced = traceMark();
if (traced.length === 0) throw new Error("Could not find any shapes in the logo mark");
traced.forEach((s, i) => {
  if (s.fidelity > 1.06) console.warn(`  ! shape ${i} is not convex enough (hull/pixel area ${s.fidelity.toFixed(3)})`);
});
console.log(`traced ${traced.length} shapes:`, traced.map((s) => `${s.color}(${s.ring.length}pts)`).join(" "));

const allPoints = traced.flatMap((s) => s.ring);
const bx0 = Math.min(...allPoints.map((p) => p[0]));
const by0 = Math.min(...allPoints.map((p) => p[1]));
const markWidth = Math.max(...allPoints.map((p) => p[0])) - bx0;
const markHeight = Math.max(...allPoints.map((p) => p[1])) - by0;
const round1 = (v) => Math.round(v * 10) / 10;

const shapes = traced.map((s) => ({
  color: s.color,
  d: `${s.ring.map(([x, y], i) => `${i ? "L" : "M"}${round1(x - bx0)} ${round1(y - by0)}`).join("")}Z`,
}));

const NAVY = hex(colors.navy);
const GOLD = hex(colors.gold);
const fillFor = (color, light) => (color === "gold" ? GOLD : light ? "#FFFFFF" : NAVY);
const markSvg = (light) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${round1(markWidth)} ${round1(markHeight)}">${shapes
    .map((s) => `<path fill="${fillFor(s.color, light)}" d="${s.d}"/>`)
    .join("")}</svg>\n`;

// Scalable tab icon: navy tile + light mark, centred.
const iconScale = (512 * 0.6) / markHeight;
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="${NAVY}"/><g transform="translate(${round1((512 - markWidth * iconScale) / 2)} ${round1((512 - markHeight * iconScale) / 2)}) scale(${round1(iconScale * 1000) / 1000})">${shapes
  .map((s) => `<path fill="${fillFor(s.color, true)}" d="${s.d}"/>`)
  .join("")}</g></svg>\n`;

// ---------------------------------------------------------------------------
// Write vector assets
// ---------------------------------------------------------------------------
write(at("public/brand/lumina-mark.svg"), markSvg(false));
write(at("public/brand/lumina-mark-light.svg"), markSvg(true));
write(at("src/app/icon.svg"), iconSvg);

write(
  at("src/lib/brand-mark.generated.ts"),
  `// Generated by scripts/generate-brand-assets.mjs from public/brand/lumina-logo-source.png.
// Do not edit by hand — replace the source logo and run \`npm run brand\`.
export const BRAND_COLORS = { navy: "${NAVY}", gold: "${GOLD}" } as const;

export const MARK_VIEWBOX = { width: ${round1(markWidth)}, height: ${round1(markHeight)} } as const;

/** Pixel size of public/brand/lumina-logo*.png (mark + wordmark lockup). */
export const LOGO_FULL_SIZE = { width: ${logoFull.width}, height: ${logoFull.height} } as const;

/** Pixel size of public/brand/lumina-wordmark*.png (the "LUMINA HOLDINGS" text on its own). */
export const WORDMARK_SIZE = { width: ${wordmark.width}, height: ${wordmark.height} } as const;

export const MARK_SHAPES: ReadonlyArray<{ color: "navy" | "gold"; d: string }> = [
${shapes.map((s) => `  { color: "${s.color}", d: "${s.d}" },`).join("\n")}
];
`,
);

// ---------------------------------------------------------------------------
// Raster assets
// ---------------------------------------------------------------------------
const png = (img) => encodePng(img);

write(at("public/brand/lumina-logo.png"), png(logoFull));
write(at("public/brand/lumina-logo-light.png"), png(logoFullLight));
write(at("public/brand/lumina-wordmark.png"), png(wordmark));
write(at("public/brand/lumina-wordmark-light.png"), png(wordmarkLight));
write(at("public/brand/lumina-mark.png"), png(fit(markDark, 512, 512)));
write(at("public/brand/lumina-mark-light.png"), png(fit(markLight, 512, 512)));

function tile(size, markRatio, { radius = 0, background = colors.navy } = {}) {
  const base = solid(size, size, background);
  const scaled = fit(markLight, size, Math.round(size * markRatio));
  over(base, scaled, Math.round((size - scaled.width) / 2), Math.round((size - scaled.height) / 2));
  if (radius) roundCorners(base, radius);
  return base;
}

write(at("src/app/apple-icon.png"), png(tile(180, 0.62)));
write(at("public/icons/icon-192.png"), png(tile(192, 0.62)));
write(at("public/icons/icon-512.png"), png(tile(512, 0.62)));
// Maskable icons must keep artwork inside the central ~80% circle.
write(at("public/icons/icon-maskable-512.png"), png(tile(512, 0.5)));

write(
  at("src/app/favicon.ico"),
  encodeIco([16, 32, 48].map((size) => ({ size, png: png(tile(size, 0.72, { radius: Math.round(size * 0.2) })) }))),
);

// Social preview: full-colour logo on white.
const og = solid(1200, 630, [255, 255, 255]);
const ogLogo = fit(logoFull, 900, 470);
over(og, ogLogo, Math.round((1200 - ogLogo.width) / 2), Math.round((630 - ogLogo.height) / 2));
write(at("src/app/opengraph-image.png"), png(og));

console.log("\nDone. Brand colors — navy", NAVY, "gold", GOLD);
