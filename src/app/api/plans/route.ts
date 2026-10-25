import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const plans = await db.getPlans();
    return NextResponse.json({
      success: true,
      data: plans,
      currency: "USD",
      billingNote: "Pricing structure preview. Commercial payment gateway integrations can be toggled via environment configuration.",
    });
  } catch (error: any) {
    console.error("GET /api/plans error:", error);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}
