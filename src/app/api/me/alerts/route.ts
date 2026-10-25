import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { z } from "zod";

const AlertUpdateSchema = z.object({
  strategyId: z.string(),
  enabled: z.boolean(),
  alertTypes: z.array(z.string()).default(["ENTRY", "EXIT"]),
});

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await db.getUserAlertPreferences(user.id);
    const deliveries = await db.getUserDeliveries(user.id);

    return NextResponse.json({
      success: true,
      preferences,
      deliveries,
    });
  } catch (error: any) {
    console.error("GET /api/me/alerts error:", error);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = AlertUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid alert preference data" },
        { status: 400 }
      );
    }

    const { strategyId, enabled, alertTypes } = parsed.data;
    const updated = await db.setAlertPreference(user.id, strategyId, enabled, alertTypes);

    return NextResponse.json({
      success: true,
      message: "Alert preference updated.",
      preference: updated,
    });
  } catch (error: any) {
    console.error("PUT /api/me/alerts error:", error);
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
  }
}
