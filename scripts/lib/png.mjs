// Minimal, dependency-free PNG codec used by the brand-asset generator.
// Decodes 8-bit gray / RGB / palette / gray+alpha / RGBA (non-interlaced) into
// RGBA and encodes RGBA back to PNG. Deliberately tiny: it exists so brand
// assets can be regenerated on any machine without native image libraries.
import { deflateSync, inflateSync } from "node:zlib";

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function unfilter(raw, width, height, bytesPerPixel) {
  const stride = width * bytesPerPixel;
  const out = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filterType = raw[y * (stride + 1)];
    const inRow = y * (stride + 1) + 1;
    const outRow = y * stride;
    for (let x = 0; x < stride; x++) {
      const value = raw[inRow + x];
      const a = x >= bytesPerPixel ? out[outRow + x - bytesPerPixel] : 0;
      const b = y > 0 ? out[outRow - stride + x] : 0;
      const c = x >= bytesPerPixel && y > 0 ? out[outRow - stride + x - bytesPerPixel] : 0;
      let predictor = 0;
      if (filterType === 1) predictor = a;
      else if (filterType === 2) predictor = b;
      else if (filterType === 3) predictor = (a + b) >> 1;
      else if (filterType === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        predictor = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      } else if (filterType !== 0) {
        throw new Error(`Unsupported PNG filter type ${filterType}`);
      }
      out[outRow + x] = (value + predictor) & 0xff;
    }
  }
  return out;
}

export function decodePng(buffer) {
  if (!buffer.subarray(0, 8).equals(SIGNATURE)) throw new Error("Not a PNG file");

  let offset = 8;
  let header = null;
  let palette = null;
  let transparency = null;
  const idat = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      header = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        depth: data[8],
        colorType: data[9],
        interlace: data[12],
      };
    } else if (type === "PLTE") palette = data;
    else if (type === "tRNS") transparency = data;
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    offset += 12 + length;
  }

  if (!header) throw new Error("PNG has no IHDR chunk");
  if (header.depth !== 8) throw new Error(`Only 8-bit PNGs are supported (got ${header.depth})`);
  if (header.interlace !== 0) throw new Error("Interlaced PNGs are not supported");

  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[header.colorType];
  if (!channels) throw new Error(`Unsupported PNG color type ${header.colorType}`);

  const { width, height } = header;
  const raw = inflateSync(Buffer.concat(idat));
  const pixels = unfilter(raw, width, height, channels);
  const rgba = new Uint8Array(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    const s = i * channels;
    const d = i * 4;
    if (header.colorType === 6) {
      rgba[d] = pixels[s];
      rgba[d + 1] = pixels[s + 1];
      rgba[d + 2] = pixels[s + 2];
      rgba[d + 3] = pixels[s + 3];
    } else if (header.colorType === 2) {
      rgba[d] = pixels[s];
      rgba[d + 1] = pixels[s + 1];
      rgba[d + 2] = pixels[s + 2];
      rgba[d + 3] = 255;
    } else if (header.colorType === 0) {
      rgba[d] = rgba[d + 1] = rgba[d + 2] = pixels[s];
      rgba[d + 3] = 255;
    } else if (header.colorType === 4) {
      rgba[d] = rgba[d + 1] = rgba[d + 2] = pixels[s];
      rgba[d + 3] = pixels[s + 1];
    } else {
      const index = pixels[s];
      rgba[d] = palette[index * 3];
      rgba[d + 1] = palette[index * 3 + 1];
      rgba[d + 2] = palette[index * 3 + 2];
      rgba[d + 3] = transparency && index < transparency.length ? transparency[index] : 255;
    }
  }

  return { width, height, data: rgba };
}

export function encodePng({ width, height, data }) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(data.buffer, data.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;

  return Buffer.concat([
    SIGNATURE,
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Packs PNG buffers into a multi-size .ico (PNG-compressed entries). */
export function encodeIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);

  const directory = Buffer.alloc(16 * entries.length);
  let dataOffset = header.length + directory.length;
  entries.forEach(({ size, png }, i) => {
    const o = i * 16;
    directory[o] = size >= 256 ? 0 : size;
    directory[o + 1] = size >= 256 ? 0 : size;
    directory.writeUInt16LE(1, o + 4);
    directory.writeUInt16LE(32, o + 6);
    directory.writeUInt32LE(png.length, o + 8);
    directory.writeUInt32LE(dataOffset, o + 12);
    dataOffset += png.length;
  });

  return Buffer.concat([header, directory, ...entries.map((e) => e.png)]);
}
