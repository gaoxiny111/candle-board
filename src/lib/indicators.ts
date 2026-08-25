import type { Candle, HtfTrend, IndicatorSnapshot } from "./types";

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
  const macdVals = macdLine.map((v) => v ?? 0);
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
  return { macdLine, signalLine, hist, macdVals };
}

export function stochastic(candles: Candle[], kPeriod = 14, kSmooth = 3, dPeriod = 3) {
  const rawK: (number | null)[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < kPeriod - 1) {
      rawK.push(null);
      continue;
    }
    let hh = -Infinity;
    let ll = Infinity;
    for (let j = i - kPeriod + 1; j <= i; j++) {
      hh = Math.max(hh, candles[j].high);
      ll = Math.min(ll, candles[j].low);
    }
    const den = hh - ll || 1e-12;
    rawK.push(((candles[i].close - ll) / den) * 100);
  }
  const kFilled = rawK.map((v) => v ?? 0);
  const kSma = sma(kFilled, kSmooth);
  const k: (number | null)[] = rawK.map((v, i) => (v == null ? null : kSma[i]));
  const kNum = k.map((v) => v ?? 0);
  const dSma = sma(kNum, dPeriod);
  const d: (number | null)[] = k.map((v, i) => (v == null ? null : dSma[i]));
  return { k, d };
}

export function lastNumber(values: (number | null)[]): number | null {
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

export function computeIndicators(candles: Candle[]): import("./types").IndicatorSnapshot {
  const closes = candles.map((c) => c.close);
  const vols = candles.map((c) => c.volume);
  const m = macd(closes);
  return {
    ma20: sma(closes, 20),
    ma50: sma(closes, 50),
    ma200: sma(closes, 200),
    rsi: rsi(closes, 14),
    atr: atr(candles, 14),
    stoch: stochastic(candles),
    macd: { macd: m.macdLine, signal: m.signalLine, hist: m.hist },
    volMa20: sma(vols, 20),
    volMa50: sma(vols, 50),
  };
}

export function htfFromCandles(
  candles: Candle[],
  label: string,
): import("./types").HtfTrend {
  const ma = sma(
    candles.map((c) => c.close),
    20,
  );
  const s = slope(ma, 5);
  return {
    label,
    direction: s > 0.004 ? "up" : s < -0.004 ? "down" : "side",
    slope: s,
    ma20: lastNumber(ma),
  };
}
