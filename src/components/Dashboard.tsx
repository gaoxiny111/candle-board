"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useBoardStore } from "@/store/useBoardStore";
import Toolbar from "./Toolbar";
import FilterPanel from "./FilterPanel";
import SignalList from "./SignalList";
import TradePlanPanel from "./TradePlanPanel";
import StructurePanel from "./StructurePanel";
import IndicatorStrip from "./IndicatorStrip";
import ChecklistModal from "./ChecklistModal";

const KlineChart = dynamic(() => import("./KlineChart"), { ssr: false });

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
          <span className="text-xs text-[#8b93a7]">蜡烛图交易看板 · Phase 1 MVP</span>
        </div>
        <p className="text-[11px] text-[#8b93a7]">
          辅助工具，非投资建议。系统只做发现与验证，决策与下单由你确认。
        </p>
      </header>

      <Toolbar />

      {(loading || error || mock) && (
        <div className="border-b border-[#242a36] px-4 py-1 text-xs">
          {loading && <span className="text-[#c9a227]">正在加载 K 线…</span>}
          {error && <span className="text-[#f0616d]">加载失败：{error}</span>}
          {mock && !loading && (
            <span className="text-[#c9a227]">行情源暂不可用，已切换演示数据</span>
          )}
        </div>
      )}

      <div className="grid flex-1 grid-cols-1 gap-0 xl:grid-cols-[1fr_340px]">
        <section className="flex min-h-[640px] flex-col border-r border-[#242a36]">
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
      <ChecklistModal />
    </div>
  );
}
