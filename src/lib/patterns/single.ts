import type { Candle, PatternSignal } from "../types";
import {
  body,
  isBear,
  isBull,
  isDoji,
  lowerShadow,
  priorTrend,
  range,
  upperShadow,
  DEFAULT_THRESH,
} from "./geometry";

function scoreShadows(longRatio: number, shortRatio: number): number {
  let s = 2.5;
  if (longRatio >= 2) s += 1;
  if (longRatio >= 3) s += 0.5;
  if (shortRatio <= 0.3) s += 0.7;
  if (shortRatio <= 0.15) s += 0.3;
  return Math.min(5, s);
}

export function detectSingle(candles: Candle[]): PatternSignal[] {
  const out: PatternSignal[] = [];
  const t = DEFAULT_THRESH;
  for (let i = 2; i < candles.length; i++) {
    const c = candles[i];
    const r = range(c);
    const b = body(c);
    const us = upperShadow(c);
    const ls = lowerShadow(c);
    const trend = priorTrend(candles, i);
    const time = c.time;

    const hammerShape = ls >= t.longShadowMul * b && us <= t.shortShadowMul * b && b / r <= 0.45;
    const starShape = us >= t.longShadowMul * b && ls <= t.shortShadowMul * b && b / r <= 0.45;

    if (hammerShape && trend !== "up") {
      out.push({
        id: `hammer-${i}`,
        kind: "hammer",
        label: "锤子线",
        direction: "bull",
        index: i,
        startIndex: i,
        time,
        quality: scoreShadows(ls / Math.max(b, 1e-12), us / Math.max(b, 1e-12)),
        grade: "B",
        notes: ["下影线≥2倍实体", "出现在下跌/盘整后"],
        extreme: c.low,
      });
    } else if (hammerShape && trend === "up") {
      out.push({
        id: `hanging-${i}`,
        kind: "hanging_man",
        label: "上吊线",
        direction: "bear",
        index: i,
        startIndex: i,
        time,
        quality: scoreShadows(ls / Math.max(b, 1e-12), us / Math.max(b, 1e-12)),
        grade: "B",
        notes: ["形态同上吊，位置在上涨后"],
        extreme: c.high,
      });
    }

    if (starShape && trend !== "up") {
      out.push({
        id: `invhammer-${i}`,
        kind: "inverted_hammer",
        label: "倒锤子",
        direction: "bull",
        index: i,
        startIndex: i,
        time,
        quality: scoreShadows(us / Math.max(b, 1e-12), ls / Math.max(b, 1e-12)),
        grade: "B",
        notes: ["上影线长，需后续确认"],
        extreme: c.low,
      });
    } else if (starShape && trend === "up") {
      out.push({
        id: `shoot-${i}`,
        kind: "shooting_star",
        label: "射击之星",
        direction: "bear",
        index: i,
        startIndex: i,
        time,
        quality: scoreShadows(us / Math.max(b, 1e-12), ls / Math.max(b, 1e-12)),
        grade: "B",
        notes: ["上涨后长上影"],
        extreme: c.high,
      });
    }

    if (isDoji(c, t.dojiBody)) {
      if (ls >= 2 * b && us <= 0.2 * r) {
        out.push({
          id: `dragonfly-${i}`,
          kind: "dragonfly_doji",
          label: "蜻蜓十字",
          direction: "bull",
          index: i,
          startIndex: i,
          time,
          quality: 4,
          grade: "B",
          notes: ["开收接近最高价"],
          extreme: c.low,
        });
      } else if (us >= 2 * b && ls <= 0.2 * r) {
        out.push({
          id: `gravestone-${i}`,
          kind: "gravestone_doji",
          label: "墓碑十字",
          direction: "bear",
          index: i,
          startIndex: i,
          time,
          quality: 4,
          grade: "B",
          notes: ["开收接近最低价"],
          extreme: c.high,
        });
      }
    }
  }
  return out;
}
