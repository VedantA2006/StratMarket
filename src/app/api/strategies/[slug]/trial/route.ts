import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to activate a 7-day trial. Please sign in or register." },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const strategy = await db.getStrategyBySlug(slug);

    if (!strategy) {
      return NextResponse.json({ error: "Strategy not found." }, { status: 404 });
    }

    if (!strategy.trialEligibility) {
      return NextResponse.json(
        { error: "This strategy is currently ineligible for trial access." },
        { status: 400 }
      );
    }

    // Attempt atomic trial creation with duplicate prevention
    try {
      const result = await db.startTrial(user.id, strategy.slug);

      return NextResponse.json({
        success: true,
        message: `7-day trial activated for ${strategy.name}.`,
        trial: {
          id: result.trial.id,
          strategyId: result.trial.strategyId,
          startTime: result.trial.startTime,
          expiryTime: result.trial.expiryTime,
          status: result.trial.status,
          daysRemaining: 7,
        },
        entitlement: {
          id: result.entitlement.id,
          status: result.entitlement.status,
          expiryTime: result.entitlement.expiryTime,
        },
      });
    } catch (err: any) {
      if (err.message === "TRIAL_ALREADY_USED") {
        return NextResponse.json(
          {
            error: "You have already used your 7-day trial for this strategy.",
            code: "TRIAL_ALREADY_USED",
          },
          { status: 409 }
        );
      }
      throw err;
    }
  } catch (error: any) {
    console.error("POST /api/strategies/[slug]/trial error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to start trial." },
      { status: 500 }
    );
  }
}
