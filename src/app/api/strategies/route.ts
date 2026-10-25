import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const QuerySchema = z.object({
  q: z.string().optional(),
  instrument: z.string().optional(),
  timeframe: z.string().optional(),
  category: z.string().optional(),
  type: z.string().optional(),
  sort: z.enum(["name", "upd", "pf", "dd"]).optional().default("name"),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = QuerySchema.safeParse({
      q: searchParams.get("q") || undefined,
      instrument: searchParams.get("instrument") || undefined,
      timeframe: searchParams.get("timeframe") || undefined,
      category: searchParams.get("category") || undefined,
      type: searchParams.get("type") || undefined,
      sort: searchParams.get("sort") || "name",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { q, instrument, timeframe, category, type, sort } = parsed.data;

    const strategies = await db.getStrategies({
      query: q,
      instrument,
      timeframe,
      category,
      type,
      sort,
      includeDrafts: false,
    });

    return NextResponse.json({
      success: true,
      count: strategies.length,
      data: strategies,
    });
  } catch (error: any) {
    if (error?.digest === "NEXT_PRERENDER_INTERRUPTED") {
      throw error;
    }
    console.error("GET /api/strategies error:", error);
    return NextResponse.json({ error: "Failed to fetch strategies" }, { status: 500 });
  }
}
