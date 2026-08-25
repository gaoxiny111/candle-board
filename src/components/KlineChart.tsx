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
  const ma20Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const ma50Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const ma200Ref = useRef<ISeriesApi<"Line"> | null>(null);
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
      upColor: "#3dd68c",
      downColor: "#f0616d",
      borderVisible: false,
      wickUpColor: "#3dd68c",
      wickDownColor: "#f0616d",
    });
    const vol = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
    });
    chart.priceScale("vol").applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });
    candle.priceScale().applyOptions({
      scaleMargins: { top: 0.08, bottom: 0.22 },
    });
    ma20Ref.current = chart.addLineSeries({ color: "#c9a227", lineWidth: 1, priceLineVisible: false });
    ma50Ref.current = chart.addLineSeries({ color: "#5b8def", lineWidth: 1, priceLineVisible: false });
    ma200Ref.current = chart.addLineSeries({ color: "#c084fc", lineWidth: 1, priceLineVisible: false });
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
    candleRef.current.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );
    volRef.current.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? "rgba(61,214,140,0.35)" : "rgba(240,97,109,0.35)",
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
        candles
          .map((c, i) => (values[i] != null ? { time: c.time as UTCTimestamp, value: values[i]! } : null))
          .filter(Boolean) as { time: UTCTimestamp; value: number }[],
      );
    };
    applyMa(ma20Ref.current, indicators?.ma20, showMa.ma20);
    applyMa(ma50Ref.current, indicators?.ma50, showMa.ma50);
    applyMa(ma200Ref.current, indicators?.ma200, showMa.ma200);

    const gradeColor = { S: "#ff4d4f", A: "#ff9800", B: "#e6c35c" };
    candleRef.current.setMarkers(
      signals.slice(0, 40).map((s) => ({
        time: s.time as UTCTimestamp,
        position: s.direction === "bull" ? "belowBar" : "aboveBar",
        color: gradeColor[s.grade],
        shape: s.direction === "bull" ? "arrowUp" : "arrowDown",
        text: `${s.grade} ${s.label}`,
      })),
    );
    chartRef.current?.timeScale().fitContent();
  }, [candles, indicators, showMa, signals]);

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
        title: `${line.kind === "support" ? "S" : "R"}×${line.tests}${line.springAnchor ? " Spring" : ""}${
          line.upthrustAnchor ? " UT" : ""
        }`,
      });
      priceLines.current.push({ id: line.id, line: pl });
    }
    if (fib) {
      const span = fib.swingHigh - fib.swingLow;
      const levels = [
        [0.382, "#5b8def"],
        [0.5, "#c9a227"],
        [0.618, "#c084fc"],
        [0.786, "#8b93a7"],
      ] as const;
      for (const [lv, color] of levels) {
        const price = fib.swingHigh - span * lv;
        const pl = candleRef.current.createPriceLine({
          price,
          color,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `Fib ${lv}`,
        });
        priceLines.current.push({ id: `fib-${lv}`, line: pl });
      }
    }
  }, [lines, fib]);

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
        </div>
      )}
      <span className="sr-only">{atr}</span>
    </div>
  );
}
