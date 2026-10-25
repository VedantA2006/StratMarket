import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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

    // Return chart session metadata (Strictly omitting any source code)
    return NextResponse.json({
      success: true,
      strategy: {
        id: strategy.id,
        slug: strategy.slug,
        name: strategy.name,
        description: strategy.description,
        implementationType: strategy.implementationType,
        instrument: strategy.instrument,
        timeframe: strategy.timeframe,
        category: strategy.category,
        metrics: strategy.metrics,
        riskRules: strategy.researchReport?.riskRules,
        hypothesis: strategy.researchReport?.hypothesis,
      },
    });
  } catch (error: any) {
    if (error?.digest === "NEXT_PRERENDER_INTERRUPTED") {
      throw error;
    }
    console.error("GET /api/chart/[strategyId] error:", error);
    return NextResponse.json({ success: false, error: "Failed to load chart strategy session" }, { status: 500 });
  }
}
