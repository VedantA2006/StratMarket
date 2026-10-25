import { AdminClient } from "./AdminClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administrative Console — StratMarket by Elvaris Capital",
  description: "Administrative console for managing strategies, runtime health, customer entitlements, and security logs.",
};

export default function AdminPage() {
  return (
    <div className="page" id="p-admin">
      <AdminClient />
    </div>
  );
}
