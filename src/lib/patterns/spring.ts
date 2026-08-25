import type { Candle, PatternSignal, StructureLine } from "../types";
import { body, isBull, isBear } from "./geometry";
import { sma } from "../indicators";

function findBreakdown(candles: Candle[], support: number): number | null {
  for (let i = 3; i < candles.length; i++) {
    if (candles[i].low < support && candles[i].close < support) return i;
  }
  return null;
}

function findRecovery(
  candles: Candle[],
  from: number,
  level: number,
  maxBars: number,
): number | null {
  const end = Math.min(candles.length - 1, from + maxBars);
  for (let i = from + 1; i <= end; i++) {
    if (candles[i].close > level) return i;
  }
  return null;
}

function findBreakup(candles: Candle[], resistance: number): number | null {
  for (let i = 3; i < candles.length; i++) {
    if (candles[i].high > resistance && candles[i].close > resistance) return i;
  }
  return null;
}

function findFailBack(
  candles: Candle[],
  from: number,
  level: number,
  maxBars: number,
): number | null {
  const end = Math.min(candles.length - 1, from + maxBars);
  for (let i = from + 1; i <= end; i++) {
    if (candles[i].close < level) return i;
  }
  return null;
}

export function detectSpringUpthrust(
  candles: Candle[],
  lines: StructureLine[],
): PatternSignal[] {
  const out: PatternSignal[] = [];
  const vols = candles.map((c) => c.volume);
  const avgVol = sma(vols, 20);
  const supports = lines.filter((l) => l.kind === "support");
  const resistances = lines.filter((l) => l.kind === "resistance");

  for (const line of supports) {
    const idx = findBreakdown(candles, line.price);
    if (idx == null) continue;
    const penetration = (line.price - candles[idx].low) / line.price;
    if (penetration < 0.005 || penetration > 0.02) continue;
    const rec = findRecovery(candles, idx, line.price, 3);
    if (rec == null) continue;
    const recovery = candles[rec];
    const prev = candles[rec - 1];
    if (!isBull(recovery)) continue;
    if (body(prev) > 0 && body(recovery) / body(prev) < 0.7) continue;
    const avg = avgVol[rec] ?? avgVol[idx] ?? 0;
    if (avg > 0) {
      if ((candles[idx].volume ?? 0) < avg * 1.2) continue;
      if (recovery.volume < avg * 1.2) continue;
    }
    out.push({
      id: `spring-${line.id}-${rec}`,
      kind: "spring",
      label: "破低反涨 Spring",
      direction: "bull",
      index: rec,
      startIndex: idx,
      time: recovery.time,
      quality: line.springAnchor ? 4.8 : 4.2,
      grade: line.springAnchor ? "A" : "B",
      notes: [`穿透 ${(penetration * 100).toFixed(2)}%`, "停留≤3根", "破位+收回放量"],
      extreme: candles[idx].low,
    });
  }

  for (const line of resistances) {
    const idx = findBreakup(candles, line.price);
    if (idx == null) continue;
    const penetration = (candles[idx].high - line.price) / line.price;
    if (penetration < 0.005 || penetration > 0.02) continue;
    const fail = findFailBack(candles, idx, line.price, 3);
    if (fail == null) continue;
    const rec = candles[fail];
    const prev = candles[fail - 1];
    if (!isBear(rec)) continue;
    if (body(prev) > 0 && body(rec) / body(prev) < 0.7) continue;
    const avg = avgVol[fail] ?? avgVol[idx] ?? 0;
    if (avg > 0) {
      if ((candles[idx].volume ?? 0) < avg * 1.2) continue;
      if (rec.volume < avg * 1.2) continue;
    }
    out.push({
      id: `upthrust-${line.id}-${fail}`,
      kind: "upthrust",
      label: "破顶反跌 Upthrust",
      direction: "bear",
      index: fail,
      startIndex: idx,
      time: rec.time,
      quality: line.upthrustAnchor ? 4.8 : 4.2,
      grade: line.upthrustAnchor ? "A" : "B",
      notes: [`穿透 ${(penetration * 100).toFixed(2)}%`, "停留≤3根", "破位+跌回放量"],
      extreme: candles[idx].high,
    });
  }
  return out;
}
