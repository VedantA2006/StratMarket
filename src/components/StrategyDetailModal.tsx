"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StrategySeedItem } from "@/lib/db/seed-data";

interface ModalProps {
  strategy: StrategySeedItem;
  onClose: () => void;
}

export function StrategyDetailModal({ strategy: s, onClose }: ModalProps) {
  const [activeTab, setActiveTab] = useState<"chart" | "alert" | "acct" | null>(null);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialMessage, setTrialMessage] = useState<string | null>(null);
  const [trialError, setTrialError] = useState<string | null>(null);
  const [trialActive, setTrialActive] = useState(false);
  const [tooltip, setTooltip] = useState<{ x: number; text: string; visible: boolean }>({
    x: 0,
    text: "",
    visible: false,
  });
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in & already has trial
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
          // Check strategy access
          fetch(`/api/strategies/${s.slug}`)
            .then((r) => r.json())
            .then((res) => {
              if (res.data?.userAccess?.hasAccess) {
                setTrialActive(true);
                setTrialMessage(
                  `Active ${res.data.userAccess.accessType} access: ${res.data.userAccess.daysRemaining} days remaining.`
                );
              }
            });
        }
      });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [s.slug, onClose]);

  const pth = (a: number[], w: number, h: number, mn: number, mx: number, p = 8) => {
    return a
      .map(
        (v, i) =>
          (i ? "L" : "M") +
          (p + (i * (w - 2 * p)) / (a.length - 1)).toFixed(1) +
          "," +
          (h - p - ((v - mn) / (mx - mn)) * (h - 2 * p)).toFixed(1)
      )
      .join("");
  };

  const handleStartTrial = async () => {
    if (!user) {
      router.push("/signin");
      return;
    }

    setTrialLoading(true);
    setTrialError(null);

    try {
      const res = await fetch(`/api/strategies/${s.slug}/trial`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setTrialError(data.error || "Failed to start trial.");
        return;
      }

      setTrialActive(true);
      setTrialMessage(`Trial active: 7 days full access granted until ${new Date(data.trial.expiryTime).toLocaleDateString()}.`);
    } catch {
      setTrialError("Network error while activating trial.");
    } finally {
      setTrialLoading(false);
    }
  };

  const eq = s.equitySeries || [];
  const mnEq = Math.min(...eq);
  const mxEq = Math.max(...eq);

  const dd = s.drawdownSeries || [];
  const mnDd = Math.min(...dd);
  const mxDd = Math.max(...dd);

  return (
    <div
      className="ov on"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains("ov")) onClose();
      }}
    >
      <div className="modal">
        <button className="x" aria-label="Close" onClick={onClose}>
          ×
        </button>

        <span className={`badge ${s.implementationType === "PYTHON" ? "py" : "pn"}`}>
          {s.implementationType === "PYTHON" ? "Python" : "Pine Script"}
        </span>{" "}
        <span className="note">
          {s.id} · {s.instrument} · {s.timeframe} · v{s.currentVersion}
        </span>

        <h2>{s.name}</h2>
        <p className="note" style={{ fontSize: "14px", marginTop: "4px" }}>
          {s.description}
        </p>

        {/* Key Performance Indicators */}
        <div className="kp">
          <div>
            Net return<b>{s.metrics.netReturn}%</b>
          </div>
          <div>
            Max drawdown<b>{s.metrics.maxDrawdown}%</b>
          </div>
          <div>
            Profit factor<b>{s.metrics.profitFactor}</b>
          </div>
          <div>
            Win rate<b>{s.metrics.winRate}%</b>
          </div>
        </div>

        <p className="note" style={{ marginTop: "10px" }}>
          *Illustrative demonstration data from Elvaris Capital research engine. Backtest period: {s.metrics.backtestPeriod}.
        </p>

        {/* Equity Curve SVG */}
        <div className="ch">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <b style={{ fontSize: "13px" }}>Equity curve (illustrative)</b>
            <span className="note">Sharpe: {s.metrics.sharpeRatio} · {s.metrics.totalTrades} Trades</span>
          </div>
          <div style={{ position: "relative" }}>
            <svg
              viewBox="0 0 700 150"
              preserveAspectRatio="none"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const index = Math.max(
                  0,
                  Math.min(eq.length - 1, Math.round(((e.clientX - rect.left) / rect.width) * (eq.length - 1)))
                );
                setTooltip({
                  x: Math.min(e.clientX - rect.left + 10, rect.width - 120),
                  text: `Bar ${index + 1}: ${eq[index]}`,
                  visible: true,
                });
              }}
              onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
            >
              <path
                d={pth(eq, 700, 150, mnEq, mxEq)}
                fill="none"
                stroke="var(--gold)"
                strokeWidth="2"
              />
            </svg>
            {tooltip.visible && (
              <div className="tip" style={{ display: "block", left: `${tooltip.x}px` }}>
                {tooltip.text}
              </div>
            )}
          </div>
        </div>

        {/* Drawdown Curve SVG */}
        <div className="ch">
          <b style={{ fontSize: "13px" }}>Drawdown % (illustrative)</b>
          <svg viewBox="0 0 700 150" preserveAspectRatio="none">
            <path
              d={`${pth(dd, 700, 150, mnDd, mxDd)}L692,142L8,142Z`}
              fill="var(--dn)"
              fillOpacity="0.2"
              stroke="var(--dn)"
              strokeWidth="2"
            />
          </svg>
        </div>

        <p className="note">
          Risk &amp; Methodology: {s.researchReport.riskRules} Known limitations: {s.researchReport.knownLimitations}
        </p>

        {/* Interactive Mode Tabs */}
        <div className="three" style={{ margin: "16px 0" }}>
          <button
            className={`fc ${activeTab === "chart" ? "border-gold" : ""}`}
            onClick={() => setActiveTab(activeTab === "chart" ? null : "chart")}
          >
            <h3>View on chart</h3>
            <p>Interactive signal markers</p>
          </button>
          <button
            className={`fc ${activeTab === "alert" ? "border-gold" : ""}`}
            onClick={() => setActiveTab(activeTab === "alert" ? null : "alert")}
          >
            <h3>Email alerts</h3>
            <p>Configured trade signals</p>
          </button>
          <button
            className={`fc ${activeTab === "acct" ? "border-gold" : ""}`}
            onClick={() => setActiveTab(activeTab === "acct" ? null : "acct")}
          >
            <h3>Connect account</h3>
            <p>Broker routing preview</p>
          </button>
        </div>

        {/* Dynamic Slot */}
        {activeTab === "chart" && (
          <div className="ch" style={{ animation: "pg 0.3s ease" }}>
            <b style={{ fontSize: "13px" }}>Signal Execution Trace</b>
            <svg viewBox="0 0 700 150" style={{ height: "130px", marginTop: "8px" }}>
              <path
                d={pth(eq.slice(0, 60), 700, 150, 95, 145, 12)}
                fill="none"
                stroke="var(--tx)"
                strokeWidth="1.5"
              />
              <path d="M200,105l-7,12h14z" fill="var(--gold)" />
              <path d="M430,45l-7,-12h14z" fill="var(--gold)" />
            </svg>
            <span className="note">▲ Buy entry · ▼ Sell exit plotted with 1.5% fixed ATR stop barrier.</span>
          </div>
        )}

        {activeTab === "alert" && (
          <div className="ch" style={{ animation: "pg 0.3s ease" }}>
            <b style={{ fontSize: "13px" }}>Email Signal Preferences</b>
            <div style={{ marginTop: "10px", display: "grid", gap: "8px", fontSize: "14px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input type="checkbox" defaultChecked /> Entry signals ({s.instrument} {s.timeframe})
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input type="checkbox" defaultChecked /> Exit &amp; Stop-loss adjustments
              </label>
              <span className="note">
                Alerts are delivered via Elvaris Transactional Queue to your verified email address.
              </span>
            </div>
          </div>
        )}

        {activeTab === "acct" && (
          <div className="ch" style={{ animation: "pg 0.3s ease" }}>
            <b style={{ fontSize: "13px" }}>Broker Account Connection (Preview)</b>
            <p className="note" style={{ marginTop: "6px" }}>
              Available adapters: Alpaca, Binance, Interactive Brokers, Virtual Paper Simulator.
            </p>
            <p className="note" style={{ color: "var(--gold)" }}>
              Status: Ready for sandbox configuration in your User Dashboard. Live trading requires KYC compliance.
            </p>
          </div>
        )}

        {trialMessage && <div className="ok">{trialMessage}</div>}
        {trialError && <div className="err" style={{ marginTop: "12px" }}>{trialError}</div>}

        <div style={{ marginTop: "20px", display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            className="pill"
            onClick={handleStartTrial}
            disabled={trialLoading || trialActive}
            style={{ opacity: trialActive ? 0.6 : 1 }}
          >
            {trialLoading ? "Activating..." : trialActive ? "Trial Active" : "Start 7-day trial"}
          </button>
          {!user && (
            <span className="note">
              No credit card required. Creates full access to reports &amp; signals.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
