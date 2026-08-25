import type { Timeframe } from "./types";

export type DataSource = "cn";

export type MarketGroup = "cn" | "etf" | "index";

export type BoardType = "main" | "chinext" | "star";

export type SymbolDef = {
  id: string;
  name: string;
  source: DataSource;
  ticker: string;
  sina: string;
  group: MarketGroup;
  board: BoardType;
  /** 涨跌停幅度：主板 0.1，创业/科创 0.2 */
  limitPct: number;
};

export const SYMBOLS: SymbolDef[] = [
  // 指数（大盘过滤必选）
  { id: "000001", name: "上证指数", source: "cn", ticker: "000001.SH", sina: "sh000001", group: "index", board: "main", limitPct: 0.1 },
  { id: "399001", name: "深证成指", source: "cn", ticker: "399001.SZ", sina: "sz399001", group: "index", board: "main", limitPct: 0.1 },
  { id: "399006", name: "创业板指", source: "cn", ticker: "399006.SZ", sina: "sz399006", group: "index", board: "chinext", limitPct: 0.2 },
  // 主板
  { id: "600519", name: "贵州茅台 600519", source: "cn", ticker: "600519.SS", sina: "sh600519", group: "cn", board: "main", limitPct: 0.1 },
  { id: "601318", name: "中国平安 601318", source: "cn", ticker: "601318.SS", sina: "sh601318", group: "cn", board: "main", limitPct: 0.1 },
  { id: "600036", name: "招商银行 600036", source: "cn", ticker: "600036.SS", sina: "sh600036", group: "cn", board: "main", limitPct: 0.1 },
  { id: "600900", name: "长江电力 600900", source: "cn", ticker: "600900.SS", sina: "sh600900", group: "cn", board: "main", limitPct: 0.1 },
  { id: "000001.SZ", name: "平安银行 000001", source: "cn", ticker: "000001.SZ", sina: "sz000001", group: "cn", board: "main", limitPct: 0.1 },
  { id: "000858", name: "五粮液 000858", source: "cn", ticker: "000858.SZ", sina: "sz000858", group: "cn", board: "main", limitPct: 0.1 },
  { id: "002594", name: "比亚迪 002594", source: "cn", ticker: "002594.SZ", sina: "sz002594", group: "cn", board: "main", limitPct: 0.1 },
  { id: "601012", name: "隆基绿能 601012", source: "cn", ticker: "601012.SS", sina: "sh601012", group: "cn", board: "main", limitPct: 0.1 },
  // 创业板 ±20%
  { id: "300750", name: "宁德时代 300750", source: "cn", ticker: "300750.SZ", sina: "sz300750", group: "cn", board: "chinext", limitPct: 0.2 },
  { id: "300059", name: "东方财富 300059", source: "cn", ticker: "300059.SZ", sina: "sz300059", group: "cn", board: "chinext", limitPct: 0.2 },
  { id: "300760", name: "迈瑞医疗 300760", source: "cn", ticker: "300760.SZ", sina: "sz300760", group: "cn", board: "chinext", limitPct: 0.2 },
  // 科创板 ±20%
  { id: "688981", name: "中芯国际 688981", source: "cn", ticker: "688981.SS", sina: "sh688981", group: "cn", board: "star", limitPct: 0.2 },
  { id: "688111", name: "金山办公 688111", source: "cn", ticker: "688111.SS", sina: "sh688111", group: "cn", board: "star", limitPct: 0.2 },
  // ETF
  { id: "510300", name: "沪深300ETF 510300", source: "cn", ticker: "510300.SS", sina: "sh510300", group: "etf", board: "main", limitPct: 0.1 },
  { id: "510500", name: "中证500ETF 510500", source: "cn", ticker: "510500.SS", sina: "sh510500", group: "etf", board: "main", limitPct: 0.1 },
  { id: "159915", name: "创业板ETF 159915", source: "cn", ticker: "159915.SZ", sina: "sz159915", group: "etf", board: "chinext", limitPct: 0.2 },
];

export const DEFAULT_SYMBOL_ID = "600519";
export const MARKET_INDEX_ID = "000001";

export const GROUP_LABELS: Record<MarketGroup, string> = {
  index: "大盘指数",
  cn: "A股个股",
  etf: "ETF",
};

/** P0：日线 / 周线；P1：60分钟 */
export const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: "1d", label: "日" },
  { id: "1w", label: "周" },
  { id: "1h", label: "60分" },
];

export function htfLabel(tf: Timeframe): string {
  if (tf === "1h") return "日线";
  if (tf === "1d") return "周线";
  return "月线近似(周线)";
}

export function htfOf(tf: Timeframe): Timeframe {
  if (tf === "1h") return "1d";
  return "1w";
}

export function symbolsByGroup(): { group: MarketGroup; label: string; items: SymbolDef[] }[] {
  const order: MarketGroup[] = ["index", "cn", "etf"];
  return order.map((group) => ({
    group,
    label: GROUP_LABELS[group],
    items: SYMBOLS.filter((s) => s.group === group),
  }));
}

export function getSymbol(id: string): SymbolDef {
  return SYMBOLS.find((s) => s.id === id) ?? SYMBOLS.find((s) => s.id === DEFAULT_SYMBOL_ID)!;
}
