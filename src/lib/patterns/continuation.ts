import type { Candle, PatternSignal } from "../types";
import { body, isBear, isBull } from "./geometry";

export function detectContinuation(candles: Candle[]): PatternSignal[] {
  const out: PatternSignal[] = [];
  for (let i = 4; i < candles.length; i++) {
    const first = candles[i - 4];
    const m1 = candles[i - 3];
    const m2 = candles[i - 2];
    const m3 = candles[i - 1];
    const last = candles[i];
    const mids = [m1, m2, m3];

    const rising =
      isBull(first) &&
      body(first) > 0 &&
      mids.every((c) => isBear(c) || body(c) < body(first) * 0.6) &&
      Math.min(...mids.map((c) => c.low)) >= first.low &&
      Math.max(...mids.map((c) => c.high)) <= first.high &&
      isBull(last) &&
      last.close > first.high;

    if (rising) {
      out.push({
        id: `rise3-${i}`,
        kind: "rising_three_methods",
        label: "上升三法",
        direction: "bull",
        index: i,
        startIndex: i - 4,
        time: last.time,
        quality: 4.3,
        grade: "B",
        notes: ["回调未破前低"],
        extreme: first.low,
      });
    }

    const falling =
      isBear(first) &&
      body(first) > 0 &&
      mids.every((c) => isBull(c) || body(c) < body(first) * 0.6) &&
      Math.max(...mids.map((c) => c.high)) <= first.high &&
      Math.min(...mids.map((c) => c.low)) >= first.low &&
      isBear(last) &&
      last.close < first.low;

    if (falling) {
      out.push({
        id: `fall3-${i}`,
        kind: "falling_three_methods",
        label: "下降三法",
        direction: "bear",
        index: i,
        startIndex: i - 4,
        time: last.time,
        quality: 4.3,
        grade: "B",
        notes: ["反弹未破前高"],
        extreme: first.high,
      });
    }
  }

  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1];
    const cur = candles[i];
    if (cur.low > prev.high) {
      out.push({
        id: `win-up-${i}`,
        kind: "window_up",
        label: "向上窗口",
        direction: "bull",
        index: i,
        startIndex: i - 1,
        time: cur.time,
        quality: 3.6,
        grade: "B",
        notes: ["缺口未回补初筛"],
        extreme: prev.high,
      });
    }
    if (cur.high < prev.low) {
      out.push({
        id: `win-down-${i}`,
        kind: "window_down",
        label: "向下窗口",
        direction: "bear",
        index: i,
        startIndex: i - 1,
        time: cur.time,
        quality: 3.6,
        grade: "B",
        notes: ["缺口未回补初筛"],
        extreme: prev.low,
      });
    }
  }
  return out;
}
