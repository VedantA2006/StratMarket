import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();
    const logs = await db.getAuditEvents(100);
    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Administrator authorization required" }, { status: 403 });
    }
    console.error("GET /api/admin/audit error:", error);
    return NextResponse.json({ error: "Failed to fetch audit events" }, { status: 500 });
  }
}
