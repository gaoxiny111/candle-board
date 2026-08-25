import type { Candle, PatternSignal, StructureLine, TradePlan, Grade } from "./types";

export const DEFAULT_RISK: Record<Grade, number> = {
  S: 1,
  A: 0.5,
  B: 0.25,
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
  const entry = c.close;
  const stop =
    signal.direction === "bull" ? signal.extreme - atr : signal.extreme + atr;
  const riskPerUnit = Math.abs(entry - stop);
  const oneR = riskPerUnit;

  const ahead = lines
    .filter((l) =>
      signal.direction === "bull" ? l.price > entry : l.price < entry,
    )
    .sort((a, b) =>
      signal.direction === "bull" ? a.price - b.price : b.price - a.price,
    );

  const tp1 =
    ahead[0]?.price ??
    (signal.direction === "bull" ? entry + oneR : entry - oneR);
  const tp2 = signal.direction === "bull" ? entry + 2 * oneR : entry - 2 * oneR;
  const rr = oneR === 0 ? 0 : Math.abs(tp1 - entry) / oneR;
  const riskAmount = account * (riskPct / 100);
  const positionSize = riskPerUnit > 0 ? riskAmount / riskPerUnit : 0;
  const blocked = rr < 1.5;

  return {
    direction: signal.direction,
    entry,
    stop,
    tp1,
    tp2,
    tp3Note: "TP3 使用 ATR 移动止损，盈利后将止损移至成本",
    riskPct,
    account,
    positionSize,
    rr,
    blocked,
  };
}
