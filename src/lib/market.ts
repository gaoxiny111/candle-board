import type { Candle, Timeframe } from "./types";
import { htfOf } from "./symbols";
import type { SymbolDef } from "./symbols";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function sinaScale(tf: Timeframe): number | null {
  switch (tf) {
    case "1h":
      return 60;
    case "1d":
      return 240;
    case "1w":
      return null;
  }
}

function tencentPeriod(tf: Timeframe): string {
  switch (tf) {
    case "1h":
      return "m60";
    case "1d":
      return "day";
    case "1w":
      return "week";
  }
}

function normalizeCandles(candles: Candle[]): Candle[] {
  const byTime = new Map<number, Candle>();
  for (const c of candles) {
    if (!Number.isFinite(c.time) || c.time <= 0) continue;
    byTime.set(Math.floor(c.time), c);
  }
  return [...byTime.values()].sort((a, b) => a.time - b.time);
}

function parseCnDate(s: string, tf: Timeframe): number {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?/);
  if (!m) return 0;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  if (tf === "1d" || tf === "1w") return Math.floor(Date.UTC(y, mo, d) / 1000);
  const hh = Number(m[4] ?? "0");
  const mm = Number(m[5] ?? "0");
  return Math.floor(Date.UTC(y, mo, d, hh - 8, mm, 0) / 1000);
}

async function fetchSina(symbol: SymbolDef, tf: Timeframe): Promise<Candle[]> {
  const scale = sinaScale(tf);
  if (scale == null) throw new Error("sina no weekly");
  const url =
    `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData` +
    `?symbol=${symbol.sina}&scale=${scale}&ma=no&datalen=1023`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Referer: "https://finance.sina.com.cn/", Accept: "*/*" },
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`Sina ${res.status}`);
  const rows = (await res.json()) as {
    day: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  }[];
  if (!Array.isArray(rows) || rows.length < 30) throw new Error("Sina empty");
  return rows.map((r) => ({
    time: parseCnDate(r.day, tf),
    open: Number(r.open),
    high: Number(r.high),
    low: Number(r.low),
    close: Number(r.close),
    volume: Number(r.volume),
  }));
}

async function fetchTencent(symbol: SymbolDef, tf: Timeframe): Promise<Candle[]> {
  const period = tencentPeriod(tf);
  const count = tf === "1w" ? 520 : 640;
  const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${symbol.sina},${period},,,${count},qfq`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Referer: "https://gu.qq.com/", Accept: "*/*" },
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`Tencent ${res.status}`);
  const json = await res.json();
  const block = json?.data?.[symbol.sina] ?? {};
  const key =
    Object.keys(block).find((k) => k.includes(period) || k.includes("day") || k.includes("week") || k.includes("m60")) ??
    Object.keys(block).find((k) => Array.isArray(block[k]));
  const rows: unknown[] = key ? block[key] : [];
  if (!Array.isArray(rows) || rows.length < 30) throw new Error("Tencent empty");
  const candles: Candle[] = [];
  for (const row of rows) {
    const r = row as (string | number | object)[];
    if (!Array.isArray(r) || r.length < 5) continue;
    const time = parseCnDate(String(r[0]), tf);
    const open = Number(r[1]);
    const close = Number(r[2]);
    const high = Number(r[3]);
    const low = Number(r[4]);
    const volume = Number(r[5] ?? 0);
    if (![time, open, high, low, close].every((v) => Number.isFinite(v))) continue;
    candles.push({ time, open, high, low, close, volume: Number.isFinite(volume) ? volume : 0 });
  }
  if (candles.length < 30) throw new Error("Tencent too few");
  return candles;
}

async function fetchCnStock(symbol: SymbolDef, tf: Timeframe): Promise<Candle[]> {
  const errors: string[] = [];
  if (tf !== "1w") {
    try {
      return await fetchSina(symbol, tf);
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "sina");
    }
  }
  try {
    return await fetchTencent(symbol, tf);
  } catch (e) {
    errors.push(e instanceof Error ? e.message : "tencent");
  }
  throw new Error(`CN stock failed: ${errors.join("; ")}`);
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
    const volume = 800000 + Math.abs(Math.sin(i / 3)) * 2200000;
    candles.push({ time: now - i * step, open, high, low, close, volume });
    price = close;
  }
  return candles;
}

export async function loadCandles(
  symbol: SymbolDef,
  tf: Timeframe,
): Promise<{ candles: Candle[]; source: string; mock: boolean }> {
  try {
    const candles = await fetchCnStock(symbol, tf);
    if (candles.length < 50) throw new Error("too few bars");
    return { candles: normalizeCandles(candles), source: "sina/tencent", mock: false };
  } catch {
    const seed = symbol.group === "index" ? 3200 : symbol.group === "etf" ? 4.2 : 180;
    return { candles: normalizeCandles(mockCandles(seed)), source: "mock", mock: true };
  }
}

export async function loadHtf(symbol: SymbolDef, tf: Timeframe) {
  return loadCandles(symbol, htfOf(tf));
}
