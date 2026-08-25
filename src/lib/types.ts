export type Timeframe = "1h" | "1d" | "1w";

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

/** bull=看多参考；bear=减仓/不买入参考（A股无普遍做空） */
export type Direction = "bull" | "bear";
export type Grade = "S" | "A" | "B";
export type TrendDir = "up" | "down" | "side";

export type PatternKind =
  | "hammer"
  | "inverted_hammer"
  | "hanging_man"
  | "shooting_star"
  | "gravestone_doji"
  | "dragonfly_doji"
  | "bull_engulfing"
  | "bear_engulfing"
  | "piercing"
  | "dark_cloud"
  | "bull_harami"
  | "bear_harami"
  | "tweezer_bottom"
  | "tweezer_top"
  | "morning_star"
  | "evening_star"
  | "three_white_soldiers"
  | "three_black_crows"
  | "abandoned_baby_bull"
  | "abandoned_baby_bear"
  | "rising_three_methods"
  | "falling_three_methods"
  | "window_up"
  | "window_down"
  | "spring"
  | "upthrust";

export type PatternSignal = {
  id: string;
  kind: PatternKind;
  label: string;
  direction: Direction;
  index: number;
  startIndex: number;
  time: number;
  quality: number;
  grade: Grade;
  notes: string[];
  extreme: number;
};

export type StructureLine = {
  id: string;
  kind: "support" | "resistance";
  price: number;
  tests: number;
  springAnchor: boolean;
  upthrustAnchor: boolean;
};

export type TrendLine = {
  id: string;
  t1: number;
  p1: number;
  t2: number;
  p2: number;
  dashed: boolean;
};

export type FibSet = {
  swingHigh: number;
  swingLow: number;
  highTime: number;
  lowTime: number;
} | null;

export type LayerStatus = boolean | "pending";

export type FilterLayer = {
  id: 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
  pass: LayerStatus;
  detail: string;
};

export type FilterResult = {
  layers: FilterLayer[];
  passed: number;
  momentumChecks: { label: string; ok: boolean }[];
};

export type TradePlan = {
  direction: Direction;
  entry: number;
  stop: number;
  tp1: number;
  tp2: number;
  tp3Note: string;
  riskPct: number;
  account: number;
  /** 股数（整百股） */
  positionSize: number;
  rr: number;
  blocked: boolean;
  /** T+1：建议入场日（信号次交易日） */
  entryDate: string;
  /** 最早可卖出日 */
  earliestSellDate: string;
  confirmHint: string;
};

export type HtfTrend = {
  direction: TrendDir;
  label: string;
  ma20?: number | null;
  slope: number | null;
};

export type MarketBoard = {
  shanghai: HtfTrend;
  shenzhen: HtfTrend;
  chinext: HtfTrend;
};

export type IndicatorSnapshot = {
  rsi: (number | null)[];
  macd: { macd: (number | null)[]; signal: (number | null)[]; hist: (number | null)[] };
  kdj: { k: (number | null)[]; d: (number | null)[]; j: (number | null)[] };
  atr: (number | null)[];
  ma5: (number | null)[];
  ma10: (number | null)[];
  ma20: (number | null)[];
  ma60: (number | null)[];
  volMa5: (number | null)[];
  volMa20: (number | null)[];
};

export type DrawMode = "none" | "hline" | "trend" | "fib";
