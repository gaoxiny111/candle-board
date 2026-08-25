"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useBoardStore } from "@/store/useBoardStore";
import Toolbar from "./Toolbar";
import FilterPanel from "./FilterPanel";
import SignalList from "./SignalList";
import TradePlanPanel from "./TradePlanPanel";
import StructurePanel from "./StructurePanel";
import ChecklistModal from "./ChecklistModal";

const KlineChart = dynamic(() => import("./KlineChart"), { ssr: false });
const IndicatorStrip = dynamic(() => import("./IndicatorStrip"), { ssr: false });

export default function Dashboard() {
  const load = useBoardStore((s) => s.load);
  const loading = useBoardStore((s) => s.loading);
  const error = useBoardStore((s) => s.error);
  const mock = useBoardStore((s) => s.mock);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-[#242a36] px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="font-semibold tracking-wide text-[#c9a227]">candle-board</span>
          <span className="text-xs text-[#8b93a7]">A股蜡烛图辅助看板 · Phase 1</span>
        </div>
        <p className="text-[11px] text-[#8b93a7]">
          技术分析学习辅助，不构成投资建议。形态只做发现与验证，决策由你确认。
        </p>
      </header>

      <Toolbar />

      {(loading || error || mock) && (
        <div className="border-b border-[#242a36] px-4 py-1 text-xs">
          {loading && <span className="text-[#c9a227]">正在加载 A 股 K 线…</span>}
          {error && <span className="text-[#f0616d]">加载失败：{error}</span>}
          {mock && !loading && (
            <span className="text-[#c9a227]">行情源暂不可用，已切换演示数据</span>
          )}
        </div>
      )}

      <div className="grid flex-1 grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="flex min-h-[720px] flex-col border-r border-[#242a36]">
          <div className="min-h-[420px] flex-1">
            <KlineChart />
          </div>
          <IndicatorStrip />
        </section>
        <aside className="flex max-h-[calc(100vh-96px)] flex-col overflow-y-auto scrollbar-thin">
          <FilterPanel />
          <SignalList />
          <StructurePanel />
          <TradePlanPanel />
        </aside>
      </div>

      <footer className="border-t border-[#242a36] px-4 py-2 text-center text-[11px] text-[#8b93a7]">
        本工具为技术分析学习辅助，不构成任何投资建议。股市有风险，投资需谨慎。行情来自公开接口，可能存在延迟。
      </footer>
      <ChecklistModal />
    </div>
  );
}
