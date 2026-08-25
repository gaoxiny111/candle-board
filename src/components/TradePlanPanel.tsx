"use client";

import { selectActive, selectFilter, selectPlan, useBoardStore } from "@/store/useBoardStore";

export default function TradePlanPanel() {
  const signal = useBoardStore(selectActive);
  const filter = useBoardStore(selectFilter);
  const plan = useBoardStore(selectPlan);
  const account = useBoardStore((s) => s.account);
  const riskPct = useBoardStore((s) => s.riskPct);
  const setAccount = useBoardStore((s) => s.setAccount);
  const setRiskPct = useBoardStore((s) => s.setRiskPct);
  const forceRr = useBoardStore((s) => s.forceRr);
  const setForceRr = useBoardStore((s) => s.setForceRr);

  if (!signal || !plan || !filter) {
    return (
      <section className="p-3">
        <h2 className="text-sm font-medium">交易计划</h2>
        <p className="mt-1 text-xs text-[#8b93a7]">选中信号后生成入场 / 止损 / 止盈 / 仓位。</p>
      </section>
    );
  }

  const canGenerate = !plan.blocked || forceRr;
  const layersOk = filter.passed >= 4;

  return (
    <section className="p-3">
      <h2 className="mb-2 text-sm font-medium">交易计划生成器</h2>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="text-[#8b93a7]">
          账户资金
          <input
            type="number"
            className="mt-1 w-full rounded border border-[#242a36] bg-[#090b10] px-2 py-1 text-[#d7dde8]"
            value={account}
            onChange={(e) => setAccount(Number(e.target.value))}
          />
        </label>
        <label className="text-[#8b93a7]">
          风险 %（{signal.grade} 默认）
          <input
            type="number"
            step="0.05"
            className="mt-1 w-full rounded border border-[#242a36] bg-[#090b10] px-2 py-1 text-[#d7dde8]"
            value={riskPct}
            onChange={(e) => setRiskPct(Number(e.target.value))}
          />
        </label>
      </div>
      <ul className="mt-2 space-y-1 font-mono text-xs">
        <li>方向 {plan.direction === "bull" ? "多" : "空"}</li>
        <li>入场 {plan.entry.toFixed(4)}</li>
        <li>止损 {plan.stop.toFixed(4)}（极值 ± 1×ATR，可在清单中手改）</li>
        <li>TP1 {plan.tp1.toFixed(4)}</li>
        <li>TP2 {plan.tp2.toFixed(4)}</li>
        <li>TP3 {plan.tp3Note}</li>
        <li>仓位 {plan.positionSize.toFixed(4)} 单位</li>
        <li className={plan.rr < 1.5 ? "text-[#f0616d]" : "text-[#3dd68c]"}>
          盈亏比 {plan.rr.toFixed(2)} : 1
        </li>
      </ul>
      {plan.blocked && (
        <label className="mt-2 flex items-center gap-2 text-[11px] text-[#f0616d]">
          <input type="checkbox" checked={forceRr} onChange={(e) => setForceRr(e.target.checked)} />
          盈亏比 &lt; 1.5，强制确认后才能生成
        </label>
      )}
      {!layersOk && (
        <p className="mt-2 text-[11px] text-[#e6c35c]">过滤器通过不足，建议不要生成计划。</p>
      )}
      <button
        disabled={!canGenerate}
        onClick={() => {
          if (plan.blocked && !forceRr) return;
          useBoardStore.getState().generatePlan();
        }}
        className="mt-3 w-full rounded bg-[#c9a227] py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:bg-[#2a3140] disabled:text-[#8b93a7]"
      >
        生成计划并打开检查清单
      </button>
    </section>
  );
}
