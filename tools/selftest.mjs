/* selftest.mjs —— 核心逻辑自测（不需要浏览器/DOM）
   运行： node tools/selftest.mjs */
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = async (f) => await readFile(join(ROOT, 'js', f), 'utf8');

// 沙箱：只需 window 对象
const ctx = vm.createContext({ window: {}, console });
vm.runInContext(await src('lunar.js'), ctx, { filename: 'lunar.js' });
vm.runInContext(await src('core.js'), ctx, { filename: 'core.js' });
const lu = ctx.window.DM.lunar;
const C = ctx.window.DM.core;

let pass = 0, fail = 0;
function eq(actual, expected, label) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { pass++; console.log('  ✓', label); }
  else { fail++; console.error('  ✗', label, '\n    期望:', e, '\n    实际:', a); }
}

const NOW = C.dateOf(2025, 3, 15);

// 基础日期
eq(C.dayDiff(C.dateOf(2025, 3, 20), NOW), 5, 'dayDiff 3-20 与 3-15 = 5 天');
eq(C.ymd(C.dateOf(2025, 1, 1)), '2025-01-01', 'ymd 格式');

// 农历转换（已知日期）
eq(lu.solarToLunar(2023, 1, 22), { lYear: 2023, lMonth: 1, lDay: 1, isLeap: false }, '2023-01-22 = 正月初一（春节）');
eq(lu.lunarToSolar(2023, 1, 1), { y: 2023, m: 1, d: 22 }, '正月初一 2023 -> 2023-01-22');
eq(lu.monthName(1, false), '正月', '月份名');
eq(lu.dayName(1), '初一', '日名');
eq(lu.monthName(5, true), '闰五月', '闰月名');
eq(lu.ganzhiOf(2023) + lu.zodiacOf(2023), '癸卯兔', '2023 干支生肖 = 癸卯兔');
eq(lu.leapMonthOf(2023), 2, '2023 闰二月');
eq(lu.lunarToSolar(2023, 2, 1, true), { y: 2023, m: 3, d: 22 }, '闰二月初一 2023 -> 2023-03-22');
eq(lu.lunarToSolar(2024, 5, 5, false), { y: 2024, m: 6, d: 10 }, '2024 五月初五（端午）= 2024-06-10');

// 往返一致（2020–2030 抽样）
let rtOk = true, rtFail = '';
outer: for (let y = 2020; y <= 2030; y++) {
  for (let m = 1; m <= 12; m++) {
    const dim = C.daysInMonth(y, m);
    for (let d = 1; d <= dim; d += 7) {
      const l = lu.solarToLunar(y, m, d);
      const back = lu.lunarToSolar(l.lYear, l.lMonth, l.lDay, l.isLeap);
      if (!back || back.y !== y || back.m !== m || back.d !== d) { rtOk = false; rtFail = `${y}-${m}-${d}`; break outer; }
    }
  }
}
eq(rtOk, true, '公历→农历→公历 往返一致（含 ' + (rtFail || '全部') + '）');

// 每年重复（2/29）
const evLeap = { cal: 'solar', repeat: true, y: 2020, m: 2, d: 29 };
eq(C.ymd(C.nextOnOrAfter(evLeap, NOW)), '2026-02-28', '2/29 每年重复，2025-03-15 之后下一次 = 2026-02-28');

// 事件状态
const evFuture = { cal: 'solar', repeat: false, anniversary: false, y: 2025, m: 3, d: 20 };
eq(C.stateOf(evFuture, NOW).kw, '还有', '未来事件 kw=还有');
eq(C.stateOf(evFuture, NOW).num, 5, '未来事件还有 5 天');
const evToday = { cal: 'solar', repeat: false, y: 2025, m: 3, d: 15 };
eq(C.stateOf(evToday, NOW).phase, 'today', '当天事件 phase=today');
const evPast = { cal: 'solar', repeat: false, anniversary: false, y: 2025, m: 3, d: 10 };
eq(C.stateOf(evPast, NOW).num, 5, '已过 5 天');
const evAnn = { cal: 'solar', repeat: false, anniversary: true, y: 2025, m: 3, d: 10 };
const stAnn = C.stateOf(evAnn, NOW);
eq([stAnn.kw, stAnn.num], ['第', 6], '纪念日第 6 天');

// 农历事件跨年（每年）
const evLunar = { cal: 'lunar', lm: 5, ld: 5, lLeap: false, repeat: true };
const tLunar = C.nextOnOrAfter(evLunar, NOW);
eq(C.ymd(tLunar), '2025-05-31', '2025 端午（农历五月初五）公历 = 2025-05-31');
eq(C.stateOf(evLunar, NOW).num, C.dayDiff(tLunar, NOW), '距端午还有天数一致');

// 一年内两个闰月/边界日期不应崩溃
const evNian = { cal: 'lunar', lm: 12, ld: 30, lLeap: false, repeat: true };
const tNian = C.nextOnOrAfter(evNian, NOW);
eq(tNian ? C.ymd(tNian) : null, '2030-02-02', '腊月三十（29 天月份无此日）下一次 = 2030-02-02');

// 日期范围外优雅降级
eq(lu.solarToLunar(1900, 1, 1) !== null, true, '1900 年可转换');
eq(lu.lunarToSolar(2023, 2, 31, false), null, '不存在的三十一返回 null');

