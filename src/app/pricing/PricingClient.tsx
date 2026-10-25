"use client";

import { useState } from "react";
import { DemoPreviewModal } from "@/components/DemoPreviewModal";

interface PlanItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceDisplay: string;
  features: string[];
  isHot: boolean;
}

interface Props {
  plans: PlanItem[];
}

export function PricingClient({ plans }: Props) {
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  const handleSelectPlan = async (plan: PlanItem) => {
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug: plan.slug }),
      });
      const data = await res.json();

      if (data.status === "GATEWAY_AWAITING_CONFIGURATION") {
        setModalMessage(
          `${plan.name} Plan: Commercial billing gateway is currently in preview mode. You can start a full-featured 7-day trial immediately on any strategy in the marketplace!`
        );
      } else if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setModalMessage(data.error || "Please sign in to select a subscription plan.");
      }
    } catch {
      setModalMessage("Commercial payment gateway is awaiting merchant setup. Try a 7-day trial now!");
    }
  };

  return (
    <>
      <div className="plans">
        {plans.map((p) => (
          <div key={p.id} className={`plan ${p.isHot ? "hot" : ""}`}>
            <h3>{p.name}</h3>
            <b>{p.priceDisplay}</b>
            <p className="note" style={{ margin: "2px 0 10px" }}>{p.description}</p>
            <ul>
              {p.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <button
              className={`pill ${p.isHot ? "" : "g"}`}
              onClick={() => handleSelectPlan(p)}
            >
              Choose plan
            </button>
          </div>
        ))}
      </div>

      {modalMessage && (
        <DemoPreviewModal
          title="Plan Selection"
          message={modalMessage}
          onClose={() => setModalMessage(null)}
        />
      )}
    </>
  );
}
