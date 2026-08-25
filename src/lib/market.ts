import type { Candle, Timeframe } from "./types";
import { htfOf } from "./symbols";
import type { SymbolDef } from "./symbols";

const YAHOO_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function yahooInterval(tf: Timeframe): { interval: string; range: string } {
  switch (tf) {
    case "1h":
      return { interval: "1h", range: "6mo" };
    case "4h":
      return { interval: "1h", range: "1y" };
    case "1d":
      return { interval: "1d", range: "5y" };
    case "1w":
      return { interval: "1wk", range: "10y" };
  }
}

function binanceInterval(tf: Timeframe): string {
  switch (tf) {
    case "1h":
      return "1h";
    case "4h":
      return "4h";
    case "1d":
      return "1d";
    case "1w":
      return "1w";
  }
}

function aggregate4h(candles: Candle[]): Candle[] {
  const out: Candle[] = [];
  const bucket = new Map<number, Candle[]>();
  for (const c of candles) {
    const t = Math.floor(c.time / 14400) * 14400;
    const list = bucket.get(t) ?? [];
    list.push(c);
    bucket.set(t, list);
  }
  const times = [...bucket.keys()].sort((a, b) => a - b);
  for (const t of times) {
    const bars = bucket.get(t)!;
    if (!bars.length) continue;
    out.push({
      time: t,
      open: bars[0].open,
      high: Math.max(...bars.map((b) => b.high)),
      low: Math.min(...bars.map((b) => b.low)),
      close: bars[bars.length - 1].close,
      volume: bars.reduce((s, b) => s + b.volume, 0),
    });
  }
  return out;
}

async function fetchYahoo(ticker: string, tf: Timeframe): Promise<Candle[]> {
  const { interval, range } = yahooInterval(tf);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker,
  )}?interval=${interval}&range=${range}`;
  const res = await fetch(url, {
    headers: { "User-Agent": YAHOO_UA, Accept: "application/json" },
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`Yahoo ${res.status}`);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error("Yahoo empty");
  const ts: number[] = result.timestamp ?? [];
  const q = result.indicators?.quote?.[0] ?? {};
  const candles: Candle[] = [];
  for (let i = 0; i < ts.length; i++) {
    const open = q.open?.[i];
    const high = q.high?.[i];
    const low = q.low?.[i];
    const close = q.close?.[i];
    const volume = q.volume?.[i];
    if ([open, high, low, close].some((v) => v == null || Number.isNaN(v))) continue;
    candles.push({
      time: ts[i],
      open,
      high,
      low,
      close,
      volume: volume ?? 0,
    });
  }
  return tf === "4h" ? aggregate4h(candles) : candles;
}

async function fetchBinance(ticker: string, tf: Timeframe): Promise<Candle[]> {
  const interval = binanceInterval(tf);
  const url = `https://api.binance.com/api/v3/klines?symbol=${ticker}&interval=${interval}&limit=1000`;
  const res = await fetch(url, { next: { revalidate: 15 } });
  if (!res.ok) throw new Error(`Binance ${res.status}`);
  const rows = (await res.json()) as unknown[];
  return rows.map((row) => {
    const r = row as (string | number)[];
    return {
      time: Math.floor(Number(r[0]) / 1000),
      open: Number(r[1]),
      high: Number(r[2]),
      low: Number(r[3]),
      close: Number(r[4]),
      volume: Number(r[5]),
    };
  });
}

export function mockCandles(seedPrice = 100, count = 400): Candle[] {
  const candles: Candle[] = [];
  let price = seedPrice;
  const now = Math.floor(Date.now() / 1000);
  const step = 86400;
  for (let i = count; i >= 0; i--) {
    const drift = (Math.sin(i / 18) + Math.cos(i / 41)) * 0.4;
    const shock = Math.sin(i / 7) * 0.8;
    const open = price;
    const close = Math.max(0.5, open * (1 + (drift + shock) * 0.008));
    const high = Math.max(open, close) * (1 + Math.abs(Math.sin(i)) * 0.012);
    const low = Math.min(open, close) * (1 - Math.abs(Math.cos(i * 1.3)) * 0.012);
    const volume = 800 + Math.abs(Math.sin(i / 3)) * 2200 + (i % 23 === 0 ? 4000 : 0);
    candles.push({
      time: now - i * step,
      open,
      high,
      low,
      close,
      volume,
    });
    price = close;
  }
  return candles;
}

export async function loadCandles(
  symbol: SymbolDef,
  tf: Timeframe,
): Promise<{ candles: Candle[]; source: string; mock: boolean }> {
  try {
    const candles =
      symbol.source === "binance"
        ? await fetchBinance(symbol.ticker, tf)
        : await fetchYahoo(symbol.ticker, tf);
    if (candles.length < 50) throw new Error("too few bars");
    return { candles, source: symbol.source, mock: false };
  } catch {
    return { candles: mockCandles(symbol.source === "binance" ? 60000 : 100), source: "mock", mock: true };
  }
}

export async function loadHtf(symbol: SymbolDef, tf: Timeframe) {
  return loadCandles(symbol, htfOf(tf));
}
