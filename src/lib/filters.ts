import type { Candle, FilterResult, HtfTrend, PatternSignal, StructureLine } from "./types";
import type { IndicatorSnapshot } from "./types";
import { isBull } from "./patterns/geometry";

export function runFilters(
  signal: PatternSignal,
  candles: Candle[],
  lines: StructureLine[],
  indicators: IndicatorSnapshot,
  htf: HtfTrend | null,
): FilterResult {
  const i = signal.index;
  const c = candles[i];
  const atr = indicators.atr[i] ?? candles[i].close * 0.01;
  const tol = 0.5 * atr;

  const touch = lines.some(
    (l) =>
      Math.abs(l.price - c.low) <= tol ||
      Math.abs(l.price - c.high) <= tol ||
      Math.abs(l.price - c.close) <= tol,
  );
  const locPass = lines.length === 0 ? false : touch;

  const trendPass =
    htf == null
      ? false
      : htf.direction === "side"
        ? false
        : (htf.direction === "up" && signal.direction === "bull") ||
          (htf.direction === "down" && signal.direction === "bear");

  const qualityLayer: boolean | "pending" =
    signal.quality >= 4 ? true : signal.quality >= 3 ? "pending" : false;

  const rsi = indicators.rsi[i];
  const k = indicators.stoch.k[i];
  const d = indicators.stoch.d[i];
  const kPrev = indicators.stoch.k[i - 1];
  const dPrev = indicators.stoch.d[i - 1];
  const macdH = indicators.macd.hist[i];
  const macdPrev = indicators.macd.hist[i - 1];

  const rsiOk =
    rsi != null &&
    (signal.direction === "bull" ? rsi <= 35 : rsi >= 65);
  const stochOk =
    k != null &&
    d != null &&
    kPrev != null &&
    dPrev != null &&
    (signal.direction === "bull" ? kPrev <= dPrev && k > d : kPrev >= dPrev && k < d);
  const macdOk =
    macdH != null &&
    macdPrev != null &&
    (signal.direction === "bull" ? macdH > macdPrev && macdH >= 0 : macdH < macdPrev && macdH <= 0);

  const momentumChecks = [
    { label: "RSI 超买超卖", ok: !!rsiOk },
    { label: "Stochastic 交叉", ok: !!stochOk },
    { label: "MACD 状态", ok: !!macdOk },
  ];
  const momPass = momentumChecks.filter((x) => x.ok).length >= 1;

  const volMa = indicators.volMa20[i];
  const volRatio = volMa && volMa > 0 ? c.volume / volMa : 0;
  const volPass = volRatio > 1.5;

  const confirmWindow = 2;
  const last = candles.length - 1;
  let confirm: boolean | "pending" = "pending";
  let confirmDetail = `等待后续 1-2 根确认（剩余 ${Math.max(0, confirmWindow - (last - i))} 根）`;
  if (last > i) {
    const nextBars = candles.slice(i + 1, i + 1 + confirmWindow);
    const ok =
      signal.direction === "bull"
        ? nextBars.some((n) => n.close > c.high && isBull(n))
        : nextBars.some((n) => n.close < c.low && !isBull(n));
    confirm = ok;
    confirmDetail = ok ? "后续K线完成确认" : "后续K线未满足确认条件";
  }

  const layers: FilterResult["layers"] = [
    {
      id: 1,
      name: "位置",
      pass: locPass,
      detail: lines.length === 0 ? "尚未标注支撑/阻力" : touch ? "触及结构线（±0.5 ATR）" : "未触及已标注结构",
    },
    {
      id: 2,
      name: "趋势",
      pass: trendPass,
      detail: htf
        ? `${htf.label} ${htf.direction === "up" ? "↑" : htf.direction === "down" ? "↓" : "→"}，${
            trendPass ? "顺势" : "逆势/盘整"
          }`
        : "大周期趋势未知",
    },
    {
      id: 3,
      name: "形态质量",
      pass: qualityLayer,
      detail: `${signal.quality.toFixed(1)} / 5（≥4 绿灯，3 黄灯，<3 红灯）`,
    },
    {
      id: 4,
      name: "动能共振",
      pass: momPass,
      detail: momentumChecks.map((m) => `${m.ok ? "✓" : "✗"} ${m.label}`).join("  "),
    },
    {
      id: 5,
      name: "量能",
      pass: volPass,
      detail: volMa ? `量比 ${volRatio.toFixed(2)}（>1.5 为放量）` : "均量不足",
    },
    {
      id: 6,
      name: "确认",
      pass: confirm,
      detail: confirmDetail,
    },
  ];

  const passed = layers.filter((l) => l.pass === true).length;
  return { layers, passed, momentumChecks };
}
