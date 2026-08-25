import type { Candle, Grade, PatternSignal, StructureLine } from "../types";
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
  const touch = nearLine(c.low, lines, atr) || nearLine(c.high, lines, atr) || nearLine(c.close, lines, atr);
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
  gapDetect = true,
): PatternSignal[] {
  const raw = [
    ...detectSingle(candles),
    ...detectDual(candles),
    ...detectTriple(candles, gapDetect),
    ...detectContinuation(candles),
    ...detectSpringUpthrust(candles, lines),
  ];
  const byIndex = new Map<string, PatternSignal>();
  for (const s of raw) {
    const graded = assignGrade(s, candles, lines, atr);
    const key = `${graded.kind}-${graded.index}`;
    const prev = byIndex.get(key);
    if (!prev || graded.quality > prev.quality) byIndex.set(key, graded);
  }
  return [...byIndex.values()].sort((a, b) => b.index - a.index);
}
