// apply-ios-icon.mjs — replace every PNG in an iOS AppIcon.appiconset with a
// resized copy of the master icon, honoring each Contents.json entry's size/scale.
// Usage: node tools/apply-ios-icon.mjs <appiconset-dir> <master-png>
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const [dir, master] = process.argv.slice(2);
if (!dir || !master) { console.error('usage: apply-ios-icon.mjs <appiconset> <master>'); process.exit(1); }
if (!existsSync(master)) { console.error('master missing:', master); process.exit(1); }
const cf = join(dir, 'Contents.json');
const cfg = JSON.parse(readFileSync(cf, 'utf8'));
let done = 0;
for (const img of cfg.images || []) {
  const fn = img.filename;
  if (!fn) continue;
  const m = /^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/.exec(img.size || '');
  const scale = img.scale === '3x' ? 3 : img.scale === '2x' ? 2 : 1;
  if (!m) { console.log('skip (no size):', fn); continue; }
  const px = Math.round(Math.max(+m[1], +m[2]) * scale);
  const dest = join(dir, fn);
  console.log(fn, '->', px + 'px');
  const r = spawnSync('sips', ['-z', String(px), String(px), master, '--out', dest], { encoding: 'utf8' });
  if (r.status !== 0) { console.error('sips failed for', fn, r.stderr); process.exit(1); }
  done++;
}
console.log('applied', done, 'icon files');
if (!done) {
  console.log('no images entry matched; files in dir:', readdirSync(dir).join(', '));
  process.exit(1);
}
