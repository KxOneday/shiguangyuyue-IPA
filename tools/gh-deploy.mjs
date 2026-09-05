// gh-deploy.mjs — upload project to GitHub via Contents API, trigger build-apk workflow,
// then poll and download the APK artifact.
// Usage: GH_TOKEN=... node tools/gh-deploy.mjs  (upload + dispatch)
//        GH_TOKEN=... node tools/gh-deploy.mjs --wait <run_id>  (poll & download)
import { readdirSync, statSync, readFileSync, writeFileSync, createWriteStream } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const OWNER = process.env.GH_OWNER || 'KxOneday';
const REPO = process.env.GH_REPO || 'zaixianjinianri';
const WORKFLOW = process.env.GH_WORKFLOW || 'build-apk.yml';
const TOKEN = process.env.GH_TOKEN || '';
if (!TOKEN) { console.error('GH_TOKEN missing'); process.exit(1); }
const H = { Authorization: 'Bearer ' + TOKEN, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };

const api = async (p, opts = {}) => {
  const r = await fetch('https://api.github.com' + p, { headers: H, ...opts });
  const txt = await r.text();
  let j = null; try { j = JSON.parse(txt); } catch (e) { /* ignore */ }
  return { status: r.status, j, txt };
};
const enc = encodeURIComponent;

function collectFiles(dir, acc = []) {
  const skip = ['shots', '.git', 'node_modules', 'android', 'android-res', 'assets', 'apk-extract']
    .concat((process.env.GH_SKIP || '').split(',').filter(Boolean));
  for (const name of readdirSync(dir)) {
    if (skip.includes(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) collectFiles(full, acc);
    else acc.push(full);
  }
  return acc;
}

async function main() {
  const mode = process.argv[2];
  if (mode === '--wait') {
    const runId = process.argv[3];
    await pollAndDownload(runId);
    return;
  }
  // find default branch
  const repoInfo = await api(`/repos/${OWNER}/${REPO}`);
  const branch = (repoInfo.j && repoInfo.j.default_branch) || 'main';
  console.log('default branch:', branch);

  const files = collectFiles(ROOT).map((f) => relative(ROOT, f).split(sep).join('/')).sort();
  console.log('uploading', files.length, 'files');
  for (const rel of files) {
    const full = join(ROOT, rel.split('/').join(sep));
    const content = readFileSync(full).toString('base64');
    const apiPath = `/repos/${OWNER}/${REPO}/contents/` + rel.split('/').map(enc).join('/');
    // existing sha?
    let sha = null;
    const ex = await api(apiPath);
    if (ex.status === 200 && ex.j && ex.j.sha) sha = ex.j.sha;
    const body = { message: 'v2.53 icons+about & apk pipeline', content };
    if (sha) body.sha = sha;
    const up = await api(apiPath, { method: 'PUT', body: JSON.stringify(body) });
    if (up.status !== 200 && up.status !== 201) {
      console.error('FAIL', rel, up.status, (up.txt || '').slice(0, 200));
      process.exit(1);
    }
    console.log('  ok', rel);
  }
  console.log('all files uploaded');

  // dispatch workflow
  const dis = await api(`/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/dispatches`, {
    method: 'POST', body: JSON.stringify({ ref: branch })
  });
  console.log('dispatch status:', dis.status);
  if (dis.status !== 204 && dis.status !== 201 && dis.status !== 200) {
    console.error('dispatch failed', dis.txt);
    process.exit(1);
  }
  console.log('dispatched — poll with: node tools/gh-deploy.mjs --wait <run_id>');
}

async function pollAndDownload(runId) {
  const deadline = Date.now() + 30 * 60000;
  let last = '';
  while (Date.now() < deadline) {
    const r = await api(`/repos/${OWNER}/${REPO}/actions/runs/${runId}`);
    if (r.j && r.j.status === 'completed') {
      if (r.j.conclusion !== 'success') { console.error('run finished with conclusion:', r.j.conclusion); process.exit(1); }
      break;
    }
    const st = (r.j && (r.j.status + ' ' + (r.j.conclusion || ''))).trim();
    if (st !== last) { last = st; console.log('run state:', st); }
    await new Promise((res) => setTimeout(res, 15000));
  }
  const arts = await api(`/repos/${OWNER}/${REPO}/actions/runs/${runId}/artifacts`);
  const list = (arts.j && arts.j.artifacts) || [];
  const art = list[0];
  if (!art) { console.error('no artifact found', JSON.stringify(arts.j).slice(0, 300)); process.exit(1); }
  console.log('downloading artifact', art.name, art.size_in_bytes, 'bytes');
  const dl = await fetch(art.archive_download_url, { headers: { Authorization: 'Bearer ' + TOKEN } });
  const zip = Buffer.from(await dl.arrayBuffer());
  const outZip = process.env.GH_ZIP || join(ROOT, '..', REPO === 'zaixianjinianri' ? 'daoshiuri-apk.zip' : REPO + '-artifact.zip');
  writeFileSync(outZip, zip);
  console.log('saved ' + outZip);
}

main().catch((e) => { console.error(e); process.exit(1); });
