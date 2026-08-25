import type { Candle } from "./types";
import type { BoardType, SymbolDef } from "./symbols";

/** 涨跌停判定容差（避免浮点误差） */
const LIMIT_EPS = 0.002;

export function limitPctOf(board: BoardType | number): number {
  if (typeof board === "number") return board;
  return board === "main" ? 0.1 : 0.2;
}

export function limitPrices(prevClose: number, limitPct: number): { up: number; down: number } {
  const up = Math.round(prevClose * (1 + limitPct) * 100) / 100;
  const down = Math.round(prevClose * (1 - limitPct) * 100) / 100;
  return { up, down };
}

export function isLimitUp(candle: Candle, prevClose: number, limitPct: number): boolean {
  if (prevClose <= 0) return false;
  const { up } = limitPrices(prevClose, limitPct);
  return candle.close >= up * (1 - LIMIT_EPS) || candle.high >= up * (1 - LIMIT_EPS);
}

export function isLimitDown(candle: Candle, prevClose: number, limitPct: number): boolean {
  if (prevClose <= 0) return false;
  const { down } = limitPrices(prevClose, limitPct);
  return candle.close <= down * (1 + LIMIT_EPS) || candle.low <= down * (1 + LIMIT_EPS);
}

export function isOneWordBoard(c: Candle): boolean {
  return c.open === c.close && c.close === c.high && c.high === c.low;
}

/** 复牌/异常跳空：相对昨收 > 8% */
export function isAbnormalGap(candle: Candle, prev: Candle): boolean {
  if (prev.close <= 0) return false;
  return Math.abs(candle.open - prev.close) / prev.close > 0.08;
}

/**
 * A股形态识别预检：涨跌停、一字板、异常跳空不参与形态。
 * 指数不做涨跌停过滤。
 */
export function isValidCandleForPattern(
  candles: Candle[],
  index: number,
  symbol: SymbolDef,
): boolean {
  if (index < 1) return false;
  const c = candles[index];
  const prev = candles[index - 1];
  if (symbol.group === "index") {
    return !isOneWordBoard(c);
  }
  if (isOneWordBoard(c)) return false;
  if (isAbnormalGap(c, prev)) return false;
  const pct = symbol.limitPct;
  if (isLimitUp(c, prev.close, pct) || isLimitDown(c, prev.close, pct)) return false;
  return true;
}

/** 粗略下一交易日（跳过周末；节假日 Phase2 再接交易日历） */
export function nextTradingDay(fromSec: number): number {
  const d = new Date(fromSec * 1000);
  d.setUTCDate(d.getUTCDate() + 1);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 1000);
}

export function formatCnDate(sec: number): string {
  const d = new Date(sec * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function maAlignment(
  ma5: number | null,
  ma10: number | null,
  ma20: number | null,
  ma60: number | null,
): "up" | "down" | "side" {
  if (ma5 == null || ma10 == null || ma20 == null || ma60 == null) return "side";
  if (ma5 > ma10 && ma10 > ma20 && ma20 > ma60) return "up";
  if (ma5 < ma10 && ma10 < ma20 && ma20 < ma60) return "down";
  return "side";
}
