import type { Candle, PatternSignal } from "../types";
import { body, isBear, isBull, isDoji, realBodyBottom, realBodyTop } from "./geometry";

export function detectTriple(candles: Candle[], gapDetect = true): PatternSignal[] {
  const out: PatternSignal[] = [];
  for (let i = 2; i < candles.length; i++) {
    const a = candles[i - 2];
    const b = candles[i - 1];
    const c = candles[i];

    const starSmall = body(b) < body(a) * 0.5;
    const morning =
      isBear(a) &&
      starSmall &&
      isBull(c) &&
      c.close > (a.open + a.close) / 2 &&
      realBodyTop(b) < realBodyBottom(a);
    const evening =
      isBull(a) &&
      starSmall &&
      isBear(c) &&
      c.close < (a.open + a.close) / 2 &&
      realBodyBottom(b) > realBodyTop(a);

    if (morning) {
      const gapped = !gapDetect || b.high < a.low || isDoji(b);
      out.push({
        id: `morning-${i}`,
        kind: "morning_star",
        label: "晨星",
        direction: "bull",
        index: i,
        startIndex: i - 2,
        time: c.time,
        quality: gapped ? 4.5 : 3.8,
        grade: "B",
        notes: gapDetect ? ["星线跳空检测开启"] : ["星线跳空可选"],
        extreme: Math.min(a.low, b.low, c.low),
      });
    }
    if (evening) {
      const gapped = !gapDetect || b.low > a.high || isDoji(b);
      out.push({
        id: `evening-${i}`,
        kind: "evening_star",
        label: "暮星",
        direction: "bear",
        index: i,
        startIndex: i - 2,
        time: c.time,
        quality: gapped ? 4.5 : 3.8,
        grade: "B",
        notes: gapDetect ? ["星线跳空检测开启"] : ["星线跳空可选"],
        extreme: Math.max(a.high, b.high, c.high),
      });
    }

    if (isBull(a) && isBull(b) && isBull(c) && a.close < b.close && b.close < c.close) {
      const rising = a.open < b.open && b.open < c.open;
      if (rising) {
        out.push({
          id: `soldiers-${i}`,
          kind: "three_white_soldiers",
          label: "三阳兵",
          direction: "bull",
          index: i,
          startIndex: i - 2,
          time: c.time,
          quality: 4.2,
          grade: "B",
          notes: ["连续三根递进阳线"],
          extreme: a.low,
        });
      }
    }
    if (isBear(a) && isBear(b) && isBear(c) && a.close > b.close && b.close > c.close) {
      const falling = a.open > b.open && b.open > c.open;
      if (falling) {
        out.push({
          id: `crows-${i}`,
          kind: "three_black_crows",
          label: "三乌鸦",
          direction: "bear",
          index: i,
          startIndex: i - 2,
          time: c.time,
          quality: 4.2,
          grade: "B",
          notes: ["连续三根递进阴线"],
          extreme: a.high,
        });
      }
    }

    if (gapDetect) {
      const gapDown = b.high < a.low && c.low > b.high && isBear(a) && isBull(c);
      const gapUp = b.low > a.high && c.high < b.low && isBull(a) && isBear(c);
      if (gapDown && isDoji(b)) {
        out.push({
          id: `baby-bull-${i}`,
          kind: "abandoned_baby_bull",
          label: "看涨弃婴",
          direction: "bull",
          index: i,
          startIndex: i - 2,
          time: c.time,
          quality: 5,
          grade: "B",
          notes: ["双侧跳空十字"],
          extreme: b.low,
        });
      }
      if (gapUp && isDoji(b)) {
        out.push({
          id: `baby-bear-${i}`,
          kind: "abandoned_baby_bear",
          label: "看跌弃婴",
          direction: "bear",
          index: i,
          startIndex: i - 2,
          time: c.time,
          quality: 5,
          grade: "B",
          notes: ["双侧跳空十字"],
          extreme: b.high,
        });
      }
    }
  }
  return out;
}
