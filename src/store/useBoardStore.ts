"use client";

import { create } from "zustand";
import type {
  Candle,
  DrawMode,
  FibSet,
  FilterResult,
  HtfTrend,
  IndicatorSnapshot,
  PatternSignal,
  StructureLine,
  Timeframe,
  TradePlan,
  TrendLine,
} from "@/lib/types";
import { SYMBOLS } from "@/lib/symbols";
import { computeIndicators, lastNumber } from "@/lib/indicators";
import { detectPatterns } from "@/lib/patterns/detect";
import { runFilters } from "@/lib/filters";
import { buildPlan, DEFAULT_RISK } from "@/lib/plan";
import { lastSwingRange } from "@/lib/swings";

type BoardState = {
  symbolId: string;
  timeframe: Timeframe;
  candles: Candle[];
  source: string;
  mock: boolean;
  loading: boolean;
  error: string | null;
  indicators: IndicatorSnapshot | null;
  atr: number;
  htf: HtfTrend;
  signals: PatternSignal[];
  selectedId: string | null;
  lines: StructureLine[];
  trends: TrendLine[];
  fib: FibSet;
  showMa: { ma20: boolean; ma50: boolean; ma200: boolean };
  drawMode: DrawMode;
  trendDraft: { t: number; p: number } | null;
  filters: FilterResult | null;
  plan: TradePlan | null;
  account: number;
  riskPct: number;
  forceRr: boolean;
  checklistOpen: boolean;
  checklist: Record<string, boolean>;
  setSymbol: (id: string) => void;
  setTimeframe: (tf: Timeframe) => void;
  load: () => Promise<void>;
  selectSignal: (id: string | null) => void;
  addLine: (price: number, kind?: StructureLine["kind"]) => void;
  bumpTests: (id: string) => void;
  toggleAnchor: (id: string, kind: "spring" | "upthrust") => void;
  removeLine: (id: string) => void;
  addTrend: (line: TrendLine) => void;
  addTrendPoint: (t: number, p: number) => void;
  toggleTrendDash: (id: string) => void;
  autoFib: () => void;
  clearFib: () => void;
  setDrawMode: (m: DrawMode) => void;
  setShowMa: (k: "ma20" | "ma50" | "ma200", on: boolean) => void;
  setAccount: (n: number) => void;
  setRiskPct: (n: number) => void;
  setForceRr: (v: boolean) => void;
  generatePlan: () => void;
  setChecklistOpen: (v: boolean) => void;
  toggleCheck: (k: string) => void;
};

const DEFAULT_HTF: HtfTrend = { direction: "side", label: "周线", ma20: null, slope: null };

function recompute(get: () => BoardState, set: (p: Partial<BoardState>) => void) {
  const s = get();
  if (!s.candles.length) return;
  const indicators = computeIndicators(s.candles);
  const atr = lastNumber(indicators.atr) ?? s.candles[s.candles.length - 1].close * 0.01;
  const signals = detectPatterns(s.candles, s.lines, atr, true);
  const selected = signals.find((x) => x.id === s.selectedId) ?? signals[0] ?? null;
  const filters = selected ? runFilters(selected, s.candles, s.lines, indicators, s.htf) : null;
  const risk = s.riskPct;
  const plan = selected ? buildPlan(selected, s.candles, s.lines, atr, s.account, risk) : null;
  set({
    indicators,
    atr,
    signals,
    selectedId: selected?.id ?? null,
    filters,
    plan,
  });
}

