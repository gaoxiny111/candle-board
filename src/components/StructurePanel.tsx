"use client";

import { useBoardStore } from "@/store/useBoardStore";

export default function StructurePanel() {
  const lines = useBoardStore((s) => s.lines);
  const trends = useBoardStore((s) => s.trends);
  const bumpTests = useBoardStore((s) => s.bumpTests);
  const toggleAnchor = useBoardStore((s) => s.toggleAnchor);
  const removeLine = useBoardStore((s) => s.removeLine);
  const toggleTrendDash = useBoardStore((s) => s.toggleTrendDash);

  return (
    <section className="border-b border-[#242a36] p-3">
      <h2 className="mb-1 text-sm font-medium">结构标注（人画线 · 机器检测破位）</h2>
      <p className="mb-2 text-[11px] text-[#8b93a7]">
        支撑阻力有效性主观判断。点「测试+1」记录回踩次数；Spring/UT 锚点与破位检测联动。
      </p>
      <div className="space-y-1">
        {lines.length === 0 && <p className="text-xs text-[#8b93a7]">尚未画线。工具栏选择「支撑/阻力」后点击图表。</p>}
        {lines.map((l) => (
          <div key={l.id} className="flex flex-wrap items-center gap-1 rounded border border-[#242a36] px-2 py-1 text-[11px]">
            <span className={l.kind === "support" ? "text-[#3dd68c]" : "text-[#f0616d]"}>
              {l.kind === "support" ? "支撑" : "阻力"} {l.price.toFixed(4)}
            </span>
            <button className="rounded border border-[#242a36] px-1" onClick={() => bumpTests(l.id)}>
              测试 {l.tests}
            </button>
            <button
              className={`rounded border px-1 ${l.springAnchor ? "border-[#3dd68c] text-[#3dd68c]" : "border-[#242a36]"}`}
              onClick={() => toggleAnchor(l.id, "spring")}
            >
              Spring锚点
            </button>
            <button
              className={`rounded border px-1 ${l.upthrustAnchor ? "border-[#f0616d] text-[#f0616d]" : "border-[#242a36]"}`}
              onClick={() => toggleAnchor(l.id, "upthrust")}
            >
              UT锚点
            </button>
            <button className="ml-auto text-[#8b93a7]" onClick={() => removeLine(l.id)}>
              删
            </button>
          </div>
        ))}
      </div>
      {trends.length > 0 && (
        <div className="mt-2 space-y-1">
          {trends.map((t) => (
            <button
              key={t.id}
              className="w-full rounded border border-[#242a36] px-2 py-1 text-left text-[11px]"
              onClick={() => toggleTrendDash(t.id)}
            >
              趋势线 {t.dashed ? "虚线" : "实线"}（点击切换）
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
