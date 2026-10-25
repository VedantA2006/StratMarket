import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const strategy = await db.getStrategyBySlug(slug);

    if (!strategy) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        strategyId: strategy.id,
        name: strategy.name,
        currentVersion: strategy.currentVersion,
        metrics: strategy.metrics,
        researchReport: strategy.researchReport,
        equitySeries: strategy.equitySeries,
        drawdownSeries: strategy.drawdownSeries,
        provenance: {
          dataSource: strategy.metrics.dataSource,
          validationType: strategy.metrics.validationType,
          isDemo: strategy.metrics.isDemo,
          backtestPeriod: strategy.metrics.backtestPeriod,
          slippageAssumptions: strategy.metrics.slippageAssumptions,
          transactionCosts: strategy.metrics.transactionCosts,
        },
      },
    });
  } catch (error: any) {
    console.error("GET /api/strategies/[slug]/report error:", error);
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}
