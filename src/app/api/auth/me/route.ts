import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const trials = await db.getUserTrials(session.id);
    const entitlements = await db.getUserEntitlements(session.id);
    const activeEntitlements = entitlements.filter((e) => e.status === "ACTIVE");

    return NextResponse.json({
      authenticated: true,
      user: session,
      summary: {
        activeTrialsCount: trials.filter((t) => t.status === "ACTIVE").length,
        activeEntitlementsCount: activeEntitlements.length,
      },
    });
  } catch (error: any) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json({ authenticated: false, user: null });
  }
}
