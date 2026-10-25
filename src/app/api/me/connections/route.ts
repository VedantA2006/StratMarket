import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { z } from "zod";

const SUPPORTED_BROKERS = [
  { id: "ALPACA", name: "Alpaca Markets (US Equities & Crypto)", status: "AVAILABLE_PAPER" },
  { id: "BINANCE", name: "Binance (Spot & Futures)", status: "PREVIEW_ONLY" },
  { id: "INTERACTIVE_BROKERS", name: "Interactive Brokers (Global Multi-Asset)", status: "PREVIEW_ONLY" },
  { id: "PAPER_SIMULATOR", name: "Elvaris Virtual Paper Simulator (Zero Risk)", status: "AVAILABLE_LIVE" },
];

const ConnectionSchema = z.object({
  brokerIdentifier: z.enum(["ALPACA", "BINANCE", "INTERACTIVE_BROKERS", "PAPER_SIMULATOR"]),
  grantedScopes: z.array(z.string()).default(["READ_ONLY"]),
  isLive: z.boolean().default(false),
});

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connections = await db.getUserConnections(user.id);

    return NextResponse.json({
      success: true,
      supportedBrokers: SUPPORTED_BROKERS,
      connections,
      notice: "Real-money automated broker routing requires verified account credentials and KYC approval. Simulated paper trading is fully available.",
    });
  } catch (error: any) {
    console.error("GET /api/me/connections error:", error);
    return NextResponse.json({ error: "Failed to fetch connections" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ConnectionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid broker connection parameters", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { brokerIdentifier, grantedScopes, isLive } = parsed.data;

    // Safety rule: never permit live real-money execution unless specific integration is independently configured
    if (isLive && brokerIdentifier !== "PAPER_SIMULATOR") {
      return NextResponse.json(
        {
          error: "Live execution for this broker is currently in private beta and requires Elvaris Capital direct compliance onboarding. Please use Paper Trading Simulator for now.",
          code: "LIVE_EXECUTION_UNAVAILABLE",
        },
        { status: 403 }
      );
    }

    const connection = await db.saveTradingConnection(user.id, {
      brokerIdentifier,
      grantedScopes,
      isLive: brokerIdentifier === "PAPER_SIMULATOR" ? false : isLive,
    });

    return NextResponse.json({
      success: true,
      message: `Connection configured for ${brokerIdentifier}.`,
      connection,
    });
  } catch (error: any) {
    console.error("POST /api/me/connections error:", error);
    return NextResponse.json({ error: "Failed to configure connection" }, { status: 500 });
  }
}
