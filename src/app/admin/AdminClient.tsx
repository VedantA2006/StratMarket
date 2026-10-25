"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StrategySeedItem } from "@/lib/db/seed-data";

interface AdminStats {
  totalUsers: number;
  totalStrategies: number;
  pythonStrategies: number;
  pineStrategies: number;
  signalsIngested: number;
}

interface VpsRuntimeHealth {
  vpsEndpoint: string;
  status: string;
  isMockMode: boolean;
  lastSignalReceived: string | null;
  lastSignalAgeMinutes: number | null;
  registeredStrategiesCount: number;
  vpsConfigured: boolean;
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  accountStatus: string;
  activeTrialsCount: number;
  activeEntitlementsCount: number;
  connectionsCount: number;
  createdAt: string;
}

export function AdminClient() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [vpsHealth, setVpsHealth] = useState<VpsRuntimeHealth | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [strategies, setStrategies] = useState<StrategySeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"strategies" | "runtime" | "customers" | "audit">("strategies");
  const router = useRouter();

  useEffect(() => {
    async function fetchAdminData() {
      try {
        const authRes = await fetch("/api/auth/me");
        const authData = await authRes.json();
        if (!authData.authenticated || authData.user?.role !== "ADMIN") {
          setError("Administrator privilege required. Please sign in as an admin.");
          setLoading(false);
          return;
        }

        const overviewRes = await fetch("/api/admin/overview");
        const overviewData = await overviewRes.json();
        if (overviewData.success) {
          setStats(overviewData.stats);
          setVpsHealth(overviewData.vpsRuntime);
          setAuditLogs(overviewData.recentAuditLogs || []);
        }

        const usersRes = await fetch("/api/admin/users");
        const usersData = await usersRes.json();
        if (usersData.success) {
          setUsers(usersData.data || []);
        }

        const stratRes = await fetch("/api/strategies");
        const stratData = await stratRes.json();
        if (stratData.success) {
          setStrategies(stratData.data || []);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load administrative console.");
      } finally {
        setLoading(false);
      }
    }

    fetchAdminData();
  }, []);

  const toggleStrategyStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "PUBLIC" ? "PRIVATE" : "PUBLIC";
    try {
      const res = await fetch(`/api/admin/strategies/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setStrategies((prev) =>
          prev.map((s) => (s.id === id ? { ...s, visibilityStatus: newStatus } : s))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="wrap" style={{ padding: "120px 24px", textAlign: "center" }}>
        <p className="note">Authenticating administrative credentials...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wrap" style={{ padding: "120px 24px", textAlign: "center" }}>
        <h2 style={{ color: "var(--dn)" }}>Access Restricted</h2>
        <p className="note" style={{ margin: "16px 0 24px" }}>{error}</p>
        <button className="pill" onClick={() => router.push("/signin")}>
          Sign in as Administrator
        </button>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ padding: "120px 24px 80px" }}>
      {/* Admin Header */}
      <div
        style={{
          borderBottom: "1px solid var(--line)",
          paddingBottom: "24px",
          marginBottom: "32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <span className="badge pn" style={{ borderColor: "var(--gold)", color: "var(--gold)" }}>
            Elvaris Capital Core System
          </span>
          <h1 style={{ fontSize: "36px", marginTop: "8px" }}>StratMarket Administration</h1>
          <p className="note" style={{ fontSize: "14px", marginTop: "4px" }}>
            Operational monitoring, Python VPS gateway management, customer entitlements, and security audits.
          </p>
        </div>
      </div>

      {/* KPI Overview Grid */}
      {stats && (
        <div className="kp" style={{ marginBottom: "32px" }}>
          <div>
            Registered Traders<b>{stats.totalUsers}</b>
          </div>
          <div>
            Total Strategies<b>{stats.totalStrategies}</b>
          </div>
          <div>
            Python / Pine<b>{stats.pythonStrategies} / {stats.pineStrategies}</b>
          </div>
          <div>
            Signals Processed<b>{stats.signalsIngested}</b>
          </div>
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <div className="chips" style={{ marginBottom: "24px" }}>
        <button
          className={`chip ${activeTab === "strategies" ? "on" : ""}`}
          onClick={() => setActiveTab("strategies")}
        >
          Strategy Management ({strategies.length})
        </button>
        <button
          className={`chip ${activeTab === "runtime" ? "on" : ""}`}
          onClick={() => setActiveTab("runtime")}
        >
          VPS Runtime &amp; Signals
        </button>
        <button
          className={`chip ${activeTab === "customers" ? "on" : ""}`}
          onClick={() => setActiveTab("customers")}
        >
          Customer Access ({users.length})
        </button>
        <button
          className={`chip ${activeTab === "audit" ? "on" : ""}`}
          onClick={() => setActiveTab("audit")}
        >
          Audit Log ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Strategy Management */}
      {activeTab === "strategies" && (
        <div className="card" style={{ padding: "24px" }}>
          <h3>Catalogue Inventory &amp; Publication</h3>
          <p className="note" style={{ marginBottom: "16px" }}>
            Control visibility status. Private or Draft strategies are immediately hidden from public visitors.
          </p>

          <div style={{ display: "grid", gap: "10px" }}>
            {strategies.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "1px solid var(--line)",
                  borderRadius: "10px",
                  padding: "14px",
                  background: "var(--bg)",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span className={`badge ${s.implementationType === "PYTHON" ? "py" : "pn"}`}>
                      {s.implementationType}
                    </span>
                    <b>{s.id}: {s.name}</b>
                  </div>
                  <div className="note" style={{ marginTop: "4px" }}>
                    {s.instrument} · {s.timeframe} · {s.category} · Return: {s.metrics.netReturn}% · Max DD: {s.metrics.maxDrawdown}%
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span className={`badge ${s.visibilityStatus === "PUBLIC" ? "py" : "pn"}`}>
                    {s.visibilityStatus}
                  </span>
                  <button
                    className="chip"
                    onClick={() => toggleStrategyStatus(s.id, s.visibilityStatus)}
                  >
                    {s.visibilityStatus === "PUBLIC" ? "Make Private" : "Publish Public"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: VPS Runtime & Health */}
      {activeTab === "runtime" && vpsHealth && (
        <div style={{ display: "grid", gap: "24px" }}>
          <div className="card" style={{ padding: "24px" }}>
            <h3>Python Strategy VPS Runtime Monitor</h3>
            <p className="note" style={{ marginBottom: "16px" }}>
              Direct integration boundary with the Elvaris Capital execution environment.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
              <div style={{ border: "1px solid var(--line)", borderRadius: "10px", padding: "14px", background: "var(--bg)" }}>
                <span className="note">VPS Endpoint</span>
                <b style={{ display: "block", fontSize: "14px", marginTop: "4px", wordBreak: "break-all" }}>
                  {vpsHealth.vpsEndpoint}
                </b>
              </div>
              <div style={{ border: "1px solid var(--line)", borderRadius: "10px", padding: "14px", background: "var(--bg)" }}>
                <span className="note">Connection State</span>
                <b style={{ display: "block", fontSize: "14px", marginTop: "4px", color: "var(--gold)" }}>
                  {vpsHealth.status}
                </b>
              </div>
              <div style={{ border: "1px solid var(--line)", borderRadius: "10px", padding: "14px", background: "var(--bg)" }}>
                <span className="note">Last Ingested Signal</span>
                <b style={{ display: "block", fontSize: "14px", marginTop: "4px" }}>
                  {vpsHealth.lastSignalReceived
                    ? `${new Date(vpsHealth.lastSignalReceived).toLocaleTimeString()} (${vpsHealth.lastSignalAgeMinutes}m ago)`
                    : "No signals received yet"}
                </b>
              </div>
              <div style={{ border: "1px solid var(--line)", borderRadius: "10px", padding: "14px", background: "var(--bg)" }}>
                <span className="note">HMAC Shared Secret</span>
                <b style={{ display: "block", fontSize: "14px", marginTop: "4px", color: vpsHealth.vpsConfigured ? "var(--up)" : "var(--dn)" }}>
                  {vpsHealth.vpsConfigured ? "Configured & Active" : "Missing secret"}
                </b>
              </div>
            </div>

            <div className="note" style={{ marginTop: "16px", padding: "12px", border: "1px dashed var(--line)", borderRadius: "8px" }}>
              Integration Note: Next.js does not run Python strategy loops. All incoming signals to <code>POST /api/internal/signals</code> are verified using HMAC SHA-256 signatures, validated for timestamp drift, and deduplicated via unique sourceEventId.
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Customer Access */}
      {activeTab === "customers" && (
        <div className="card" style={{ padding: "24px" }}>
          <h3>Customer Entitlements &amp; Accounts</h3>
          <p className="note" style={{ marginBottom: "16px" }}>
            Audit active trials and broker connection scopes for registered users.
          </p>

          <div style={{ display: "grid", gap: "10px" }}>
            {users.map((u) => (
              <div
                key={u.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "1px solid var(--line)",
                  borderRadius: "10px",
                  padding: "14px",
                  background: "var(--bg)",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <b>{u.name}</b>
                    <span className="badge py">{u.role}</span>
                  </div>
                  <div className="note" style={{ marginTop: "4px" }}>
                    {u.email} · Account: {u.accountStatus} · Joined {new Date(u.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", fontSize: "13px" }}>
                  <span>Active trials: <b>{u.activeTrialsCount}</b></span>
                  <span>Connections: <b>{u.connectionsCount}</b></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === "audit" && (
        <div className="card" style={{ padding: "24px" }}>
          <h3>Security &amp; Operational Audit Trail</h3>
          <p className="note" style={{ marginBottom: "16px" }}>
            Immutable event log tracking logins, trial activations, webhook signals, and administrative mutations.
          </p>

          <div style={{ display: "grid", gap: "8px" }}>
            {auditLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "1px solid var(--line)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  background: "var(--bg)",
                }}
              >
                <div>
                  <span className="badge pn" style={{ marginRight: "8px" }}>
                    {log.action}
                  </span>
                  <span>{log.details || log.entityType}</span>
                </div>
                <span className="note">{new Date(log.createdAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
