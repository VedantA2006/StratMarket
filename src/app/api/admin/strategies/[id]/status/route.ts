import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { z } from "zod";

const StatusSchema = z.object({
  status: z.enum(["PUBLIC", "PRIVATE", "DRAFT", "ARCHIVED"]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const parsed = StatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const updated = await db.updateStrategyStatus(id, parsed.data.status);

    await db.createAuditEvent({
      userId: admin.id,
      action: "STRATEGY_VISIBILITY_UPDATED",
      entityType: "STRATEGY",
      entityId: id,
      details: JSON.stringify({ newStatus: parsed.data.status }),
    });

    return NextResponse.json({ success: true, strategy: updated });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Administrator authorization required" }, { status: 403 });
    }
    console.error("POST /api/admin/strategies/[id]/status error:", error);
    return NextResponse.json({ error: "Failed to update strategy status" }, { status: 500 });
  }
}
