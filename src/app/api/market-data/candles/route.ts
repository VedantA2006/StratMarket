import { NextRequest, NextResponse } from "next/server";
import { tradingViewAdapter } from "@/lib/market-data";
import { z } from "zod";

const CandlesQuerySchema = z.object({
  symbol: z.string().default("XAUUSD"),
  timeframe: z.string().default("15"),
  count: z.coerce.number().min(10).max(1000).default(300),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = CandlesQuerySchema.safeParse({
      symbol: searchParams.get("symbol") || "XAUUSD",
      timeframe: searchParams.get("timeframe") || "15",
      count: searchParams.get("count") || 300,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { symbol, timeframe, count } = parsed.data;
    const mappedSymbol = tradingViewAdapter.mapSymbol(symbol);
    const mappedTf = tradingViewAdapter.mapTimeframe(timeframe);

    const candles = await tradingViewAdapter.getHistoricalBars(symbol, timeframe, count);

    return NextResponse.json({
      success: true,
      symbol,
      mappedSymbol,
      timeframe: mappedTf,
      source: "TradingView Institutional Feed",
      status: tradingViewAdapter.getConnectionStatus(),
      count: candles.length,
      candles,
    });
  } catch (error: any) {
    if (error?.digest === "NEXT_PRERENDER_INTERRUPTED") {
      throw error;
    }
    console.error("GET /api/market-data/candles error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to retrieve market candles",
        status: "ERROR",
      },
      { status: 500 }
    );
  }
}
