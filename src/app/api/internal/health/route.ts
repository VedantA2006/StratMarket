import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const health = await db.getVpsHealthStatus();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      service: "StratMarket Integration Gateway",
      environment: process.env.NODE_ENV,
      ...health,
    });
  } catch (error: any) {
    console.error("GET /api/internal/health error:", error);
    return NextResponse.json({ error: "Failed to fetch health status" }, { status: 500 });
  }
}
