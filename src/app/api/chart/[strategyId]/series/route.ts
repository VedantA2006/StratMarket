import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tradingViewAdapter } from "@/lib/market-data";
import { strategyExecutionRunner } from "@/lib/strategy-execution";

interface Props {
  params: Promise<{
    strategyId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { strategyId } = await params;
    if (!strategyId) {
      return NextResponse.json({ success: false, error: "Strategy ID is required" }, { status: 400 });
    }

    const strategy = await db.getStrategyBySlug(strategyId);
    if (!strategy) {
      return NextResponse.json({ success: false, error: "Strategy not found in catalogue" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get("count") || "5000", 10);
    const timeframe = searchParams.get("timeframe") || strategy.timeframe;

    // Fetch authoritative live/historical market candles
    const candles = await tradingViewAdapter.getHistoricalBars(
      strategy.instrument,
      timeframe,
      count
    );

    // Execute strategy in private server environment
    const contract = strategyExecutionRunner.execute(strategy, candles);

    return NextResponse.json({
      success: true,
      contract,
      candles,
    });
  } catch (error: any) {
    if (error?.digest === "NEXT_PRERENDER_INTERRUPTED") {
      throw error;
    }
    console.error("GET /api/chart/[strategyId]/series error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to execute strategy series" },
      { status: 500 }
    );
  }
}
