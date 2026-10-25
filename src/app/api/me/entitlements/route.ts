import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const trials = await db.getUserTrials(user.id);
    const entitlements = await db.getUserEntitlements(user.id);
    const strategies = await db.getStrategies();

    const enrichedTrials = trials.map((t) => {
      const s = strategies.find((item) => item.id === t.strategyId);
      const now = new Date();
      const msLeft = t.expiryTime.getTime() - now.getTime();
      const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
      const isExpired = now > t.expiryTime || t.status === "EXPIRED";

      return {
        ...t,
        strategyName: s?.name || t.strategyId,
        instrument: s?.instrument || "",
        timeframe: s?.timeframe || "",
        category: s?.category || "",
        daysLeft: isExpired ? 0 : daysLeft,
        isExpired,
      };
    });

    return NextResponse.json({
      success: true,
      trials: enrichedTrials,
      entitlements,
    });
  } catch (error: any) {
    console.error("GET /api/me/entitlements error:", error);
    return NextResponse.json({ error: "Failed to fetch entitlements" }, { status: 500 });
  }
}
