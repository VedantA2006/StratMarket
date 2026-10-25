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
