"use client";

import { SYMBOLS, TIMEFRAMES } from "@/lib/symbols";
import { trendArrow, useBoardStore } from "@/store/useBoardStore";

export default function Toolbar() {
  const symbolId = useBoardStore((s) => s.symbolId);
  const timeframe = useBoardStore((s) => s.timeframe);
  const setSymbol = useBoardStore((s) => s.setSymbol);
  const setTimeframe = useBoardStore((s) => s.setTimeframe);
  const atr = useBoardStore((s) => s.atr);
  const htf = useBoardStore((s) => s.htf);
  const drawMode = useBoardStore((s) => s.drawMode);
  const setDrawMode = useBoardStore((s) => s.setDrawMode);
  const autoFib = useBoardStore((s) => s.autoFib);
  const showMa = useBoardStore((s) => s.showMa);
  const setShowMa = useBoardStore((s) => s.setShowMa);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[#242a36] bg-[#11141c] px-3 py-2 text-sm">
      <select
        className="rounded border border-[#242a36] bg-[#090b10] px-2 py-1"
        value={symbolId}
        onChange={(e) => setSymbol(e.target.value)}
      >
        {SYMBOLS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <div className="flex overflow-hidden rounded border border-[#242a36]">
        {TIMEFRAMES.map((t) => (
          <button
            key={t.id}
            className={`px-2 py-1 ${timeframe === t.id ? "bg-[#c9a227] text-black" : "bg-transparent"}`}
            onClick={() => setTimeframe(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded border border-[#242a36] px-2 py-1 font-mono text-xs">
        ATR(14) {atr ? atr.toFixed(4) : "—"}
      </div>

      <div className="rounded border border-[#242a36] px-2 py-1 text-xs">
        {htf ? (
          <>
            {htf.label}趋势 {trendArrow(htf)}{" "}
            <span className="text-[#8b93a7]">
              {htf.direction === "up" ? "升" : htf.direction === "down" ? "降" : "平"}
            </span>
          </>
        ) : (
          <span className="text-[#8b93a7]">大周期趋势 —</span>
        )}
      </div>

      <div className="mx-1 h-4 w-px bg-[#242a36]" />

      <ToolBtn active={drawMode === "hline"} onClick={() => setDrawMode(drawMode === "hline" ? "none" : "hline")}>
        支撑/阻力
      </ToolBtn>
      <ToolBtn active={drawMode === "trend"} onClick={() => setDrawMode(drawMode === "trend" ? "none" : "trend")}>
        趋势线
      </ToolBtn>
      <ToolBtn active={false} onClick={autoFib}>
        斐波那契
      </ToolBtn>

      {(["ma20", "ma50", "ma200"] as const).map((k) => (
        <label key={k} className="flex items-center gap-1 text-xs text-[#8b93a7]">
          <input
            type="checkbox"
            checked={showMa[k]}
            onChange={(e) => setShowMa(k, e.target.checked)}
          />
          {k.toUpperCase()}
        </label>
      ))}
    </div>
  );
}

function ToolBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded border px-2 py-1 text-xs ${
        active ? "border-[#c9a227] bg-[#c9a227]/15 text-[#c9a227]" : "border-[#242a36]"
      }`}
    >
      {children}
    </button>
  );
}
