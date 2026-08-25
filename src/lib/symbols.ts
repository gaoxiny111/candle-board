import type { Timeframe } from "./types";

export type DataSource = "binance" | "yahoo";

export type SymbolDef = {
  id: string;
  name: string;
  source: DataSource;
  ticker: string;
};

export const SYMBOLS: SymbolDef[] = [
  { id: "BTCUSDT", name: "BTC/USDT", source: "binance", ticker: "BTCUSDT" },
  { id: "ETHUSDT", name: "ETH/USDT", source: "binance", ticker: "ETHUSDT" },
  { id: "SPY", name: "SPY", source: "yahoo", ticker: "SPY" },
  { id: "AAPL", name: "AAPL", source: "yahoo", ticker: "AAPL" },
  { id: "GLD", name: "黄金 ETF (GLD)", source: "yahoo", ticker: "GLD" },
  { id: "EURUSD", name: "EUR/USD", source: "yahoo", ticker: "EURUSD=X" },
];

export const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: "1h", label: "1H" },
  { id: "4h", label: "4H" },
  { id: "1d", label: "D" },
  { id: "1w", label: "W" },
];

export function htfLabel(tf: Timeframe): string {
  if (tf === "1h" || tf === "4h") return "日线";
  if (tf === "1d") return "周线";
  return "月线近似(周线)";
}

export function htfOf(tf: Timeframe): Timeframe {
  if (tf === "1h" || tf === "4h") return "1d";
  return "1w";
}
