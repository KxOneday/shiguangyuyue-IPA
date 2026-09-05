// cdp-probe.mjs — drive headless Edge via CDP over a minimal WebSocket:
// click real UI rows (theme/about/backup in 设置, gear in 月历 for cycle settings)
// and sample the opened .pg element's transform/animation ~0.9s to prove slide motion.
// Usage: node tools/cdp-probe.mjs
import { spawn } from 'node:child_process';
import net from 'node:net';
import crypto from 'node:crypto';
import http from 'node:http';
import { rmSync, mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const EXE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9333;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

/* ---------- minimal websocket client ---------- */
class WS {
  constructor(url) {
    this.q = new Map();
    this.id = 0;
    this.handshaken = false;
    this.headBuf = Buffer.alloc(0);
    this.remainder = Buffer.alloc(0);
    this.ready = new Promise((res, rej) => {
      const u = new URL(url);
      this.sock = net.connect(+u.port, u.hostname, () => {
        const key = crypto.randomBytes(16).toString('base64');
        this.sock.write(
          `GET ${u.pathname} HTTP/1.1\r\nHost: ${u.host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`
        );
      });
      this.sock.on('error', (e) => rej(e));
      this.sock.on('data', (d) => this._onData(d, res, rej));
    });
  }
  _onData(d, res, rej) {
    if (!this.handshaken) {
      this.headBuf = Buffer.concat([this.headBuf, d]);
      const i = this.headBuf.indexOf('\r\n\r\n');
      if (i < 0) return;
      const head = this.headBuf.subarray(0, i + 4).toString();
      if (!/^HTTP\/1\.1 101/.test(head)) return rej(new Error('ws handshake failed: ' + head.split('\n')[0]));
      d = this.headBuf.subarray(i + 4);
      this.headBuf = Buffer.alloc(0);
      this.handshaken = true;
      res();
    }
    const chunk = this.remainder.length ? Buffer.concat([this.remainder, d]) : d;
    this.remainder = Buffer.alloc(0);
    let off = 0;
    while (off + 2 <= chunk.length) {
      const b0 = chunk[off], b1 = chunk[off + 1];
      const op = b0 & 0x0f;
      let len = b1 & 0x7f;
      let p = off + 2;
      if (len === 126) { if (p + 2 > chunk.length) break; len = chunk.readUInt16BE(p); p += 2; }
      else if (len === 127) { if (p + 8 > chunk.length) break; len = Number(chunk.readBigUInt64BE(p)); p += 8; }
      if (p + len > chunk.length) break;
      let payload = chunk.subarray(p, p + len);
      if (b1 & 0x80) {
        const mask = chunk.subarray(p - 4, p);
        payload = Buffer.from(payload);
        for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];
      }
      if (op === 1) this._msg(payload.toString());
      else if (op === 8) this.sock.end();
      else if (op === 9) this._sendRaw(Buffer.from([0x8a, 0x00]));
      off = p + len;
    }
    if (off < chunk.length) this.remainder = chunk.subarray(off);
  }
  _msg(txt) {
    try {
      const m = JSON.parse(txt);
      if (m.id && this.q.has(m.id)) {
        const { res, rej } = this.q.get(m.id);
        this.q.delete(m.id);
        if (m.error) rej(new Error(m.error.message)); else res(m.result);
      } else if (this.onEvent) this.onEvent(m);
    } catch (e) { /* ignore */ }
  }
  _sendRaw(payload) {
    const key = crypto.randomBytes(4);
    const len = payload.length;
    let head;
    if (len < 126) head = Buffer.from([0x81, 0x80 | len]);
    else if (len < 65536) { head = Buffer.alloc(4); head[0] = 0x81; head[1] = 0x80 | 126; head.writeUInt16BE(len, 2); }
    else { head = Buffer.alloc(10); head[0] = 0x81; head[1] = 0x80 | 127; head.writeBigUInt64BE(BigInt(len), 2); }
    const masked = Buffer.from(payload);
    for (let i = 0; i < masked.length; i++) masked[i] ^= key[i & 3];
    this.sock.write(Buffer.concat([head, key, masked]));
  }
  async send(method, params = {}) {
    await this.ready;
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.q.set(id, { res, rej });
      this._sendRaw(Buffer.from(JSON.stringify({ id, method, params })));
    });
  }
}

