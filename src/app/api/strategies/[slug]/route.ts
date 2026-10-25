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

    if (strategy.visibilityStatus !== "PUBLIC") {
      const user = await getSession();
      if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Strategy not accessible" }, { status: 403 });
      }
    }

    // Check user access entitlement if logged in
    const user = await getSession();
    let accessStatus = { hasAccess: false, accessType: "NONE" };
    if (user) {
      accessStatus = await db.checkUserStrategyAccess(user.id, strategy.id);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...strategy,
        userAccess: accessStatus,
      },
    });
  } catch (error: any) {
    console.error("GET /api/strategies/[slug] error:", error);
    return NextResponse.json({ error: "Failed to fetch strategy" }, { status: 500 });
  }
}
