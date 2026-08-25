"use client";

import { useEffect, useRef, useState } from "react";
import {
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { lastNumber } from "@/lib/indicators";
import { useBoardStore } from "@/store/useBoardStore";

type Tab = "rsi" | "kdj" | "macd";

export default function IndicatorStrip() {
  const [tab, setTab] = useState<Tab>("rsi");
  const candles = useBoardStore((s) => s.candles);
  const indicators = useBoardStore((s) => s.indicators);
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineARef = useRef<ISeriesApi<"Line"> | null>(null);
  const lineBRef = useRef<ISeriesApi<"Line"> | null>(null);
  const lineCRef = useRef<ISeriesApi<"Line"> | null>(null);
  const histRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const guidesRef = useRef<IPriceLine[]>([]);

  const rsi = lastNumber(indicators?.rsi);
  const k = lastNumber(indicators?.kdj.k);
  const d = lastNumber(indicators?.kdj.d);
  const j = lastNumber(indicators?.kdj.j);
  const macd = lastNumber(indicators?.macd.macd);
  const signal = lastNumber(indicators?.macd.signal);
  const hist = lastNumber(indicators?.macd.hist);

  useEffect(() => {
    if (!hostRef.current) return;
    const chart = createChart(hostRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#11141c" },
        textColor: "#8b93a7",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "#1a1f2b" },
        horzLines: { color: "#1a1f2b" },
      },
      crosshair: { mode: CrosshairMode.Magnet },
      rightPriceScale: { borderColor: "#242a36", scaleMargins: { top: 0.1, bottom: 0.1 } },
      timeScale: { borderColor: "#242a36", visible: true, timeVisible: true, secondsVisible: false },
      autoSize: true,
    });
    chartRef.current = chart;
    lineARef.current = chart.addLineSeries({
      color: "#c9a227",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });
    lineBRef.current = chart.addLineSeries({
      color: "#5b8def",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    lineCRef.current = chart.addLineSeries({
      color: "#c084fc",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    histRef.current = chart.addHistogramSeries({
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const ro = new ResizeObserver(() => {
      if (!hostRef.current) return;
      chart.applyOptions({
        width: hostRef.current.clientWidth,
        height: hostRef.current.clientHeight,
      });
    });
    ro.observe(hostRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      lineARef.current = null;
      lineBRef.current = null;
      lineCRef.current = null;
      histRef.current = null;
      guidesRef.current = [];
    };
  }, []);

  useEffect(() => {
    const lineA = lineARef.current;
    const lineB = lineBRef.current;
    const lineC = lineCRef.current;
    const histSeries = histRef.current;
    const chart = chartRef.current;
    if (!lineA || !lineB || !lineC || !histSeries || !chart || !indicators || !candles.length) return;

    for (const g of guidesRef.current) {
      try {
        lineA.removePriceLine(g);
      } catch {
        /* ignore */
      }
    }
    guidesRef.current = [];

    const ordered = [...candles].sort((a, b) => a.time - b.time);
    const toLine = (values: (number | null)[]) =>
      ordered
        .map((c, i) =>
          values[i] != null && Number.isFinite(values[i]!)
            ? { time: c.time as UTCTimestamp, value: values[i]! }
            : null,
        )
        .filter(Boolean) as { time: UTCTimestamp; value: number }[];

    lineA.setData([]);
    lineB.setData([]);
    lineC.setData([]);
    histSeries.setData([]);

    const addGuide = (price: number, color: string) => {
      const pl = lineA.createPriceLine({
        price,
        color,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: false,
        title: "",
      });
      guidesRef.current.push(pl);
    };

    if (tab === "rsi") {
      lineA.applyOptions({ color: "#c9a227" });
      lineA.setData(toLine(indicators.rsi));
      addGuide(70, "rgba(240,97,109,0.45)");
      addGuide(50, "rgba(139,147,167,0.35)");
      addGuide(30, "rgba(61,214,140,0.45)");
    } else if (tab === "kdj") {
      lineA.applyOptions({ color: "#c9a227" });
      lineB.applyOptions({ color: "#5b8def" });
      lineC.applyOptions({ color: "#c084fc" });
      lineA.setData(toLine(indicators.kdj.k));
      lineB.setData(toLine(indicators.kdj.d));
      lineC.setData(toLine(indicators.kdj.j));
      addGuide(80, "rgba(240,97,109,0.45)");
      addGuide(20, "rgba(61,214,140,0.45)");
    } else {
      lineA.applyOptions({ color: "#c9a227" });
      lineB.applyOptions({ color: "#5b8def" });
      lineA.setData(toLine(indicators.macd.macd));
      lineB.setData(toLine(indicators.macd.signal));
      histSeries.setData(
        ordered
          .map((c, i) => {
            const v = indicators.macd.hist[i];
            if (v == null || !Number.isFinite(v)) return null;
            return {
              time: c.time as UTCTimestamp,
              value: v,
              color: v >= 0 ? "rgba(240,97,109,0.55)" : "rgba(61,214,140,0.55)",
            };
          })
          .filter(Boolean) as { time: UTCTimestamp; value: number; color: string }[],
      );
      addGuide(0, "rgba(139,147,167,0.4)");
    }

    chart.timeScale().fitContent();
  }, [tab, candles, indicators]);

  if (!indicators) return null;

  const valueText =
    tab === "rsi"
      ? rsi?.toFixed(2) ?? "—"
      : tab === "kdj"
        ? k != null && d != null && j != null
          ? `K ${k.toFixed(1)}  D ${d.toFixed(1)}  J ${j.toFixed(1)}`
          : "—"
        : macd != null && signal != null && hist != null
          ? `${macd.toFixed(4)}  sig ${signal.toFixed(4)}  h ${hist.toFixed(4)}`
          : "—";

  return (
    <div className="flex h-[200px] flex-col border-t border-[#242a36] bg-[#11141c]">
      <div className="flex items-center gap-1 border-b border-[#242a36] px-2 py-1 text-xs">
        {(
          [
            { id: "rsi", label: "RSI(14)" },
            { id: "kdj", label: "KDJ(9,3,3)" },
            { id: "macd", label: "MACD(12,26,9)" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded px-2 py-0.5 ${
              tab === t.id ? "bg-[#c9a227]/20 text-[#c9a227]" : "text-[#8b93a7] hover:text-[#d7dde8]"
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="ml-auto font-mono text-[11px] text-[#d7dde8]">{valueText}</span>
      </div>
      <div ref={hostRef} className="min-h-0 flex-1" />
    </div>
  );
}
