"use client";

import { useBoardStore } from "@/store/useBoardStore";

const gradeCls = {
  S: "border-[#ff4d4f] bg-[#ff4d4f]/15 text-[#ff4d4f]",
  A: "border-[#ff9800] bg-[#ff9800]/10 text-[#ff9800]",
  B: "border-[#e6c35c]/40 text-[#e6c35c]",
};

export default function SignalList() {
  const signals = useBoardStore((s) => s.signals);
  const selectedId = useBoardStore((s) => s.selectedId);
  const selectSignal = useBoardStore((s) => s.selectSignal);

  const recent = signals.filter((s) => s.index >= (signals[0]?.index ?? 0) - 80).slice(0, 24);

  return (
    <section className="border-b border-[#242a36] p-3">
      <h2 className="mb-2 text-sm font-medium">形态初筛（非最终判断）</h2>
      <div className="max-h-48 space-y-1 overflow-y-auto scrollbar-thin">
        {recent.length === 0 && <p className="text-xs text-[#8b93a7]">当前窗口无明显形态</p>}
        {recent.map((s) => (
          <button
            key={s.id}
            onClick={() => selectSignal(s.id)}
            className={`flex w-full items-center gap-2 rounded border px-2 py-1 text-left text-xs ${
              selectedId === s.id ? "border-[#c9a227]" : "border-[#242a36]"
            }`}
          >
            <span className={`rounded border px-1 font-semibold ${gradeCls[s.grade]}`}>{s.grade}</span>
            <span>{s.label}</span>
            {s.direction === "bear" && <span className="text-[10px] text-[#8b93a7]">减仓参考</span>}
            <span className="ml-auto text-[#8b93a7]">{s.quality.toFixed(1)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
