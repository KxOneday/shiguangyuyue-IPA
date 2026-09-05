/* domsmoke.mjs —— 用最小 DOM 桩在 Node 中冒烟运行 ui.js 主流程
   运行： node tools/domsmoke.mjs */
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFile(join(ROOT, f), 'utf8');

const els = {};
function el() {
  return {
    style: { setProperty() {} }, dataset: {}, value: '', hidden: false, children: [],


    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    innerHTML: '',
    appendChild() {}, remove() {}, focus() {}, click() {}, select() {}, blur() {},
    addEventListener() {}, removeEventListener() {},
    querySelector: () => el(),
    querySelectorAll: () => [],
    setAttribute() {}, getAttribute: () => null,
    querySelectorAll: () => [],
    files: [], closest: () => null,
    append() {}, textContent: ''
  };
}
function getEl(id) { return (els[id] = els[id] || el()); }

const store = {
  _d: {},
  getItem(k) { return k in this._d ? this._d[k] : null; },
  setItem(k, v) { this._d[k] = String(v); },
  removeItem(k) { delete this._d[k]; }
};

const ctx = vm.createContext({
  console,
  window: {},
  document: {
    getElementById: getEl,
    createElement: el,
    querySelectorAll: () => [],
    addEventListener() {},
    removeEventListener() {},
    body: {
      _c: null,
      classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
      appendChild(c) { this._c = c; },
      removeChild() {},
      remove() {},
      querySelector() {}
    },
    documentElement: { setAttribute() {}, style: {} },
    visibilityState: 'visible'
  },
  localStorage: store,
  navigator: {},
  location: { origin: 'http://localhost', pathname: '/' },
  fetch: async () => { throw new Error('no fetch'); },
  FileReader: function () { this.readAsDataURL = () => {}; },
  Blob: function () {},
  Notification: undefined,
  setTimeout, clearTimeout, setInterval, clearInterval
});
ctx.window = ctx;

for (const f of ['js/lunar.js', 'js/core.js', 'js/store.js', 'js/notify.js', 'js/ui.js']) {
  vm.runInContext(await read(f), ctx, { filename: f });
}
const DM = ctx.window.DM;
let pass = 0;
const ok = (label) => { pass++; console.log('  ✓', label); };

try {
  DM.ui.init();
  ok('init() 无异常（空数据首屏）');

  for (const ev of DM.store.sampleEvents()) DM.store.addEvent(ev);
  DM.ui.renderList();
  ok('载入示例后 renderList() 无异常');
  if (!ctx.document.getElementById('content').innerHTML.includes('card')) throw new Error('列表未生成 .card 节点');

  DM.ui.renderCalendar();
  ok('renderCalendar() 无异常');
  DM.ui.renderHomePage();
  ok('renderHomePage() 无异常');
  DM.ui.renderPeriodPage();
  ok('renderPeriodPage() 无异常');

  DM.ui.openEditor(null);
  ok('openEditor(新建) 无异常');
  DM.ui.openCatManage(false);
  ok('openCatManage 无异常');

  DM.ui.openEditor(null);
  const pgNode = ctx.document.body._c;
  if (!pgNode || typeof pgNode.innerHTML !== 'string' || !pgNode.innerHTML) throw new Error('页面节点未生成');
  ok('编辑器整页已写入 body');

  // 校验编辑器中引用的所有 id 都真实出现在 HTML 里（防拼写不一致）
  const NEEDED = ['edTitle', 'edCalSeg', 'edTargetText', 'rowLeap', 'edLeap', 'edWheel', 'edWheelY', 'edWheelM', 'edWheelD', 'edPreview', 'edCatRow', 'edCatPick', 'edCatIc', 'edCatNm', 'edCatList', 'edCatMgmt', 'edBgSpec', 'edImgHint', 'edBgPanel', 'edBgHue', 'edPinRow', 'edPin', 'edRepeatRow', 'edRepeat', 'edRemindAdv', 'edRemindHour', 'edRemindMin', 'edSaveTop', 'edSave'];
  const missing = NEEDED.filter((i) => !pgNode.innerHTML.includes('id="' + i + '"'));
  if (missing.length) throw new Error('编辑器缺少 id：' + missing.join(','));
  ok('编辑器 id 一致性：' + NEEDED.length + ' 个 id 全部存在');

  // 编辑已有事件（含删除按钮）
  const ev0 = DM.store.load().events[0];
  DM.ui.openEditor(ev0.id);
  const pgNode2 = ctx.document.body._c;
  if (!pgNode2.innerHTML.includes('id="edDel"')) throw new Error('编辑态缺少删除按钮');
  ok('openEditor(编辑已有事件) 无异常，含删除按钮');

  // 切换农历再切回公历
  DM.ui.refreshClock();
  DM.ui.syncReminders();
  ok('refreshClock / syncReminders 无异常');

  console.log(`\n冒烟通过：${pass} 项`);
  process.exit(0);
} catch (e) {
  console.error('\n冒烟失败：', e && e.stack || e);
  process.exit(1);
}
