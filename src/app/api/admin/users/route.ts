import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();
    const users = await db.getAllUsers();

    // Enrich users with trial and entitlement info (without passwords)
    const enriched = await Promise.all(
      users.map(async (u) => {
        const trials = await db.getUserTrials(u.id);
        const entitlements = await db.getUserEntitlements(u.id);
        const connections = await db.getUserConnections(u.id);

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          accountStatus: u.accountStatus,
          emailVerified: u.emailVerified,
          createdAt: u.createdAt,
          activeTrialsCount: trials.filter((t) => t.status === "ACTIVE").length,
          activeEntitlementsCount: entitlements.filter((e) => e.status === "ACTIVE").length,
          connectionsCount: connections.length,
        };
      })
    );

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Administrator authorization required" }, { status: 403 });
    }
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
