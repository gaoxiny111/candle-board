"use client";

import { lastNumber } from "@/lib/indicators";
import { useBoardStore } from "@/store/useBoardStore";

export default function IndicatorStrip() {
  const indicators = useBoardStore((s) => s.indicators);
  if (!indicators) return null;
  const rsi = lastNumber(indicators.rsi);
  const k = lastNumber(indicators.stoch.k);
  const d = lastNumber(indicators.stoch.d);
  const macd = lastNumber(indicators.macd.macd);
  const signal = lastNumber(indicators.macd.signal);
  const hist = lastNumber(indicators.macd.hist);

  return (
    <div className="grid grid-cols-3 gap-2 border-t border-[#242a36] bg-[#11141c] px-3 py-2 text-xs">
      <Cell title="RSI(14)" value={rsi?.toFixed(2) ?? "—"} warn={rsi != null && (rsi > 70 || rsi < 30)} />
      <Cell
        title="Stoch(14,3,3)"
        value={k != null && d != null ? `${k.toFixed(1)} / ${d.toFixed(1)}` : "—"}
      />
      <Cell
        title="MACD(12,26,9)"
        value={
          macd != null && signal != null && hist != null
            ? `${macd.toFixed(4)}  sig ${signal.toFixed(4)}  h ${hist.toFixed(4)}`
            : "—"
        }
      />
    </div>
  );
}

function Cell({ title, value, warn }: { title: string; value: string; warn?: boolean }) {
  return (
    <div>
      <div className="text-[#8b93a7]">{title}</div>
      <div className={`font-mono ${warn ? "text-[#e6c35c]" : ""}`}>{value}</div>
    </div>
  );
}
