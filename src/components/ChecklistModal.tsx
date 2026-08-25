"use client";

import { selectActive, selectFilter, selectPlan, useBoardStore } from "@/store/useBoardStore";

const ITEMS = [
  { k: "pos", t: "我已核对信号K线是否打到自己画的结构" },
  { k: "trend", t: "我已核对大周期趋势，接受顺/逆判断" },
  { k: "shape", t: "我已肉眼复核形态，不只依赖自动初筛" },
  { k: "mom", t: "我已查看动能与量能，不机械信灯" },
  { k: "confirm", t: "确认K线条件我已理解，未确认则不加仓" },
  { k: "risk", t: "止损已设定且不会删除，仓位按风险%计算" },
  { k: "legal", t: "我知悉本工具非投资建议，盈亏自负" },
];

export default function ChecklistModal() {
  const open = useBoardStore((s) => s.checklistOpen);
  const setOpen = useBoardStore((s) => s.setChecklistOpen);
  const checklist = useBoardStore((s) => s.checklist);
  const toggle = useBoardStore((s) => s.toggleCheck);
  const signal = useBoardStore(selectActive);
  const filter = useBoardStore(selectFilter);
  const plan = useBoardStore(selectPlan);
  const symbolId = useBoardStore((s) => s.symbolId);
  const timeframe = useBoardStore((s) => s.timeframe);

  if (!open || !signal || !filter || !plan) return null;
  const allOn = ITEMS.every((i) => checklist[i.k]);

  const exportPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 print:static print:bg-white print:p-0">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-[#242a36] bg-[#11141c] p-4 print:max-w-none print:border-0 print:bg-white print:text-black">
        <h2 className="text-lg font-medium">交易检查清单（不可跳过）</h2>
        <p className="mt-1 text-xs text-[#8b93a7] print:text-neutral-600">
          {symbolId} · {timeframe} · {signal.grade} {signal.label} · 通过 {filter.passed}/6
        </p>
        <pre className="mt-3 overflow-x-auto rounded bg-[#090b10] p-2 font-mono text-[11px] print:bg-neutral-100">
{`方向 ${plan.direction === "bull" ? "多" : "空"}
入场 ${plan.entry.toFixed(4)}
止损 ${plan.stop.toFixed(4)}
TP1  ${plan.tp1.toFixed(4)}
TP2  ${plan.tp2.toFixed(4)}
${plan.tp3Note}
仓位 ${plan.positionSize.toFixed(4)}
风险 ${plan.riskPct}% / 资金 ${plan.account}
盈亏比 ${plan.rr.toFixed(2)}:1
六层：${filter.layers.map((l) => `${l.name}${l.pass === true ? "✓" : l.pass === "pending" ? "?" : "✗"}`).join(" ")}`}
        </pre>
        <div className="mt-3 space-y-2">
          {ITEMS.map((i) => (
            <label key={i.k} className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={Boolean(checklist[i.k])} onChange={() => toggle(i.k)} />
              <span>{i.t}</span>
            </label>
          ))}
        </div>
        <div className="mt-4 flex gap-2 print:hidden">
          <button
            disabled={!allOn}
            onClick={exportPrint}
            className="flex-1 rounded bg-[#c9a227] py-2 text-sm text-black disabled:bg-[#2a3140] disabled:text-[#8b93a7]"
          >
            勾选全部后导出 PDF/打印
          </button>
          <button onClick={() => setOpen(false)} className="rounded border border-[#242a36] px-3 py-2 text-sm">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