/* ---------- launch edge ---------- */
const prof = mkdtempSync(path.join(os.tmpdir(), 'cdp-prof-'));
const child = spawn(EXE, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`, 'about:blank'
], { stdio: 'ignore' });

async function getWs() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await new Promise((res, rej) => {
        http.get(`http://127.0.0.1:${PORT}/json/list`, (r) => {
          let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(JSON.parse(d)));
        }).on('error', rej);
      });
      const page = list.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch (e) { /* retry */ }
    await sleep(250);
  }
  throw new Error('no CDP target');
}

async function probe(ws, url, selector, label) {
  await ws.send('Page.navigate', { url });
  await sleep(1400);
  const sel = selector.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const expr = `(async () => {
    const out = [];
    const grab = () => {
      const el = document.querySelector('.pg');
      const cs = el ? getComputedStyle(el) : null;
      let tx = null;
      if (cs && cs.transform && cs.transform !== 'none') {
        const mm = cs.transform.match(/matrix\\(([^)]+)\\)/);
        if (mm) { const p = mm[1].split(',').map(Number); tx = Math.round(p[4]); }
      }
      out.push({ t: Math.round(performance.now() - T0), hasPg: !!el,
        anim: cs ? cs.animationName : null, tx,
        appOp: document.getElementById('app') ? getComputedStyle(document.getElementById('app')).opacity : null });
    };
    let T0 = performance.now();
    grab();
    const target = document.querySelector("${sel}");
    if (!target) return { err: 'selector not found: ${sel}' };
    target.click();
    for (let i = 0; i < 28; i++) { await new Promise((r) => setTimeout(r, 32)); grab(); }
    return out;
  })()`;
  const r = await ws.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  const frames = r && r.result && r.result.value;
  console.log('\n=== ' + label + ' ===');
  if (!Array.isArray(frames)) { console.log('no frames:', JSON.stringify(r).slice(0, 300)); return; }
  if (frames.err) { console.log('ERR', frames.err); return; }
  const txVals = frames.filter((f) => f.tx != null).map((f) => f.tx);
  const anims = [...new Set(frames.map((f) => f.anim))];
  console.log('animations seen:', JSON.stringify(anims));
  console.log('translateX range:', txVals.length ? Math.min(...txVals) + ' .. ' + Math.max(...txVals) : 'none (no transform)');
  const seq = frames.filter((f, i) => i % 3 === 0 || i === frames.length - 1)
    .map((f) => 't=' + String(f.t).padStart(4) + 'ms pg=' + (f.hasPg ? 1 : 0) + ' tx=' + f.tx + ' appOp=' + f.appOp + ' ' + f.anim);
  console.log(seq.join('\n'));
}

(async () => {
  let ws = null;
  try {
    const wsu = await getWs();
    ws = new WS(wsu);
    await ws.ready;
    await ws.send('Page.enable');
    await ws.send('Runtime.enable');
    const base = 'http://localhost:8123/index.html';
    await probe(ws, base + '?tab=set', '.set-row[data-act="theme"]', '设置→外观 theme');
    await probe(ws, base + '?tab=set', '.set-row[data-act="backup"]', '设置→备份 backup');
    await probe(ws, base + '?tab=set', '.set-row[data-act="about"]', '设置→关于 about');
    await probe(ws, base + '?tab=cal', '.pc-head [data-act="conf"]', '月历→周期设置 cycle');
  } catch (e) {
    console.error('probe failed:', e.message);
  } finally {
    try { if (ws) ws.sock.end(); } catch (e) { /* */ }
    child.kill();
    setTimeout(() => rmSync(prof, { recursive: true, force: true }), 500);
  }
})();