export const useBoardStore = create<BoardState>((set, get) => ({
  symbolId: SYMBOLS[0].id,
  timeframe: "1d",
  candles: [],
  source: "",
  mock: false,
  loading: false,
  error: null,
  indicators: null,
  atr: 0,
  htf: DEFAULT_HTF,
  signals: [],
  selectedId: null,
  lines: [],
  trends: [],
  fib: null,
  showMa: { ma20: true, ma50: true, ma200: false },
  drawMode: "none",
  trendDraft: null,
  filters: null,
  plan: null,
  account: 100000,
  riskPct: 1,
  forceRr: false,
  checklistOpen: false,
  checklist: {},
  setSymbol: (id) => {
    set({ symbolId: id, selectedId: null, plan: null, lines: [], trends: [], fib: null, checklist: {} });
    void get().load();
  },
  setTimeframe: (tf) => {
    set({ timeframe: tf, selectedId: null, plan: null });
    void get().load();
  },
  load: async () => {
    const { symbolId, timeframe } = get();
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/candles?symbol=${symbolId}&tf=${timeframe}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({
        candles: data.candles,
        source: data.source,
        mock: data.mock,
        htf: data.htf ?? DEFAULT_HTF,
        loading: false,
      });
      recompute(get, set);
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : "加载失败" });
    }
  },
  selectSignal: (id) => {
    const sig = get().signals.find((x) => x.id === id);
    set({
      selectedId: id,
      checklistOpen: false,
      riskPct: sig ? DEFAULT_RISK[sig.grade] : get().riskPct,
    });
    recompute(get, set);
  },
  addLine: (price, kind) => {
    const last = get().candles[get().candles.length - 1];
    const inferred: StructureLine["kind"] =
      kind ?? (last && price >= last.close ? "resistance" : "support");
    const line: StructureLine = {
      id: `L-${Date.now()}`,
      kind: inferred,
      price,
      tests: 1,
      springAnchor: false,
      upthrustAnchor: false,
    };
    set({ lines: [...get().lines, line] });
    recompute(get, set);
  },
  bumpTests: (id) => {
    set({
      lines: get().lines.map((l) => (l.id === id ? { ...l, tests: l.tests + 1 } : l)),
    });
  },
  toggleAnchor: (id, kind) => {
    set({
      lines: get().lines.map((l) =>
        l.id === id
          ? kind === "spring"
            ? { ...l, springAnchor: !l.springAnchor }
            : { ...l, upthrustAnchor: !l.upthrustAnchor }
          : l,
      ),
    });
    recompute(get, set);
  },
  removeLine: (id) => {
    set({ lines: get().lines.filter((l) => l.id !== id) });
    recompute(get, set);
  },
  addTrend: (line) => set({ trends: [...get().trends, line], trendDraft: null, drawMode: "none" }),
  addTrendPoint: (t, p) => {
    const draft = get().trendDraft;
    if (!draft) {
      set({ trendDraft: { t, p } });
      return;
    }
    get().addTrend({
      id: `T-${Date.now()}`,
      t1: draft.t,
      p1: draft.p,
      t2: t,
      p2: p,
      dashed: false,
    });
  },
  toggleTrendDash: (id) =>
    set({
      trends: get().trends.map((t) => (t.id === id ? { ...t, dashed: !t.dashed } : t)),
    }),
  autoFib: () => {
    const range = lastSwingRange(get().candles);
    if (!range) return;
    set({
      fib: {
        swingHigh: range.high,
        swingLow: range.low,
        highTime: range.highTime,
        lowTime: range.lowTime,
      },
      drawMode: "none",
    });
  },
  clearFib: () => set({ fib: null }),
  setDrawMode: (m) => set({ drawMode: m, trendDraft: null }),
  setShowMa: (k, on) => set({ showMa: { ...get().showMa, [k]: on } }),
  setAccount: (n) => {
    set({ account: n });
    recompute(get, set);
  },
  setRiskPct: (n) => {
    set({ riskPct: n });
    recompute(get, set);
  },
  setForceRr: (v) => set({ forceRr: v }),
  generatePlan: () => {
    const s = get();
    if (!s.plan) return;
    if (s.plan.blocked && !s.forceRr) return;
    set({ checklistOpen: true, checklist: {} });
  },
  setChecklistOpen: (v) => {
    if (v) {
      const s = get();
      if (s.plan?.blocked && !s.forceRr) return;
    }
    set({ checklistOpen: v, checklist: v ? {} : get().checklist });
  },
  toggleCheck: (k) => set({ checklist: { ...get().checklist, [k]: !get().checklist[k] } }),
}));

export const selectActive = (s: BoardState) => s.signals.find((x) => x.id === s.selectedId) ?? null;
export const selectFilter = (s: BoardState) => s.filters;
export const selectPlan = (s: BoardState) => s.plan;

export function trendArrow(htf: HtfTrend): string {
  if (htf.direction === "up") return "↑";
  if (htf.direction === "down") return "↓";
  return "→";
}
