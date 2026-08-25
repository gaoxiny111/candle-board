import { NextRequest, NextResponse } from "next/server";
import { SYMBOLS, htfLabel } from "@/lib/symbols";
import { loadCandles, loadHtf } from "@/lib/market";
import { htfFromCandles } from "@/lib/indicators";
import type { Timeframe } from "@/lib/types";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") ?? "BTCUSDT";
  const tf = (req.nextUrl.searchParams.get("tf") ?? "1d") as Timeframe;
  const def = SYMBOLS.find((s) => s.id === symbol) ?? SYMBOLS[0];
  const [main, htfData] = await Promise.all([loadCandles(def, tf), loadHtf(def, tf)]);
  const htf = htfFromCandles(htfData.candles, htfLabel(tf));
  return NextResponse.json({
    candles: main.candles,
    source: main.source,
    mock: main.mock,
    htf,
  });
}
