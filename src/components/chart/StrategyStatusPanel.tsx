"use client";

import Link from "next/link";
import { StrategyChartContract } from "@/lib/strategy-execution";

interface Props {
  contract: StrategyChartContract | null;
  onClose: () => void;
  isOpen: boolean;
  candleCount: number;
}

export function StrategyStatusPanel({ contract, onClose, isOpen, candleCount }: Props) {
  if (!isOpen || !contract) return null;

  const isPine = contract.implementationType === "PINE_SCRIPT";

  return (
    <aside className="chart-side-panel">
      <div className="panel-header">
        <div className="panel-title-group">
          <span className="panel-id-badge">{contract.strategyId}</span>
          <h3>{contract.name}</h3>
        </div>
        <button className="panel-close-btn" onClick={onClose} aria-label="Close panel">
          ✕
        </button>
      </div>

      <div className="panel-content">
        {/* Strategy Meta */}
        <div className="panel-section">
          <div className="panel-row">
            <span className="label">Platform</span>
            <span className="value-pine">{isPine ? "🌲 Pine Script v5" : "🐍 Python MT5"}</span>
          </div>
          <div className="panel-row">
            <span className="label">Asset & Timeframe</span>
            <span className="value">{contract.symbol} · {contract.timeframe}</span>
          </div>
          <div className="panel-row">
            <span className="label">Category</span>
            <span className="value">{contract.category}</span>
          </div>
          <div className="panel-row">
            <span className="label">Bars Loaded</span>
            <span className="value">{candleCount} real broker bars</span>
          </div>
        </div>

        {/* Private Execution Architecture */}
        <div className="panel-section">
          <div className="section-title">Execution Security</div>
          <div className="security-card">
            <div className="security-header">
              <span className="security-icon">🛡️</span>
              <span className="security-text">Private Execution Boundary</span>
            </div>
            <p className="security-desc">
              Strategy computed in private server environment. Source code is strictly isolated and never transmitted to the browser.
            </p>
            <div className="security-status-badge">
              <span className="status-indicator" />
              <span>{contract.summary.state}</span>
            </div>
          </div>
        </div>

        {/* Latest Signal Engine State */}
        {contract.summary.latestSignal && (
          <div className="panel-section">
            <div className="section-title">Engine Signal State</div>
            <div
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid #1f1f23",
                borderRadius: "8px",
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    textTransform: "uppercase",
                    backgroundColor:
                      contract.summary.latestSignal.direction === "BUY"
                        ? "rgba(16, 185, 129, 0.15)"
                        : contract.summary.latestSignal.direction === "SELL"
                        ? "rgba(239, 68, 68, 0.15)"
                        : "rgba(148, 163, 184, 0.15)",
                    color:
                      contract.summary.latestSignal.direction === "BUY"
                        ? "#10b981"
                        : contract.summary.latestSignal.direction === "SELL"
                        ? "#ef4444"
                        : "#94a3b8",
                    border: `1px solid ${
                      contract.summary.latestSignal.direction === "BUY"
                        ? "rgba(16, 185, 129, 0.3)"
                        : contract.summary.latestSignal.direction === "SELL"
                        ? "rgba(239, 68, 68, 0.3)"
                        : "rgba(148, 163, 184, 0.3)"
                    }`,
                  }}
                >
                  {contract.summary.latestSignal.direction}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#ffffff",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  ${contract.summary.latestSignal.price.toFixed(2)}
                </span>
              </div>
              <p
                style={{
                  fontSize: "11.5px",
                  color: "#a1a1aa",
                  margin: 0,
                  lineHeight: 1.45,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {contract.summary.latestSignal.label}
              </p>
            </div>
          </div>
        )}

        {/* Institutional HUD Metrics (Pine Script TV Engine Sync) */}
        {contract.summary.hudMetrics && contract.summary.hudMetrics.length > 0 && (
          <div className="panel-section">
            <div className="section-title">Institutional HUD Metrics</div>
            <div className="hud-metrics-list">
              {contract.summary.hudMetrics.map((m, idx) => (
                <div key={idx} className="panel-row">
                  <span className="label">{m.label}</span>
                  <span className="value" style={{ color: m.color || "#4cc79a" }}>
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk & Rules */}
        <div className="panel-section">
          <div className="section-title">Risk Governance & Payoff</div>
          <div className="risk-grid">
            <div className="risk-box">
              <span className="risk-label">Target Payoff (TP)</span>
              <span className="risk-val-tp">{contract.summary.riskParameters.takeProfit || "+$18.00"}</span>
            </div>
            <div className="risk-box">
              <span className="risk-label">Max Risk Stop (SL)</span>
              <span className="risk-val-sl">{contract.summary.riskParameters.stopLoss || "-$14.00"}</span>
            </div>
          </div>
          <p className="risk-rules-text">{contract.summary.riskParameters.rules}</p>
        </div>

        {/* Plotted Overlays on Chart */}
        <div className="panel-section">
          <div className="section-title">Plotted Overlays ({contract.series.length})</div>
          <div className="overlays-list">
            {contract.series.map((s) => (
              <div key={s.id} className="overlay-item">
                <span className="overlay-color-chip" style={{ backgroundColor: s.color }} />
                <span className="overlay-name">{s.name}</span>
              </div>
            ))}
            {contract.priceLevels.map((lvl) => (
              <div key={lvl.name} className="overlay-item">
                <span
                  className="overlay-color-chip"
                  style={{
                    backgroundColor: lvl.color,
                    borderStyle: lvl.style,
                    borderWidth: 1,
                  }}
                />
                <span className="overlay-name">
                  {lvl.name}: ${lvl.price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="panel-section panel-actions">
          <Link
            href={`/strategies/${contract.strategyId.toLowerCase()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="panel-btn-report"
          >
            Open Audited Performance Report ↗
          </Link>
          <Link href="/market" className="panel-btn-back">
            Return to Marketplace
          </Link>
        </div>
      </div>
    </aside>
  );
}