// 一次性农历（带年份、不重复）
const evFixed = { cal: 'lunar', ly: 2025, lm: 5, ld: 5, lLeap: false, repeat: false };
const stFixed = C.stateOf(evFixed, NOW);
eq(stFixed.phase, 'future', '2025年农历五月初五（一次性）在 2025-03-15 看 = 未来');
eq(stFixed.diffDays, C.dayDiff(C.dateOf(2025, 5, 31), NOW), '一次性农历 = 固定公历 2025-05-31，天数一致');
eq(stFixed.annual, false, '一次性农历不带“每年”标记');
eq(C.datesInYear(evFixed, 2025).length, 1, '一次性农历只出现在 2025 年');
eq(C.datesInYear(evFixed, 2024).length, 0, '不出现在 2024 年');

const evFixedPast = { cal: 'lunar', ly: 2023, lm: 1, ld: 1, lLeap: false, repeat: false, anniversary: true };
const stFP = C.stateOf(evFixedPast, NOW);
eq(stFP.phase, 'past', '2023 春节（一次性）已过');
eq(stFP.kw, '第', '纪念日模式显示第 N 天');
eq(stFP.num, C.dayDiff(NOW, C.dateOf(2023, 1, 22)) + 1, '第 N 天数值正确');

eq(C.fixedLunarSolar({ cal: 'lunar', ly: 2024, lm: 1, ld: 31, repeat: false }), null, '不存在的 31 日一次性农历 = null');
eq(C.fixedLunarSolar({ cal: 'lunar', ly: 2025, lm: 1, ld: 1, repeat: true }), null, '每年重复的农历不走固定日期');

// 生肖按所选农历年份，且仅生日分类显示
const evZodiac = { cal: 'lunar', ly: 2002, lm: 8, ld: 18, lLeap: false, repeat: true, cat: 'bd' };
const z1 = C.stateOf(evZodiac, NOW).lunarLine || '';
eq(z1.includes('壬午'), true, '生日(农历2002年)干支=壬午');
eq(z1.includes('属马'), true, '生日显示生肖马');
const z2 = C.stateOf(Object.assign({}, evZodiac, { cat: 'ji' }), NOW).lunarLine || '';
eq(z2.includes('属'), false, '非生日分类不显示生肖');

// 生理周期推算
const cyc = { lastStart: '2025-02-01', cycleLen: 28, periodLen: 5 };
eq(C.dayKindOf(cyc, {}, C.dateOf(2025, 2, 1)), 'period', '周期第1天=经期');
eq(C.dayKindOf(cyc, {}, C.dateOf(2025, 2, 5)), 'period', '经期第5天仍为经期');
eq(C.dayKindOf(cyc, {}, C.dateOf(2025, 2, 6)), 'normal', '经期后为安全期');
eq(C.dayKindOf(cyc, {}, C.dateOf(2025, 2, 15)), 'ovulation', '第14天=排卵日');
eq(C.dayKindOf(cyc, {}, C.dateOf(2025, 2, 10)), 'fertile', '排卵前5天=易孕期(精子存活)');
eq(C.dayKindOf(cyc, {}, C.dateOf(2025, 2, 16)), 'fertile', '排卵后1天仍在易孕窗');
eq(C.dayKindOf(cyc, {}, C.dateOf(2025, 2, 17)), 'normal', '排卵后2天回归安全');
eq(C.dayKindOf(cyc, {}, C.dateOf(2025, 3, 1)), 'period', '下个周期第1天=经期');
eq(C.dayKindOf(cyc, { '2025-02-10': { f: 2 } }, C.dateOf(2025, 2, 10)), 'period', '手动记录优先(实际经期)');
eq(C.periodDayInfo(cyc, C.dateOf(2025, 2, 15)).day, 14, '周期第15天(0基14)');
eq(C.ymd(C.nextCycleStart(cyc, C.dateOf(2025, 2, 10))), '2025-03-01', '下次开始=2025-03-01');

// 自定义结束日：仅单次记录，不影响周期推算
const cycEnd = { lastStart: '2025-02-01', lastEnd: '2025-02-07', cycleLen: 28, periodLen: 5 };
eq(C.dayKindOf(cycEnd, { '2025-02-07': { f: 1 } }, C.dateOf(2025, 2, 7)), 'period', '实际记录日=经期');
eq(C.ymd(C.nextCycleStart(cycEnd, C.dateOf(2025, 2, 20))), '2025-03-01', '结束日不影响下次推算(仍按周期28天)');
eq(C.cycleLenInfo(cycEnd).L, 5, '预测经期长度仍取设置值5天');

// 怀孕概率
eq(C.probForDay(cyc, {}, C.dateOf(2025, 2, 15)), 90, '排卵日概率90%');
eq(C.probForDay(cyc, {}, C.dateOf(2025, 2, 14)), 70, '排卵前1天70%');
eq(C.probForDay(cyc, {}, C.dateOf(2025, 2, 10)), 12, '排卵前5天12%');
eq(C.probForDay(cyc, {}, C.dateOf(2025, 2, 1)), 0, '经期0%');
eq(C.probForDay(cyc, {}, C.dateOf(2025, 2, 20)), 1, '远离排卵窗≈1%');

// 开始日(2025-02-01)之前的日期一律不推算
eq(C.dayKindOf(cyc, {}, C.dateOf(2025, 1, 20)), 'normal', '开始日之前不推算=normal');
eq(C.probForDay(cyc, {}, C.dateOf(2025, 1, 20)), 0, '开始日之前概率=0');
eq(C.periodWindowAt(cyc, C.dateOf(2025, 1, 20)), null, '开始日之前无经期窗口');
eq(C.ovulationNear(cyc, C.dateOf(2025, 1, 20)), null, '开始日之前无排卵日');

console.log(`\n结果：${pass} 通过，${fail} 失败`);
process.exit(fail ? 1 : 0);
