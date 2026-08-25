import type { Candle } from "../types";

export function body(c: Candle): number {
  return Math.abs(c.close - c.open);
}

export function range(c: Candle): number {
  return Math.max(c.high - c.low, 1e-12);
}

export function upperShadow(c: Candle): number {
  return c.high - Math.max(c.open, c.close);
}

export function lowerShadow(c: Candle): number {
  return Math.min(c.open, c.close) - c.low;
}

export function isBull(c: Candle): boolean {
  return c.close > c.open;
}

export function isBear(c: Candle): boolean {
  return c.close < c.open;
}

export function isDoji(c: Candle, thresh = 0.1): boolean {
  return body(c) / range(c) <= thresh;
}

export function realBodyTop(c: Candle): number {
  return Math.max(c.open, c.close);
}

export function realBodyBottom(c: Candle): number {
  return Math.min(c.open, c.close);
}

export function priorTrend(candles: Candle[], i: number, lookback = 5): "up" | "down" | "side" {
  if (i < lookback) return "side";
  const prev = candles[i - lookback].close;
  const now = candles[i].close;
  const chg = (now - prev) / prev;
  if (chg > 0.012) return "up";
  if (chg < -0.012) return "down";
  return "side";
}

export const DEFAULT_THRESH = {
  longShadowMul: 2,
  shortShadowMul: 0.35,
  dojiBody: 0.1,
  wrapRatio: 0.5,
  engulfBody: 1,
};
