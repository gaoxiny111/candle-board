import type { Candle, HtfTrend, IndicatorSnapshot } from "./types";
import { maAlignment } from "./ashare";

export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    out.push(i >= period - 1 ? sum / period : null);
  }
  return out;
}

export function ema(values: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const out: (number | null)[] = [];
  let prev: number | null = null;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      out.push(null);
      continue;
    }
    if (prev === null) {
      const slice = values.slice(0, period);
      prev = slice.reduce((a, b) => a + b, 0) / period;
    } else {
      prev = values[i] * k + prev * (1 - k);
    }
    out.push(prev);
  }
  return out;
}

export function rsi(closes: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = [null];
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);
    if (i <= period) {
      avgGain += gain;
      avgLoss += loss;
      if (i < period) {
        out.push(null);
        continue;
      }
      avgGain /= period;
      avgLoss /= period;
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    out.push(100 - 100 / (1 + rs));
  }
  return out;
}

export function atr(candles: Candle[], period = 14): (number | null)[] {
  const trs: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      trs.push(candles[i].high - candles[i].low);
      continue;
    }
    const prevClose = candles[i - 1].close;
    trs.push(
      Math.max(
        candles[i].high - candles[i].low,
        Math.abs(candles[i].high - prevClose),
        Math.abs(candles[i].low - prevClose),
      ),
    );
  }
  return sma(trs, period);
}

export function macd(closes: number[], fast = 12, slow = 26, signal = 9) {
  const fastEma = ema(closes, fast);
  const slowEma = ema(closes, slow);
  const macdLine: (number | null)[] = closes.map((_, i) => {
    if (fastEma[i] == null || slowEma[i] == null) return null;
    return (fastEma[i] as number) - (slowEma[i] as number);
  });
  const firstValid = macdLine.findIndex((v) => v != null);
  const signalLine: (number | null)[] = macdLine.map(() => null);
  if (firstValid >= 0) {
    const compact = macdLine.slice(firstValid) as number[];
    const sig = ema(compact, signal);
    for (let i = 0; i < sig.length; i++) signalLine[firstValid + i] = sig[i];
  }
  const hist = macdLine.map((v, i) =>
    v == null || signalLine[i] == null ? null : v - (signalLine[i] as number),
  );
  return { macdLine, signalLine, hist };
}

/** A股常用 KDJ(9,3,3) */
export function kdj(candles: Candle[], n = 9, m1 = 3, m2 = 3) {
  const k: (number | null)[] = [];
  const d: (number | null)[] = [];
  const j: (number | null)[] = [];
  let prevK = 50;
  let prevD = 50;
  for (let i = 0; i < candles.length; i++) {
    if (i < n - 1) {
      k.push(null);
      d.push(null);
      j.push(null);
      continue;
    }
    let hh = -Infinity;
    let ll = Infinity;
    for (let t = i - n + 1; t <= i; t++) {
      hh = Math.max(hh, candles[t].high);
      ll = Math.min(ll, candles[t].low);
    }
    const rsv = hh === ll ? 50 : ((candles[i].close - ll) / (hh - ll)) * 100;
    const curK = (rsv + (m1 - 1) * prevK) / m1;
    const curD = (curK + (m2 - 1) * prevD) / m2;
    const curJ = 3 * curK - 2 * curD;
    k.push(curK);
    d.push(curD);
    j.push(curJ);
    prevK = curK;
    prevD = curD;
  }
  return { k, d, j };
}

export function lastNumber(values: (number | null)[] | undefined): number | null {
  if (!values) return null;
  for (let i = values.length - 1; i >= 0; i--) {
    const v = values[i];
    if (v != null && Number.isFinite(v)) return v;
  }
  return null;
}

export function slope(values: (number | null)[], lookback = 5): number {
  const curr = lastNumber(values);
  const prev = values[values.length - 1 - lookback];
  if (curr == null || prev == null || prev === 0) return 0;
  return (curr - prev) / Math.abs(prev);
}

export function computeIndicators(candles: Candle[]): IndicatorSnapshot {
  const closes = candles.map((c) => c.close);
  const vols = candles.map((c) => c.volume);
  const m = macd(closes);
  return {
    ma5: sma(closes, 5),
    ma10: sma(closes, 10),
    ma20: sma(closes, 20),
    ma60: sma(closes, 60),
    rsi: rsi(closes, 14),
    atr: atr(candles, 14),
    kdj: kdj(candles, 9, 3, 3),
    macd: { macd: m.macdLine, signal: m.signalLine, hist: m.hist },
    volMa5: sma(vols, 5),
    volMa20: sma(vols, 20),
  };
}

export function htfFromCandles(candles: Candle[], label: string): HtfTrend {
  const closes = candles.map((c) => c.close);
  const ma5 = lastNumber(sma(closes, 5));
  const ma10 = lastNumber(sma(closes, 10));
  const ma20 = lastNumber(sma(closes, 20));
  const ma60 = lastNumber(sma(closes, 60));
  const align = maAlignment(ma5, ma10, ma20, ma60);
  const s = slope(sma(closes, 20), 5);
  return {
    label,
    direction: align === "side" ? (s > 0.004 ? "up" : s < -0.004 ? "down" : "side") : align,
    slope: s,
    ma20,
  };
}
