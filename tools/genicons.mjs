/* genicons.mjs —— 零依赖生成 PNG 应用图标（Node 内置 zlib）
   用法： node tools/genicons.mjs   （在项目根目录运行）
   输出： icons/icon-512.png icon-192.png apple-touch-icon.png */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* ---------- PNG 编码 ---------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePNG(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

/* ---------- 绘图 ---------- */
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function rrDist(px, py, x0, y0, x1, y1, r) {
  const qx = Math.max(x0 - px, px - x1, 0);
  const qy = Math.max(y0 - py, py - y1, 0);
  return Math.hypot(qx, qy) - r; // 负 = 内部
}
const cover = (d) => clamp01(0.5 - d);

function drawIcon(S) {
  const img = Buffer.alloc(S * S * 4);
  const A = [255, 138, 92], B = [255, 76, 98];       // 渐变背景
  const RED = [255, 82, 96];
  const GRAY = [176, 180, 192];
  const WHITE = [255, 255, 255];
  const u = S / 512;                                   // 以 512 为基准的系数

  const pageX0 = 0.175 * S, pageX1 = 0.825 * S, pageY0 = 0.19 * S, pageY1 = 0.9 * S;
  const pageR = 0.075 * S;
  const bandY0 = 0.235 * S, bandY1 = 0.375 * S, bandR = 0.05 * S;
  const lineY = [0.46 * S, 0.55 * S, 0.64 * S];
  const dotX = [0.34 * S, 0.66 * S];

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let col = mix(A, B, (x / S) * 0.45 + (y / S) * 0.55);
      let a = 1;

      // 顶部光晕
      const glow = Math.exp(-((x - 0.28 * S) ** 2 + (y - 0.22 * S) ** 2) / (2 * (0.62 * S) ** 2)) * 0.22;
      col = mix(col, [255, 255, 255], clamp01(glow));

      // 白色日历页（带抗锯齿边缘）
      let pageA = cover(rrDist(x, y, pageX0, pageY0, pageX1, pageY1, pageR));
      if (pageA > 0) { col = mix(col, WHITE, pageA); a = 1; }

      // 红色头部色带
      let bandA = cover(rrDist(x, y, pageX0 + 0.045 * S, bandY0, pageX1 - 0.045 * S, bandY1, bandR));
      if (bandA > 0) col = mix(col, RED, bandA);

      // 色带上两个白点（模拟装订孔）
      for (const dx of dotX) {
        const d = Math.hypot(x - dx, y - 0.305 * S) - 0.016 * S;
        const ca = cover(d);
        if (ca > 0) col = mix(col, WHITE, ca);
      }

      // 灰色文字线条
      for (const ly of lineY) {
        const d = rrDist(x, y, pageX0 + 0.05 * S, ly, pageX1 - 0.05 * S * (0.7 + 0.1 * (ly === lineY[2] ? 1 : 0)), ly + 0.03 * S, 0.012 * S);
        const ca = cover(d);
        if (ca > 0) col = mix(col, GRAY, ca * 0.9);
      }
      // 底部一条红色强调线（像倒计时数字下方的强调）
      {
        const d = rrDist(x, y, pageX0 + 0.13 * S, pageY1 - 0.085 * S, pageX1 - 0.13 * S, pageY1 - 0.085 * S + 0.022 * S, 0.01 * S);
        const ca = cover(d);
        if (ca > 0) col = mix(col, [255, 140, 120], ca);
      }

      const i = (y * S + x) * 4;
      img[i] = Math.round(col[0]); img[i + 1] = Math.round(col[1]); img[i + 2] = Math.round(col[2]);
      img[i + 3] = Math.round(a * 255);
    }
  }
  return img;
}

mkdirSync(join(ROOT, 'icons'), { recursive: true });
for (const size of [512, 192, 180]) {
  const name = size === 180 ? 'apple-touch-icon.png' : 'icon-' + size + '.png';
  writeFileSync(join(ROOT, 'icons', name), encodePNG(size, size, drawIcon(size)));
  console.log('✓', name, '(' + size + 'x' + size + ')');
}
