"use client";

import { useEffect, useRef } from "react";
import {
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { magnetPrice } from "@/lib/swings";
import { selectActive, useBoardStore } from "@/store/useBoardStore";

export default function KlineChart() {
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const ma5Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const ma10Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const ma20Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const ma60Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const priceLines = useRef<{ id: string; line: ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]> }[]>([]);

  const candles = useBoardStore((s) => s.candles);
  const indicators = useBoardStore((s) => s.indicators);
  const showMa = useBoardStore((s) => s.showMa);
  const lines = useBoardStore((s) => s.lines);
  const fib = useBoardStore((s) => s.fib);
  const signals = useBoardStore((s) => s.signals);
  const selectedId = useBoardStore((s) => s.selectedId);
  const drawMode = useBoardStore((s) => s.drawMode);
  const atr = useBoardStore((s) => s.atr);
  const limitUp = useBoardStore((s) => s.limitUp);
  const limitDown = useBoardStore((s) => s.limitDown);
  const addLine = useBoardStore((s) => s.addLine);
  const addTrendPoint = useBoardStore((s) => s.addTrendPoint);

  useEffect(() => {
    if (!hostRef.current) return;
    const chart = createChart(hostRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#090b10" },
        textColor: "#8b93a7",
      },
      grid: {
        vertLines: { color: "#1a1f2b" },
        horzLines: { color: "#1a1f2b" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "#242a36" },
      timeScale: { borderColor: "#242a36", timeVisible: true, secondsVisible: false },
      autoSize: true,
    });
    const candle = chart.addCandlestickSeries({
      upColor: "#f0616d",
      downColor: "#3dd68c",
      borderVisible: false,
      wickUpColor: "#f0616d",
      wickDownColor: "#3dd68c",
    });
    const vol = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
    });
    chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    candle.priceScale().applyOptions({ scaleMargins: { top: 0.08, bottom: 0.22 } });
    ma5Ref.current = chart.addLineSeries({ color: "#e8e8e8", lineWidth: 1, priceLineVisible: false });
    ma10Ref.current = chart.addLineSeries({ color: "#c9a227", lineWidth: 1, priceLineVisible: false });
    ma20Ref.current = chart.addLineSeries({ color: "#c084fc", lineWidth: 1, priceLineVisible: false });
    ma60Ref.current = chart.addLineSeries({ color: "#3dd68c", lineWidth: 1, priceLineVisible: false });
    chartRef.current = chart;
    candleRef.current = candle;
    volRef.current = vol;

    const onClick = (param: { point?: { x: number; y: number } | undefined; time?: unknown }) => {
      const state = useBoardStore.getState();
      if (!param.point || !candleRef.current) return;
      const price = candleRef.current.coordinateToPrice(param.point.y);
      if (price == null) return;
      const snapped = magnetPrice(state.candles, price, state.atr || Math.abs(price) * 0.01);
      if (state.drawMode === "hline") {
        const last = state.candles.at(-1)?.close ?? snapped;
        addLine(snapped, snapped <= last ? "support" : "resistance");
      } else if (state.drawMode === "trend" && param.time) {
        addTrendPoint(Number(param.time), snapped);
      } else if (state.drawMode === "fib") {
        state.autoFib();
      }
    };
    chart.subscribeClick(onClick);

    const ro = new ResizeObserver(() => {
      if (!hostRef.current) return;
      chart.applyOptions({ width: hostRef.current.clientWidth, height: hostRef.current.clientHeight });
    });
    ro.observe(hostRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [addLine, addTrendPoint]);

  useEffect(() => {
    if (!candleRef.current || !volRef.current || !candles.length) return;
    const ordered = [...candles].sort((a, b) => a.time - b.time);
    try {
      candleRef.current.setData(
        ordered.map((c) => ({
          time: c.time as UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        })),
      );
      volRef.current.setData(
        ordered.map((c) => ({
          time: c.time as UTCTimestamp,
          value: c.volume,
          color: c.close >= c.open ? "rgba(240,97,109,0.35)" : "rgba(61,214,140,0.35)",
        })),
      );
      const applyMa = (
        series: ISeriesApi<"Line"> | null,
        values: (number | null)[] | undefined,
        on: boolean,
      ) => {
        if (!series) return;
        if (!on || !values) {
          series.setData([]);
          return;
        }
        series.setData(
          ordered
            .map((c, i) => (values[i] != null ? { time: c.time as UTCTimestamp, value: values[i]! } : null))
            .filter(Boolean) as { time: UTCTimestamp; value: number }[],
        );
      };
      applyMa(ma5Ref.current, indicators?.ma5, showMa.ma5);
      applyMa(ma10Ref.current, indicators?.ma10, showMa.ma10);
      applyMa(ma20Ref.current, indicators?.ma20, showMa.ma20);
      applyMa(ma60Ref.current, indicators?.ma60, showMa.ma60);

      const gradeColor = { S: "#ff4d4f", A: "#ff9800", B: "#e6c35c" };
      const markerByTime = new Map<number, (typeof signals)[number]>();
      const preferred = [...signals]
        .filter((s) => s.id === selectedId || s.grade !== "B")
        .sort((a, b) => a.time - b.time || b.quality - a.quality);
      for (const s of preferred) markerByTime.set(s.time, s);
      candleRef.current.setMarkers(
        [...markerByTime.values()]
          .sort((a, b) => a.time - b.time)
          .slice(-12)
          .map((s) => ({
            time: s.time as UTCTimestamp,
            position: s.direction === "bull" ? ("belowBar" as const) : ("aboveBar" as const),
            color: gradeColor[s.grade],
            shape: s.direction === "bull" ? ("arrowUp" as const) : ("arrowDown" as const),
            text: `${s.grade} ${s.label}`,
          })),
      );
      chartRef.current?.timeScale().fitContent();
    } catch (err) {
      console.error("chart data", err);
    }
  }, [candles, indicators, showMa, signals, selectedId]);

  useEffect(() => {
    if (!candleRef.current) return;
    for (const p of priceLines.current) candleRef.current.removePriceLine(p.line);
    priceLines.current = [];
    for (const line of lines) {
      const pl = candleRef.current.createPriceLine({
        price: line.price,
        color: line.kind === "support" ? "#3dd68c" : "#f0616d",
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `${line.kind === "support" ? "S" : "R"}×${line.tests}`,
      });
      priceLines.current.push({ id: line.id, line: pl });
    }
    if (limitUp != null) {
      const pl = candleRef.current.createPriceLine({
        price: limitUp,
        color: "#f0616d",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "涨停",
      });
      priceLines.current.push({ id: "limit-up", line: pl });
    }
    if (limitDown != null) {
      const pl = candleRef.current.createPriceLine({
        price: limitDown,
        color: "#3dd68c",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "跌停",
      });
      priceLines.current.push({ id: "limit-down", line: pl });
    }
    if (fib) {
      const span = fib.swingHigh - fib.swingLow;
      for (const [lv, color] of [
        [0.382, "#5b8def"],
        [0.5, "#c9a227"],
        [0.618, "#c084fc"],
        [0.786, "#8b93a7"],
      ] as const) {
        const pl = candleRef.current.createPriceLine({
          price: fib.swingHigh - span * lv,
          color,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `Fib ${lv}`,
        });
        priceLines.current.push({ id: `fib-${lv}`, line: pl });
      }
    }
  }, [lines, fib, limitUp, limitDown]);

  const active = useBoardStore(selectActive);

  return (
    <div className="relative h-full min-h-[420px] w-full">
      <div ref={hostRef} className="h-full w-full" />
      {drawMode !== "none" && (
        <div className="pointer-events-none absolute left-3 top-3 rounded bg-black/60 px-2 py-1 text-xs text-[#c9a227]">
          {drawMode === "hline" && "点击吸附近期高低点，画水平结构"}
          {drawMode === "trend" && "点两点画趋势线"}
          {drawMode === "fib" && "自动最近波段斐波那契"}
        </div>
      )}
      {selectedId && active && (
        <div className="pointer-events-none absolute right-16 top-3 rounded bg-black/50 px-2 py-1 text-[11px] text-[#8b93a7]">
          已选 {active.grade} {active.label}
          {active.direction === "bear" ? " · 减仓参考" : ""}
        </div>
      )}
      <span className="sr-only">{atr}</span>
    </div>
  );
}
