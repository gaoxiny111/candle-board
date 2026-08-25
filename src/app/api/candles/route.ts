import { NextRequest, NextResponse } from "next/server";
import { SYMBOLS, DEFAULT_SYMBOL_ID, htfLabel, getSymbol } from "@/lib/symbols";
import { loadCandles, loadHtf } from "@/lib/market";
import { htfFromCandles } from "@/lib/indicators";
import type { Timeframe } from "@/lib/types";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") ?? DEFAULT_SYMBOL_ID;
  const tf = (req.nextUrl.searchParams.get("tf") ?? "1d") as Timeframe;
  const def = getSymbol(symbol);

  const sh = SYMBOLS.find((s) => s.id === "000001")!;
  const sz = SYMBOLS.find((s) => s.id === "399001")!;
  const cy = SYMBOLS.find((s) => s.id === "399006")!;

  const [main, htfData, shData, szData, cyData] = await Promise.all([
    loadCandles(def, tf),
    loadHtf(def, tf),
    loadCandles(sh, "1d"),
    loadCandles(sz, "1d"),
    loadCandles(cy, "1d"),
  ]);

  const htf = htfFromCandles(htfData.candles, htfLabel(tf));
  const market = {
    shanghai: htfFromCandles(shData.candles, "上证"),
    shenzhen: htfFromCandles(szData.candles, "深证"),
    chinext: htfFromCandles(cyData.candles, "创业板"),
  };

  return NextResponse.json({
    candles: main.candles,
    source: main.source,
    mock: main.mock,
    htf,
    market,
    symbol: { id: def.id, name: def.name, limitPct: def.limitPct, board: def.board },
  });
}
