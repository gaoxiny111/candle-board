"use client";

import { selectActive, selectFilter, useBoardStore } from "@/store/useBoardStore";

const lamp = (pass: boolean | "pending") => {
  if (pass === true) return "bg-[#3dd68c]";
  if (pass === "pending") return "bg-[#e6c35c]";
  return "bg-[#f0616d]";
};

export default function FilterPanel() {
  const signal = useBoardStore(selectActive);
  const filter = useBoardStore(selectFilter);

  if (!signal || !filter) {
    return (
      <section className="border-b border-[#242a36] p-3">
        <h2 className="mb-1 text-sm font-medium">六层过滤器</h2>
        <p className="text-xs text-[#8b93a7]">等待形态初筛结果。形态只做发现，不替代你的终审。</p>
      </section>
    );
  }

  const hi = filter.passed >= 5;

  return (
    <section className="border-b border-[#242a36] p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-medium">六层过滤器</h2>
        <div className={`font-mono text-xl ${hi ? "text-[#3dd68c]" : "text-[#e6c35c]"}`}>
          {filter.passed}/6
        </div>
      </div>
      <div className="space-y-1.5">
        {filter.layers.map((l) => (
          <details key={l.id} className="rounded border border-[#242a36] bg-[#161b26] px-2 py-1.5">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-xs">
              <span className={`h-2.5 w-2.5 rounded-full ${lamp(l.pass)}`} />
              <span>
                第{l.id}层 · {l.name}
              </span>
              <span className="ml-auto text-[#8b93a7]">
                {l.pass === true ? "过" : l.pass === "pending" ? "待" : "未过"}
              </span>
            </summary>
            <p className="mt-1 text-[11px] leading-5 text-[#8b93a7]">{l.detail}</p>
          </details>
        ))}
      </div>
      {hi && (
        <p className="mt-2 text-xs text-[#3dd68c]">≥5 层通过，可进入交易计划（仍需人工确认）</p>
      )}
    </section>
  );
}
