import type { Candle, Grade, PatternSignal, StructureLine } from "../types";
import type { SymbolDef } from "../symbols";
import { isValidCandleForPattern } from "../ashare";
import { detectSingle } from "./single";
import { detectDual } from "./dual";
import { detectTriple } from "./triple";
import { detectContinuation } from "./continuation";
import { detectSpringUpthrust } from "./spring";

function nearLine(price: number, lines: StructureLine[], atr: number): boolean {
  const tol = 0.5 * Math.max(atr, price * 0.001);
  return lines.some((l) => Math.abs(l.price - price) <= tol);
}

function assignGrade(
  sig: PatternSignal,
  candles: Candle[],
  lines: StructureLine[],
  atr: number,
): PatternSignal {
  const c = candles[sig.index];
  const touch =
    nearLine(c.low, lines, atr) || nearLine(c.high, lines, atr) || nearLine(c.close, lines, atr);
  let quality = Math.max(1, Math.min(5, Number(sig.quality.toFixed(2))));
  if (touch) quality = Math.min(5, quality + 0.4);
  let grade: Grade = "B";
  if (quality >= 4 && touch) grade = "S";
  else if (quality >= 3.5 || (quality >= 3 && touch)) grade = "A";
  return { ...sig, quality, grade };
}

export function detectPatterns(
  candles: Candle[],
  lines: StructureLine[],
  atr: number,
  symbol: SymbolDef,
  gapDetect = true,
): PatternSignal[] {
  const raw = [
    ...detectSingle(candles),
    ...detectDual(candles),
    ...detectTriple(candles, gapDetect),
    ...detectContinuation(candles),
    ...detectSpringUpthrust(candles, lines),
  ].filter((s) => isValidCandleForPattern(candles, s.index, symbol));

  const byIndex = new Map<string, PatternSignal>();
  for (const s of raw) {
    const graded = assignGrade(s, candles, lines, atr);
    // 看跌信号标注为减仓参考
    const notes =
      graded.direction === "bear"
        ? [...graded.notes, "A股看跌：仅作减仓/不买入参考"]
        : graded.notes;
    const key = `${graded.kind}-${graded.index}`;
    const next = { ...graded, notes };
    const prev = byIndex.get(key);
    if (!prev || next.quality > prev.quality) byIndex.set(key, next);
  }
  return [...byIndex.values()].sort((a, b) => b.index - a.index);
}
