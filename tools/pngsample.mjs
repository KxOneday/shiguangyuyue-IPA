// pngsample.mjs — decode a PNG and sample pixel RGB at given x,y (0-based).
// Usage: node pngsample.mjs <file.png> x y [x2 y2 ...]
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const file = process.argv[2];
const pts = [];
for (let i = 3; i + 1 < process.argv.length; i += 2) pts.push([+process.argv[i], +process.argv[i + 1]]);

const buf = readFileSync(file);
if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not png');
let off = 8;
let w = 0, h = 0, bit = 0, ct = 0;
const idat = [];
while (off < buf.length) {
  const len = buf.readUInt32BE(off);
  const type = buf.toString('ascii', off + 4, off + 8);
  const data = buf.subarray(off + 8, off + 8 + len);
  if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bit = data[8]; ct = data[9]; }
  else if (type === 'IDAT') idat.push(data);
  off += 12 + len;
}
if (ct !== 6 && ct !== 2) throw new Error('unsupported color type ' + ct);
const bpp = ct === 6 ? 4 : 3;
const raw = inflateSync(Buffer.concat(idat));
const stride = w * bpp;
const px = Buffer.alloc(h * stride);
const paeth = (a, b, c) => {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};
for (let y = 0; y < h; y++) {
  const f = raw[y * (stride + 1)];
  const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
  const out = px.subarray(y * stride, (y + 1) * stride);
  for (let i = 0; i < stride; i++) {
    const a = i >= bpp ? out[i - bpp] : 0;
    const b = y > 0 ? out[i - stride] : 0;
    const c = y > 0 && i >= bpp ? out[i - stride - bpp] : 0;
    let v;
    if (f === 0) v = line[i];
    else if (f === 1) v = line[i] + a;
    else if (f === 2) v = line[i] + b;
    else if (f === 3) v = line[i] + ((a + b) >> 1);
    else v = line[i] + paeth(a, b, c);
    out[i] = v & 0xff;
  }
}
for (const [x, y] of pts) {
  if (x < 0 || x >= w || y < 0 || y >= h) { console.log(`${x},${y}: out-of-range (${w}x${h})`); continue; }
  const i = y * stride + x * bpp;
  console.log(`${x},${y}: rgb(${px[i]},${px[i + 1]},${px[i + 2]})`);
}
