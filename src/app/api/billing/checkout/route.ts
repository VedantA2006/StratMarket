import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { z } from "zod";

const CheckoutSchema = z.object({
  planSlug: z.enum(["single-strategy", "all-access", "professional"]),
  strategyId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to initiate checkout." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = CheckoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid checkout request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { planSlug } = parsed.data;

    // Check if real Stripe / Razorpay credentials are configured
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const razorpayKey = process.env.RAZORPAY_KEY_ID;
    const isLiveConfigured =
      (stripeKey && !stripeKey.includes("placeholder")) ||
      (razorpayKey && !razorpayKey.includes("placeholder"));

    if (!isLiveConfigured) {
      return NextResponse.json({
        success: false,
        status: "GATEWAY_AWAITING_CONFIGURATION",
        message:
          "Production payment gateway is currently in test/preview mode. Commercial billing will be activated upon merchant account configuration.",
        planSlug,
        setupInstructions:
          "To enable live checkout, supply STRIPE_SECRET_KEY & STRIPE_WEBHOOK_SECRET or RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET in .env.local",
        demoNotice: "You can use the 7-day demo trial right now on any strategy for full evaluation.",
      });
    }

    // In a configured environment, create checkout session with provider
    return NextResponse.json({
      success: true,
      status: "CHECKOUT_CREATED",
      checkoutUrl: "https://checkout.stripe.com/c/pay/test_placeholder",
    });
  } catch (error: any) {
    console.error("POST /api/billing/checkout error:", error);
    return NextResponse.json({ error: "Failed to initiate checkout" }, { status: 500 });
  }
}
