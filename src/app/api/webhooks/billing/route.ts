import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("stripe-signature") || request.headers.get("x-razorpay-signature");
    const rawBody = await request.text();

    if (!signature) {
      return NextResponse.json({ error: "Missing webhook signature" }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    if (!webhookSecret || webhookSecret.includes("placeholder")) {
      return NextResponse.json(
        { error: "Payment webhook secret not configured on server" },
        { status: 500 }
      );
    }

    // Parse event safely
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Idempotent event check via audit logs
    const eventId = event.id || event.event_id;
    if (eventId) {
      const existing = (await db.getAuditEvents(100)).find(
        (a) => a.action === "BILLING_WEBHOOK_PROCESSED" && a.entityId === eventId
      );
      if (existing) {
        return NextResponse.json({ received: true, note: "Duplicate webhook event ignored" });
      }
    }

    await db.createAuditEvent({
      action: "BILLING_WEBHOOK_PROCESSED",
      entityType: "BILLING",
      entityId: eventId,
      details: JSON.stringify({ type: event.type || event.event }),
    });

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("POST /api/webhooks/billing error:", error);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}
