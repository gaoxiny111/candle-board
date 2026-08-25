import type { Candle } from "./types";

export type Swing = { time: number; price: number; kind: "high" | "low"; index: number };

export function detectSwings(candles: Candle[], n = 3): Swing[] {
  const out: Swing[] = [];
  for (let i = n; i < candles.length - n; i++) {
    const h = candles[i].high;
    const l = candles[i].low;
    let isHigh = true;
    let isLow = true;
    for (let j = i - n; j <= i + n; j++) {
      if (j === i) continue;
      if (candles[j].high >= h) isHigh = false;
      if (candles[j].low <= l) isLow = false;
    }
    if (isHigh) out.push({ time: candles[i].time, price: h, kind: "high", index: i });
    if (isLow) out.push({ time: candles[i].time, price: l, kind: "low", index: i });
  }
  return out;
}

export function lastSwingRange(candles: Candle[]): {
  high: number;
  low: number;
  highTime: number;
  lowTime: number;
} | null {
  const swings = detectSwings(candles, 3);
  const highs = swings.filter((s) => s.kind === "high");
  const lows = swings.filter((s) => s.kind === "low");
  if (!highs.length || !lows.length) return null;
  const lastHigh = highs[highs.length - 1];
  const lastLow = lows[lows.length - 1];
  return {
    high: lastHigh.price,
    low: lastLow.price,
    highTime: lastHigh.time,
    lowTime: lastLow.time,
  };
}

export function magnetPrice(candles: Candle[], price: number, atr: number): number {
  let best = price;
  let dist = Infinity;
  const cap = Math.max(atr * 0.35, price * 0.0008);
  for (const c of candles.slice(-120)) {
    for (const p of [c.high, c.low, c.close, c.open]) {
      const d = Math.abs(p - price);
      if (d < dist && d <= cap) {
        dist = d;
        best = p;
      }
    }
  }
  return best;
}
