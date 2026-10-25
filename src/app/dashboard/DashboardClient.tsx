"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface TrialItem {
  id: string;
  strategyId: string;
  strategyName: string;
  instrument: string;
  timeframe: string;
  category: string;
  status: string;
  startTime: string;
  expiryTime: string;
  daysLeft: number;
  isExpired: boolean;
}

interface AlertPref {
  id: string;
  strategyId: string;
  enabled: boolean;
  alertTypes: string[];
}

interface DeliveryItem {
  id: string;
  signalId: string;
  deliveryStatus: string;
  sentAt?: string;
  providerMessageRef?: string;
}

interface ConnectionItem {
  id: string;
  brokerIdentifier: string;
  connectionStatus: string;
  grantedScopes: string[];
  isLive: boolean;
}

export function DashboardClient() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [trials, setTrials] = useState<TrialItem[]>([]);
  const [alerts, setAlerts] = useState<AlertPref[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingAlert, setUpdatingAlert] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const authRes = await fetch("/api/auth/me");
        const authData = await authRes.json();
        if (!authData.authenticated || !authData.user) {
          router.push("/signin");
          return;
        }
        setUser(authData.user);

        // Fetch entitlements & trials
        const entRes = await fetch("/api/me/entitlements");
        const entData = await entRes.json();
        if (entData.success) {
          setTrials(entData.trials || []);
        }

        // Fetch alert preferences & deliveries
        const alertRes = await fetch("/api/me/alerts");
        const alertData = await alertRes.json();
        if (alertData.success) {
          setAlerts(alertData.preferences || []);
          setDeliveries(alertData.deliveries || []);
        }

        // Fetch trading connections
        const connRes = await fetch("/api/me/connections");
        const connData = await connRes.json();
        if (connData.success) {
          setConnections(connData.connections || []);
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const toggleAlert = async (strategyId: string, currentEnabled: boolean) => {
    setUpdatingAlert(strategyId);
    try {
      const res = await fetch("/api/me/alerts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategyId,
          enabled: !currentEnabled,
          alertTypes: ["ENTRY", "EXIT"],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAlerts((prev) =>
          prev.map((a) => (a.strategyId === strategyId ? { ...a, enabled: !currentEnabled } : a))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingAlert(null);
    }
  };

  const connectSimulator = async () => {
    try {
      const res = await fetch("/api/me/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brokerIdentifier: "PAPER_SIMULATOR",
          grantedScopes: ["READ_ONLY", "TRADE_EXECUTION"],
          isLive: false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConnections((prev) => {
          const filtered = prev.filter((c) => c.brokerIdentifier !== "PAPER_SIMULATOR");
          return [...filtered, data.connection];
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="wrap" style={{ padding: "120px 24px", textAlign: "center" }}>
        <p className="note">Loading your trading dashboard...</p>
      </div>
    );
  }

  const activeTrials = trials.filter((t) => !t.isExpired && t.status === "ACTIVE");
  const expiredTrials = trials.filter((t) => t.isExpired || t.status === "EXPIRED");

  return (
    <div className="wrap" style={{ padding: "120px 24px 80px" }}>
      {/* User Header */}
      <div
        style={{
          borderBottom: "1px solid var(--line)",
          paddingBottom: "24px",
          marginBottom: "36px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <span className="badge py">Trader Account</span>
          <h1 style={{ fontSize: "36px", marginTop: "8px" }}>Welcome back, {user?.name}</h1>
          <p className="note" style={{ fontSize: "14px", marginTop: "4px" }}>
            {user?.email} · Role: {user?.role}
          </p>
        </div>
        <div>
          <Link href="/market" className="pill sm">
            + Explore new strategies
          </Link>
        </div>
      </div>

      {/* Grid of Dashboard Panels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
        {/* Active Trials Panel */}
        <div className="card" style={{ padding: "24px" }}>
          <h3>Active 7-Day Trials</h3>
          <p className="note">Server-enforced trial entitlements with countdown.</p>

          {activeTrials.length > 0 ? (
            <div style={{ display: "grid", gap: "12px", marginTop: "12px" }}>
              {activeTrials.map((t) => (
                <div
                  key={t.id}
                  style={{
                    border: "1px solid var(--line)",
                    borderRadius: "10px",
                    padding: "14px",
                    background: "var(--bg)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <b>{t.strategyName}</b>
                    <span className="badge py" style={{ color: "var(--up)" }}>
                      {t.daysLeft} days left
                    </span>
                  </div>
                  <div className="note" style={{ margin: "6px 0" }}>
                    {t.strategyId} · {t.instrument} · {t.timeframe} · {t.category}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--mut)" }}>
                    Expires: {new Date(t.expiryTime).toLocaleDateString()} at {new Date(t.expiryTime).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty" style={{ margin: "16px 0" }}>
              No active trials. Browse the marketplace to activate a 7-day trial on any strategy.
            </div>
          )}
        </div>

        {/* Email Signal Preferences Panel */}
        <div className="card" style={{ padding: "24px" }}>
          <h3>Email Signal Alerts</h3>
          <p className="note">Receive real-time trade signals generated by the Elvaris quant VPS.</p>

          {alerts.length > 0 ? (
            <div style={{ display: "grid", gap: "10px", marginTop: "12px" }}>
              {alerts.map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: "1px solid var(--line)",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    background: "var(--bg)",
                  }}
                >
                  <div>
                    <b>{a.strategyId}</b>
                    <div className="note">Types: Entry, Exit, Stop Loss</div>
                  </div>
                  <button
                    className={`chip ${a.enabled ? "on" : ""}`}
                    disabled={updatingAlert === a.strategyId}
                    onClick={() => toggleAlert(a.strategyId, a.enabled)}
                  >
                    {a.enabled ? "Alerts Active" : "Disabled"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty" style={{ margin: "16px 0" }}>
              No alert preferences configured yet. Starting a strategy trial automatically enables alerts.
            </div>
          )}

          <div style={{ marginTop: "16px" }}>
            <span className="note">Recent signal deliveries: {deliveries.length} records</span>
          </div>
        </div>

        {/* Broker & Execution Connections Panel */}
        <div className="card" style={{ padding: "24px" }}>
          <h3>Trading Connections</h3>
          <p className="note">Automated trade routing adapters (Zero raw API secret exposure).</p>

          <div style={{ marginTop: "12px", display: "grid", gap: "12px" }}>
            {connections.length > 0 ? (
              connections.map((c) => (
                <div
                  key={c.id}
                  style={{
                    border: "1px solid var(--line)",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    background: "var(--bg)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <b>{c.brokerIdentifier}</b>
                    <div className="note">
                      Status: {c.connectionStatus} · Scopes: {c.grantedScopes.join(", ")}
                    </div>
                  </div>
                  <span className="badge py">Connected</span>
                </div>
              ))
            ) : (
              <div className="empty" style={{ margin: "8px 0" }}>
                No active broker connections configured.
              </div>
            )}

            <button className="pill g sm" onClick={connectSimulator} style={{ marginTop: "8px" }}>
              Connect Virtual Paper Simulator
            </button>
            <span className="note">
              Live broker integrations (Alpaca / Interactive Brokers) require independent KYC verification.
            </span>
          </div>
        </div>

        {/* Expired Trials & Subscriptions */}
        {expiredTrials.length > 0 && (
          <div className="card" style={{ padding: "24px", gridColumn: "1 / -1" }}>
            <h3>Expired Trials</h3>
            <p className="note">The following 7-day trials have ended. Access has been revoked on the server.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px", marginTop: "12px" }}>
              {expiredTrials.map((t) => (
                <div
                  key={t.id}
                  style={{
                    border: "1px dashed var(--line)",
                    borderRadius: "10px",
                    padding: "14px",
                    background: "var(--bg)",
                    opacity: 0.7,
                  }}
                >
                  <b>{t.strategyName}</b>
                  <div className="note" style={{ margin: "4px 0" }}>
                    Expired on: {new Date(t.expiryTime).toLocaleDateString()}
                  </div>
                  <Link href="/pricing" className="pill g sm" style={{ marginTop: "8px", display: "inline-block" }}>
                    View Subscription Plans
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
