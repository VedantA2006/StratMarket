import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();

    const users = await db.getAllUsers();
    const strategies = await db.getStrategies({ includeDrafts: true });
    const signals = await db.getSignals(undefined, 100);
    const health = await db.getVpsHealthStatus();
    const auditLogs = await db.getAuditEvents(20);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: users.length,
        totalStrategies: strategies.length,
        pythonStrategies: strategies.filter((s) => s.implementationType === "PYTHON").length,
        pineStrategies: strategies.filter((s) => s.implementationType === "PINE_SCRIPT").length,
        signalsIngested: signals.length,
      },
      vpsRuntime: health,
      recentAuditLogs: auditLogs,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Administrator authorization required" }, { status: 403 });
    }
    console.error("GET /api/admin/overview error:", error);
    return NextResponse.json({ error: "Failed to fetch admin overview" }, { status: 500 });
  }
}
