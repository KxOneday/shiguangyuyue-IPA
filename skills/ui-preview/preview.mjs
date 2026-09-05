/* preview.mjs —— 用本机 Edge 无头渲染页面并输出手机/桌面截图
   用法： node skills/ui-preview/preview.mjs [--url ...] [--out ...] [--phone 390x844] [--desktop 1280x900]
*/
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

const URL0 = arg('url', 'http://localhost:8123/');
const TAB = arg('tab', '');
let URL = URL0;
if (TAB && ['home', 'list', 'cal', 'set'].includes(TAB)) {
  URL = URL0 + (URL0.includes('?') ? '&' : '?') + 'tab=' + TAB;
}
const OUT = resolve(ROOT, arg('out', 'shots'));
const PHONE = arg('phone', '390x844');
const DESKTOP = arg('desktop', '1280x900');

const EDGE_CANDIDATES = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];
const EDGE = EDGE_CANDIDATES.find((p) => existsSync(p));
if (!EDGE) {
  console.error('✗ 未找到 Edge/Chrome，无法渲染');
  process.exit(2);
}

mkdirSync(OUT, { recursive: true });
const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const profile = join(tmpdir(), 'dm-preview-' + process.pid + '-' + Date.now());

async function httpUp(url) {
  try {
    const r = await fetch(url);
    return r.ok;
  } catch (e) {
    return false;
  }
}

function shot(name, size) {
  const out = join(OUT, name);
  try {
    execFileSync(EDGE, [
      '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
      '--user-data-dir=' + profile,
      '--window-size=' + size, '--screenshot=' + out, '--virtual-time-budget=2500',
      URL
    ], { stdio: 'ignore', timeout: 30000 });
  } catch (e) { /* Edge 退出码非 0 时仍可能已写出图片，交给下方校验 */ }
  if (existsSync(out) && statSync(out).size > 2000) {
    const kb = Math.round(statSync(out).size / 1024);
    console.log(`✓ ${name}  (${kb} KB)`);
    return { name, size: statSync(out).size };
  }
  console.error(`✗ 截图失败: ${name}`);
  return null;
}

// 先确认服务器在线
const okUp = await httpUp(URL);
if (!okUp) {
  console.error('✗ 服务器未运行或地址不可达：' + URL);
  console.error('  请在项目根目录执行 node tools/serve.mjs 后重试。');
  process.exit(3);
}
console.log('页面可达: ' + URL);

const results = [];
results.push(shot(`ui-${stamp}-phone.png`, PHONE));
results.push(shot(`ui-${stamp}-desktop.png`, DESKTOP));

try { rmSync(profile, { recursive: true, force: true }); } catch (e) { /* 忽略 */ }

const ok = results.filter(Boolean).length;
console.log(`\n完成：${ok}/2 张截图已保存到 ${OUT}`);
console.log('提示：纯文本模型看不到图片，请人工查看，或把截图交给支持识图的模型评审。');
process.exit(ok >= 2 ? 0 : 1);
