import type { Candle, PatternSignal, StructureLine, TradePlan, Grade } from "./types";
import { formatCnDate, nextTradingDay } from "./ashare";

export const DEFAULT_RISK: Record<Grade, number> = {
  S: 1.5,
  A: 1,
  B: 0.5,
};

export function buildPlan(
  signal: PatternSignal,
  candles: Candle[],
  lines: StructureLine[],
  atr: number,
  account: number,
  riskPct: number,
): TradePlan {
  const c = candles[signal.index];
  // A股：信号日收盘识别，计划入场参考次日开盘附近（用信号收盘作参考价）
  const entry = c.close;
  const stop =
    signal.direction === "bull" ? signal.extreme - atr : signal.extreme + atr;
  const riskPerUnit = Math.abs(entry - stop);
  const oneR = riskPerUnit;

  const ahead = lines
    .filter((l) => (signal.direction === "bull" ? l.price > entry : l.price < entry))
    .sort((a, b) => (signal.direction === "bull" ? a.price - b.price : b.price - a.price));

  const tp1 =
    ahead[0]?.price ?? (signal.direction === "bull" ? entry + oneR : entry - oneR);
  const tp2 = signal.direction === "bull" ? entry + 2 * oneR : entry - 2 * oneR;
  const rr = oneR === 0 ? 0 : Math.abs(tp1 - entry) / oneR;
  const riskAmount = account * (riskPct / 100);
  // A股按整百股
  const rawShares = riskPerUnit > 0 ? riskAmount / riskPerUnit : 0;
  const positionSize = Math.max(0, Math.floor(rawShares / 100) * 100);
  const blocked = rr < 1.5 || (signal.direction === "bull" && positionSize < 100);

  const entryDay = nextTradingDay(signal.time);
  const sellDay = nextTradingDay(entryDay);

  const confirmHint =
    signal.direction === "bull"
      ? `开盘不低于信号收盘附近，且不跌破极值 ${signal.extreme.toFixed(2)}`
      : "看跌信号不生成买入计划，仅作仓位管理参考";

  return {
    direction: signal.direction,
    entry,
    stop,
    tp1,
    tp2,
    tp3Note: "TP3 使用 ATR 移动止损；盈利后止损移至成本",
    riskPct,
    account,
    positionSize,
    rr,
    blocked: signal.direction === "bear" ? true : blocked,
    entryDate: formatCnDate(entryDay),
    earliestSellDate: formatCnDate(sellDay),
    confirmHint,
  };
}
