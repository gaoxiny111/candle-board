import type {
  Candle,
  FilterResult,
  HtfTrend,
  IndicatorSnapshot,
  MarketBoard,
  PatternSignal,
  StructureLine,
} from "./types";
import type { SymbolDef } from "./symbols";
import { isBull } from "./patterns/geometry";
import { isLimitDown, isLimitUp, maAlignment } from "./ashare";
import { lastNumber } from "./indicators";

export function runFilters(
  signal: PatternSignal,
  candles: Candle[],
  lines: StructureLine[],
  indicators: IndicatorSnapshot,
  htf: HtfTrend | null,
  market: MarketBoard | null,
  symbol: SymbolDef,
): FilterResult {
  const i = signal.index;
  const c = candles[i];
  const atr = indicators.atr[i] ?? c.close * 0.01;
  const tol = 0.5 * atr;
  const prev = i > 0 ? candles[i - 1] : null;

  const nearMa = [indicators.ma20[i], indicators.ma60[i]].some(
    (m) => m != null && Math.abs(m - c.close) <= tol,
  );
  const touchLine = lines.some(
    (l) =>
      Math.abs(l.price - c.low) <= tol ||
      Math.abs(l.price - c.high) <= tol ||
      Math.abs(l.price - c.close) <= tol,
  );
  const roundLevel = Math.round(c.close);
  const nearRound = Math.abs(c.close - roundLevel) / c.close <= 0.005;
  const locPass = touchLine || nearMa || nearRound;
  const locDetail = touchLine
    ? "触及结构线（±0.5 ATR）"
    : nearMa
      ? "靠近均线（MA20/60）"
      : nearRound
        ? `靠近整数关口 ${roundLevel}`
        : lines.length === 0
          ? "未画结构线，且未贴近均线/整数关口"
          : "未触及结构";

  const stockDir = htf?.direction ?? "side";
  const marketDir = market?.shanghai.direction ?? "side";
  const stockOk =
    (signal.direction === "bull" && stockDir === "up") ||
    (signal.direction === "bear" && stockDir === "down");
  const marketOk =
    (signal.direction === "bull" && marketDir !== "down") ||
    (signal.direction === "bear" && marketDir !== "up");
  const maAlign = maAlignment(
    lastNumber(indicators.ma5),
    lastNumber(indicators.ma10),
    lastNumber(indicators.ma20),
    lastNumber(indicators.ma60),
  );
  const alignOk =
    (signal.direction === "bull" && maAlign !== "down") ||
    (signal.direction === "bear" && maAlign !== "up");
  const trendVotes = [stockOk, marketOk, alignOk].filter(Boolean).length;
  const trendPass = trendVotes >= 2;
  const trendDetail = `个股周线${arrow(stockDir)} 上证${arrow(marketDir)} 均线${
    maAlign === "up" ? "多头" : maAlign === "down" ? "空头" : "纠缠"
  }（${trendVotes}/3 同向）`;

  let q = signal.quality;
  let limitNote = "";
  if (prev && symbol.group !== "index") {
    if (isLimitUp(c, prev.close, symbol.limitPct) || isLimitDown(c, prev.close, symbol.limitPct)) {
      q = Math.max(1, q - 1.5);
      limitNote = "；近涨跌停降分";
    }
  }
  const qualityLayer: boolean | "pending" = q >= 4 ? true : q >= 3 ? "pending" : false;

  const rsi = indicators.rsi[i];
  const kk = indicators.kdj.k[i];
  const dd = indicators.kdj.d[i];
  const kkPrev = indicators.kdj.k[i - 1];
  const ddPrev = indicators.kdj.d[i - 1];
  const macdH = indicators.macd.hist[i];
  const macdPrev = indicators.macd.hist[i - 1];
  const rsiOk = rsi != null && (signal.direction === "bull" ? rsi <= 40 : rsi >= 60);
  const kdjOk =
    kk != null &&
    dd != null &&
    kkPrev != null &&
    ddPrev != null &&
    (signal.direction === "bull" ? kkPrev <= ddPrev && kk > dd : kkPrev >= ddPrev && kk < dd);
  const macdOk =
    macdH != null &&
    macdPrev != null &&
    (signal.direction === "bull" ? macdH > macdPrev : macdH < macdPrev);
  const momentumChecks = [
    { label: "RSI", ok: !!rsiOk },
    { label: "KDJ交叉", ok: !!kdjOk },
    { label: "MACD", ok: !!macdOk },
  ];
  const momPass = momentumChecks.filter((x) => x.ok).length >= 1;

  const volMa = indicators.volMa20[i];
  const volRatio = volMa && volMa > 0 ? c.volume / volMa : 0;
  const volPriceOk =
    signal.direction === "bull"
      ? isBull(c)
        ? volRatio > 1.2
        : volRatio < 1.0
      : !isBull(c)
        ? volRatio > 1.2
        : volRatio < 1.0;
  const volPass = volRatio > 1.5 || (volRatio > 1.2 && volPriceOk);

  const last = candles.length - 1;
  let confirm: boolean | "pending" = "pending";
  let confirmDetail = "等待 T+1 日开盘/收盘确认";
  if (last > i) {
    const t1 = candles[i + 1];
    const openGap = (t1.open - c.close) / c.close;
    if (signal.direction === "bull") {
      if (openGap < -0.01 || t1.close < signal.extreme) {
        confirm = false;
        confirmDetail = `T+1 低开${(openGap * 100).toFixed(2)}% 或跌破极值，确认失败`;
      } else if (isLimitDown(t1, c.close, symbol.limitPct)) {
        confirm = false;
        confirmDetail = "T+1 跌停，形态失败";
      } else if (isLimitUp(t1, c.close, symbol.limitPct)) {
        confirm = true;
        confirmDetail = "T+1 涨停确认（注意追高风险）";
      } else if (t1.close >= c.close && openGap >= -0.01) {
        confirm = true;
        confirmDetail =
          openGap > 0.01
            ? `T+1 高开${(openGap * 100).toFixed(2)}%，强确认但追高风险大`
            : "T+1 平开/微幅高开，标准确认";
      } else {
        confirm = false;
        confirmDetail = "T+1 收盘未站稳信号价，确认不足";
      }
    } else if (openGap > 0.01 || t1.close > signal.extreme) {
      confirm = false;
      confirmDetail = "T+1 高开或突破极值，看跌确认失败";
    } else if (t1.close <= c.close) {
      confirm = true;
      confirmDetail = "T+1 延续弱势，可作为减仓/不买入参考";
    } else {
      confirm = false;
      confirmDetail = "T+1 未确认弱势";
    }
  }

  const layers: FilterResult["layers"] = [
    { id: 1, name: "位置", pass: locPass, detail: locDetail },
    { id: 2, name: "趋势·大盘", pass: trendPass, detail: trendDetail },
    { id: 3, name: "形态质量", pass: qualityLayer, detail: `${q.toFixed(1)} / 5${limitNote}` },
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
      detail: `量比 ${volRatio.toFixed(2)}（北向/换手率 Phase2 接入）`,
    },
    { id: 6, name: "T+1确认", pass: confirm, detail: confirmDetail },
  ];

  return {
    layers,
    passed: layers.filter((l) => l.pass === true).length,
    momentumChecks,
  };
}

function arrow(d: string): string {
  return d === "up" ? "↑" : d === "down" ? "↓" : "→";
}
