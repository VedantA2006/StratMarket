import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

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

    const user = await getSession();
    let isEntitled = false;

    if (user) {
      if (user.role === "ADMIN") {
        isEntitled = true;
      } else {
        const access = await db.checkUserStrategyAccess(user.id, strategy.id);
        isEntitled = access.hasAccess;
      }
    }

    const limit = isEntitled ? 50 : 3;
    const signals = await db.getSignals(strategy.id, limit);

    return NextResponse.json({
      success: true,
      strategyId: strategy.id,
      isEntitled,
      accessNotice: isEntitled
        ? "Full signal feed active."
        : "Preview mode: start a 7-day trial to unlock full live signals.",
      count: signals.length,
      data: signals,
    });
  } catch (error: any) {
    console.error("GET /api/strategies/[slug]/signals error:", error);
    return NextResponse.json({ error: "Failed to fetch signals" }, { status: 500 });
  }
}
