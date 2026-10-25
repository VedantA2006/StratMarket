import { DashboardClient } from "./DashboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trader Dashboard — StratMarket by Elvaris Capital",
  description: "Manage your active 7-day trials, strategy entitlements, email trade alert feeds, and broker connections.",
};

export default function DashboardPage() {
  return (
    <div className="page" id="p-dashboard">
      <DashboardClient />
    </div>
  );
}
