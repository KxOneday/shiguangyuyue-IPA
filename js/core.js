/* ============================================================
 * core.js —— 纯日期/事件逻辑（不依赖 DOM，可在 Node 中自测）
 * 事件字段约定（store.js 持久化同一结构）：
 *   id, title, note, cat, pinned, ctime,
 *   cal: 'solar' | 'lunar'
 *   solar: y, m, d        lunar: lm(1-12), lLeap(bool), ld
 *   repeat: bool（每年）  anniversary: bool（纪念日模式）
 *   bg: 'none' | 'g1'..'g7' | 'img'   remind: null | {adv:0|1|3|7, hh, mm}
 * ============================================================ */
'use strict';
(function () {
  const L = () => window.DM.lunar;
  const MS_DAY = 86400000;

  /* ---------- 基础日期工具（全部按本地时区） ---------- */
  function dateOf(y, m, d) { return new Date(y, m - 1, d); }

  function parseYMD(s) {
    if (!s) return null;
    const p = String(s).split('-').map(Number);
    if (p.length !== 3 || p.some(isNaN)) return null;
    return dateOf(p[0], p[1], p[2]);
  }

  function ymd(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  function todayMid(now) {
    const n = now || new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }

  /** A 的 0 点 减 B 的 0 点的整天数（A 晚于 B 为正） */
  function dayDiff(A, B) {
    const a = todayMid(A), b = todayMid(B);
    return Math.round((a.getTime() - b.getTime()) / MS_DAY);
  }

  function addDays(date, n) {
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + n);
    return d;
  }

  function isLeapYear(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }

  function daysInMonth(y, m) { return new Date(y, m, 0).getDate(); }

  /** 2月29 在平年按 2月28 处理 */
  function clampValid(y, m, d) {
    if (m === 2 && d === 29 && !isLeapYear(y)) d = 28;
    const dim = daysInMonth(y, m);
    if (d > dim) d = dim;
    return { y, m, d };
  }

  const WEEK_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  function fmtCN(date) { return date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日'; }
  function fmtCNYMD(date) { return fmtCN(date) + ' ' + WEEK_CN[date.getDay()]; }

  /** 两个日期之间的 年/月/日 差（after >= before） */
  function diffYMD(after, before) {
    let y = after.getFullYear() - before.getFullYear();
    let mo = after.getMonth() - before.getMonth();
    let d = after.getDate() - before.getDate();
    if (d < 0) { mo--; const dim = daysInMonth(after.getFullYear(), after.getMonth()); d += dim; }
    if (mo < 0) { y--; mo += 12; }
    return { y, mo, d };
  }

  /* ---------- 生理周期推算 ---------- */
  /** 周期参数归一：预测经期长度 L 取用户设置；实际长短只影响当日显示 */
  function cycleLenInfo(cycle) {
    const len = Math.max(7, Math.min(90, Math.round((cycle && cycle.cycleLen) || 28)));
    const L = Math.max(1, Math.min(len, Math.round((cycle && cycle.periodLen) || 5)));
    return { len, L, gap: Math.max(1, len - L) };
  }
  /** 周期第几天（0 起）；只推算开始日之后，之前返回 null */
  function periodDayInfo(cycle, date) {
    if (!cycle || !cycle.lastStart) return null;
    const info = cycleLenInfo(cycle);
    const start = parseYMD(cycle.lastStart);
    const diff = dayDiff(date, start);
    if (diff < 0) return null;
    const k = Math.floor(diff / info.len);
    const ws = addDays(start, k * info.len);
    const day = dayDiff(date, ws);
    return { day, len: info.len, cycle: k, ws };
  }
  /** 经期窗口（每个周期起点 ~ 起点+L-1）；开始日之前不预测，无则 null */
  function periodWindowAt(cycle, date) {
    if (!cycle || !cycle.lastStart) return null;
    const info = cycleLenInfo(cycle);
    const start = parseYMD(cycle.lastStart);
    if (dayDiff(date, start) < 0) return null;
    const k = Math.floor(dayDiff(date, start) / info.len);
    const ws = addDays(start, k * info.len);
    const dd = dayDiff(date, ws);
    if (dd >= 0 && dd < info.L) return { ws, L: info.L, len: info.len };
    return null;
  }
  /** 排卵日（每个周期内“下次开始前 14 天”）；开始日之前不预测，返回 null */
  function ovulationNear(cycle, date) {
    if (!cycle || !cycle.lastStart) return null;
    const info = cycleLenInfo(cycle);
    const start = parseYMD(cycle.lastStart);
    if (!start || dayDiff(date, start) < 0) return null;
    const kMid = Math.floor(dayDiff(date, start) / info.len);
    let best = null, bestAbs = Infinity;
    for (let k = kMid - 1; k <= kMid + 1; k++) {
      const ov = addDays(start, (k + 1) * info.len - 14);
      const a = Math.abs(dayDiff(date, ov));
      if (a < bestAbs) { bestAbs = a; best = ov; }
    }
    return best;
  }
  /** 日期状态：'period' 经期 / 'ovulation' 排卵 / 'fertile' 易孕 / 'normal'
   *  推算依据（ACOG 美国妇产科医师学会 + Wilcox et al. NEJM 1995）：
   *  排卵 ≈ 下次经期前 14 天（黄体期约 14 天，相对固定）
   *  精子在女性生殖道可存活 3-5 天，卵子排出后可存活 12-24 小时
   *  → 易孕期 = 排卵前 5 天 ~ 排卵后 1 天（含排卵日当天）
   *  仅从"用户设置的开始日"起推算，之前的日期一律 normal/空白 */
  function dayKindOf(cycle, marks, date) {
    const ds = ymd(date);
    if (marks && marks[ds] && (marks[ds].f || 0) > 0) return 'period';
    if (!cycle || !cycle.lastStart) return 'normal';
    const start = parseYMD(cycle.lastStart);
    if (dayDiff(date, start) < 0) return 'normal';
    if (periodWindowAt(cycle, date)) return 'period';
    const ov = ovulationNear(cycle, date);
    if (ov && ymd(date) === ymd(ov)) return 'ovulation';
    const dd = ov ? dayDiff(date, ov) : 99;
    if (dd >= -5 && dd <= 1) return 'fertile';
    return 'normal';
  }
  /** from（含）起下一次周期开始日（始终按“开始日+周期长度”推，结束日不改变推算） */
  function nextCycleStart(cycle, from) {
    if (!cycle || !cycle.lastStart) return null;
    const info = cycleLenInfo(cycle);
    const start = parseYMD(cycle.lastStart);
    let cur = addDays(start, info.len);
    const f = todayMid(from);
    let guard = 0;
    while (dayDiff(cur, f) < 0 && guard < 400) { cur = addDays(cur, info.len); guard++; }
    return cur;
  }
  /** 本次经期预计结束日（未标记结束时的预测） */
  function predictedPeriodEnd(cycle) {
    if (!cycle || !cycle.lastStart) return null;
    const info = cycleLenInfo(cycle);
    return addDays(parseYMD(cycle.lastStart), info.L - 1);
  }

  /* ---------- 事件 → 目标日期解析 ---------- */

  /** 农历事件在指定公历年中的公历日期（可能没有/跨年） */
  function lunarDateInYear(ev, gregorianYear) {
    const lu = L();
    if (!lu || ev.cal !== 'lunar') return null;
    // 农历 X 年在公历上跨约 1 年：考虑 gy-1 与 gy 两个农历年
    for (const ly of [gregorianYear - 1, gregorianYear]) {
      if (!lu.inRange(ly)) continue;
      if (ev.lLeap && lu.leapMonthOf(ly) !== ev.lm) continue; // 该年无此闰月
      const s = lu.lunarToSolar(ly, ev.lm, ev.ld, !!ev.lLeap);
      if (s && s.y === gregorianYear) return dateOf(s.y, s.m, s.d);
    }
    return null;
  }

  /** 一次性农历事件（带农历年份、不重复）的固定公历日期 */
  function fixedLunarSolar(ev) {
    if (ev.cal !== 'lunar' || ev.repeat || !ev.ly) return null;
    const lu = L();
    if (!lu || !lu.inRange(ev.ly)) return null;
    const s = lu.lunarToSolar(ev.ly, ev.lm, ev.ld, !!ev.lLeap);
    return s ? dateOf(s.y, s.m, s.d) : null;
  }

  /** 事件（含每年重复/农历/一次性农历）在公历年 gy 内发生的日期数组 */
  function datesInYear(ev, gy) {
    const out = [];
    if (ev.cal === 'solar') {
      if (!ev.repeat) {
        if (ev.y === gy) out.push(dateOf(ev.y, ev.m, ev.d));
      } else {
        const c = clampValid(gy, ev.m, ev.d);
        out.push(dateOf(c.y, c.m, c.d));
      }
    } else if (!ev.repeat && ev.ly) {
      const f = fixedLunarSolar(ev);
      if (f && f.getFullYear() === gy) out.push(f);
    } else {
      const d = lunarDateInYear(ev, gy);
      if (d) out.push(d);
    }
    return out;
  }

  /** 下一次发生在 from（当日 0 点，含当天）之后的日期；无则 null */
  function nextOnOrAfter(ev, from) {
    from = todayMid(from);
    const fromYear = from.getFullYear();
    for (let gy = fromYear; gy <= fromYear + 5; gy++) {
      const ds = datesInYear(ev, gy);
      for (const d of ds) if (d.getTime() >= from.getTime()) return d;
    }
    return null;
  }

  /** 事件最近一次发生（<= today 的最大日期），无则 null */
  function lastOnOrBefore(ev, from) {
    from = todayMid(from);
    const fromYear = from.getFullYear();
    let best = null;
    for (let gy = fromYear; gy >= fromYear - 3; gy--) {
      const ds = datesInYear(ev, gy);
      for (const d of ds) if (d.getTime() <= from.getTime()) { if (!best || d.getTime() > best.getTime()) best = d; }
      if (best) return best;
    }
    return null;
  }

  /* ---------- 卡片显示状态 ---------- */

  /**
   * 返回给 UI 用的展示模型：
   * { phase:'future'|'today'|'past', kw, num, unit, dateLine, lunarLine, annual, diffDays, extraChips, pastNice }
   */
  function stateOf(ev, now) {
    now = now || new Date();
    const today = todayMid(now);
    const lu = L();

    let target = null;          // 当前展示的目标日
    let annual = !!ev.repeat;   // 每年重复（农历默认也视为每年）
    let pastTargetDate = null;  // 非每年事件的原始日期（可能在过去）

    if (ev.cal === 'solar') {
      if (ev.repeat) {
        target = nextOnOrAfter(ev, today);
        if (!target) { target = dateOf(ev.y, ev.m, ev.d); annual = false; }
      } else {
        target = dateOf(ev.y, ev.m, ev.d);
        pastTargetDate = target;
      }
    } else {
      // 农历事件：带年份且不重复 = 一次性精确日期；否则按每年处理
      const fixed = fixedLunarSolar(ev);
      if (fixed) {
        target = fixed;
        annual = false;
        pastTargetDate = fixed;
      } else {
        annual = true;
        target = nextOnOrAfter(ev, today);
        if (!target) target = lunarDateInYear(ev, today.getFullYear());
      }
    }

    if (!target) return { phase: 'none', kw: '', num: null, unit: '天', dateLine: '', lunarLine: '', annual: false, diffDays: null, extraChips: [], pastNice: null };

    const diff = dayDiff(target, today); // >= 0（重复事件目标不会在过去）；非重复可为负
    const dateLine = fmtCNYMD(target);
    const isToday = diff === 0;
    const chips = [];
    if (annual) chips.push('每年');
    if (ev.cal === 'lunar') {
      const nm = lu.monthName(ev.lm, ev.lLeap) + lu.dayName(ev.ld);
      chips.push('农历 · ' + nm);
    }

    let lunarLine = '';
    try {
      const lt = lu.solarToLunar(target.getFullYear(), target.getMonth() + 1, target.getDate());
      if (lt) {
        // 生肖年份：优先使用事件里明确选择的农历年份；否则按公历日换算
        let year = lt.lYear;
        if (ev.cal === 'lunar' && ev.ly && lu.inRange(ev.ly)) year = ev.ly;
        lunarLine = '农历' + lu.monthName(lt.lMonth, lt.isLeap) + lu.dayName(lt.lDay) + ' · ' + lu.ganzhiOf(year) + '年';
        // 只有“生日”分类才显示生肖
        if (ev.cat === 'bd') lunarLine += ' · 属' + lu.zodiacOf(year);
      }
    } catch (e) { /* 范围外忽略 */ }

    const state = { phase: 'future', kw: '', num: null, unit: '天', dateLine, lunarLine, annual, diffDays: diff, extraChips: chips, pastNice: null };

    if (diff > 0) {
      state.phase = 'future';
      state.kw = '还有';
      state.num = diff;
    } else if (diff === 0) {
      state.phase = 'today';
      state.kw = '就是今天';
      state.num = null;
    } else {
      const pastDays = -diff;
      if (ev.anniversary) {
        state.phase = 'past';
        state.kw = '第';
        state.num = pastDays + 1;
        if (pastDays >= 364 && pastTargetDate) {
          const nd = diffYMD(today, pastTargetDate);
          state.pastNice = (nd.y ? nd.y + '年' : '') + (nd.mo ? nd.mo + '个月' : '') + (nd.d ? nd.d + '天' : '');
          if (!state.pastNice) state.pastNice = nd.y + '年';
        }
      } else {
        state.phase = 'past';
        state.kw = '已过';
        state.num = pastDays;
      }
    }
    return state;
  }

  /* ---------- 今天概览文案 ---------- */
  function todayLine(now) {
    now = now || new Date();
    const lu = L();
    let lunar = '';
    try {
      const lt = lu.solarToLunar(now.getFullYear(), now.getMonth() + 1, now.getDate());
      if (lt) lunar = '农历' + lu.monthName(lt.lMonth, lt.isLeap) + lu.dayName(lt.lDay);
    } catch (e) { /* 忽略 */ }
    return { date: fmtCN(now), week: WEEK_CN[now.getDay()], lunar };
  }

  window.DM = window.DM || {};
  window.DM.core = {
    MS_DAY, dateOf, parseYMD, ymd, todayMid, dayDiff, addDays,
    isLeapYear, daysInMonth, clampValid, WEEK_CN, fmtCN, fmtCNYMD, diffYMD,
    cycleLenInfo, periodDayInfo, periodWindowAt, ovulationNear, dayKindOf, nextCycleStart, predictedPeriodEnd,
    lunarDateInYear, fixedLunarSolar, datesInYear, nextOnOrAfter, lastOnOrBefore,
    stateOf, todayLine
  };
})();
