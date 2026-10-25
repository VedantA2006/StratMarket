import { db } from "@/lib/db";
import { PricingClient } from "./PricingClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscription Plans — StratMarket by Elvaris Capital",
  description: "Explore subscription tiers for individual trading strategies, all-access portfolio access, and institutional API routing.",
};

export default async function PricingPage() {
  const plans = await db.getPlans();

  return (
    <div className="page" id="p-pricing">
      <section className="b">
        <div className="wrap">
          <h2>Pricing</h2>
          <p className="lede">
            Plan structure preview. Commercial payment gateway can be configured with Stripe or Razorpay. You can activate a 7-day trial on any strategy right now.
          </p>
          <PricingClient plans={plans} />
        </div>
      </section>
    </div>
  );
}
