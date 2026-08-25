import type { Candle, PatternSignal } from "../types";
import {
  body,
  isBear,
  isBull,
  realBodyBottom,
  realBodyTop,
  DEFAULT_THRESH,
} from "./geometry";

export function detectDual(candles: Candle[]): PatternSignal[] {
  const out: PatternSignal[] = [];
  const wrap = DEFAULT_THRESH.wrapRatio;
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1];
    const cur = candles[i];
    const prevBody = body(prev);
    const curBody = body(cur);
    if (prevBody <= 0) continue;

    const wraps =
      realBodyTop(cur) >= realBodyTop(prev) &&
      realBodyBottom(cur) <= realBodyBottom(prev) &&
      curBody >= prevBody * wrap;

    if (wraps && isBear(prev) && isBull(cur)) {
      out.push({
        id: `bull-eng-${i}`,
        kind: "bull_engulfing",
        label: "看涨吞没",
        direction: "bull",
        index: i,
        startIndex: i - 1,
        time: cur.time,
        quality: Math.min(5, 3 + curBody / prevBody),
        grade: "B",
        notes: [`包裹比例 ${(curBody / prevBody).toFixed(2)}`],
        extreme: Math.min(prev.low, cur.low),
      });
    }
    if (wraps && isBull(prev) && isBear(cur)) {
      out.push({
        id: `bear-eng-${i}`,
        kind: "bear_engulfing",
        label: "看跌吞没",
        direction: "bear",
        index: i,
        startIndex: i - 1,
        time: cur.time,
        quality: Math.min(5, 3 + curBody / prevBody),
        grade: "B",
        notes: [`包裹比例 ${(curBody / prevBody).toFixed(2)}`],
        extreme: Math.max(prev.high, cur.high),
      });
    }

    const midPrev = (prev.open + prev.close) / 2;
    if (
      isBear(prev) &&
      isBull(cur) &&
      cur.open < prev.low &&
      cur.close > midPrev &&
      cur.close < prev.open
    ) {
      out.push({
        id: `pierce-${i}`,
        kind: "piercing",
        label: "刺透",
        direction: "bull",
        index: i,
        startIndex: i - 1,
        time: cur.time,
        quality: 4,
        grade: "B",
        notes: ["收盘越过前阴实体中点"],
        extreme: Math.min(prev.low, cur.low),
      });
    }
    if (
      isBull(prev) &&
      isBear(cur) &&
      cur.open > prev.high &&
      cur.close < midPrev &&
      cur.close > prev.open
    ) {
      out.push({
        id: `dark-${i}`,
        kind: "dark_cloud",
        label: "乌云盖顶",
        direction: "bear",
        index: i,
        startIndex: i - 1,
        time: cur.time,
        quality: 4,
        grade: "B",
        notes: ["收盘跌破前阳实体中点"],
        extreme: Math.max(prev.high, cur.high),
      });
    }

    const inside =
      realBodyTop(cur) <= realBodyTop(prev) &&
      realBodyBottom(cur) >= realBodyBottom(prev) &&
      curBody < prevBody * 0.7;
    if (inside && isBear(prev) && isBull(cur)) {
      out.push({
        id: `bull-harami-${i}`,
        kind: "bull_harami",
        label: "看涨孕线",
        direction: "bull",
        index: i,
        startIndex: i - 1,
        time: cur.time,
        quality: 3.2,
        grade: "B",
        notes: ["实体落入前阴内部"],
        extreme: prev.low,
      });
    }
    if (inside && isBull(prev) && isBear(cur)) {
      out.push({
        id: `bear-harami-${i}`,
        kind: "bear_harami",
        label: "看跌孕线",
        direction: "bear",
        index: i,
        startIndex: i - 1,
        time: cur.time,
        quality: 3.2,
        grade: "B",
        notes: ["实体落入前阳内部"],
        extreme: prev.high,
      });
    }

    const atrApprox = Math.abs(prev.close) * 0.0015;
    if (Math.abs(prev.low - cur.low) <= atrApprox && isBull(cur) && prev.low <= cur.open) {
      out.push({
        id: `tweezer-b-${i}`,
        kind: "tweezer_bottom",
        label: "平头底部",
        direction: "bull",
        index: i,
        startIndex: i - 1,
        time: cur.time,
        quality: 3.4,
        grade: "B",
        notes: ["两根K线低点接近"],
        extreme: Math.min(prev.low, cur.low),
      });
    }
    if (Math.abs(prev.high - cur.high) <= atrApprox && isBear(cur) && prev.high >= cur.open) {
      out.push({
        id: `tweezer-t-${i}`,
        kind: "tweezer_top",
        label: "平头顶部",
        direction: "bear",
        index: i,
        startIndex: i - 1,
        time: cur.time,
        quality: 3.4,
        grade: "B",
        notes: ["两根K线高点接近"],
        extreme: Math.max(prev.high, cur.high),
      });
    }
  }
  return out;
}
