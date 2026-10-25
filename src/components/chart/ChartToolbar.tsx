"use client";

import Link from "next/link";
import { useState } from "react";

interface Props {
  strategyId: string;
  strategyName: string;
  symbol: string;
  timeframe: string;
  candleCount: number;
  status: "LIVE" | "HISTORICAL" | "CONNECTING" | "ERROR";
  onTimeframeChange: (tf: string) => void;
  onTogglePanel: () => void;
  panelOpen: boolean;
  showBoxes: boolean;
  onToggleBoxes: () => void;
}

const TIMEFRAMES = [
  { label: "1m", value: "1" },
  { label: "5m", value: "5" },
  { label: "15m", value: "15" },
  { label: "1h", value: "60" },
  { label: "4h", value: "240" },
  { label: "1D", value: "D" },
];

const PINE_STRATEGIES = [
  { id: "PS-01", name: "Grandmaster", badge: "82.6% WR" },
  { id: "PS-02", name: "Apex", badge: "88.5% WR" },
  { id: "PS-03", name: "Strict 1:2 R:R", badge: "74.1% WR" },
  { id: "PS-04", name: "Elite", badge: "80.7% WR" },
];

export function ChartToolbar({
  strategyId,
  strategyName,
  symbol,
  timeframe,
  candleCount,
  status,
  onTimeframeChange,
  onTogglePanel,
  panelOpen,
  showBoxes,
  onToggleBoxes,
}: Props) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const isLive = status === "LIVE";

  return (
    <header className="chart-toolbar">
      <div className="chart-toolbar-left">
        <Link href="/market" className="chart-back-btn" title="Back to Marketplace">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="chart-brand">StratMarket</span>
        </Link>

        <div className="chart-divider" />

        <div className="chart-strategy-badge">
          <span className="chart-id-chip">{strategyId}</span>
          {strategyId.toUpperCase().startsWith("PS-") ? (
            <select
              className="chart-strategy-select"
              value={strategyId.toUpperCase()}
              onChange={(e) => {
                window.location.href = `/chart/${e.target.value}`;
              }}
              title="Switch Champion Pine Strategy Chart"
            >
              {PINE_STRATEGIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.badge})
                </option>
              ))}
            </select>
          ) : (
            <span className="chart-name-title">{strategyName}</span>
          )}
        </div>

        <div className="chart-symbol-badge">
          <span className="chart-symbol">{symbol}</span>
          <span className="chart-tf-tag">{timeframe}</span>
        </div>

        <div className="chart-bars-badge" title="Maximum historical dataset loaded">
          <span>{candleCount.toLocaleString()} Bars (Max)</span>
        </div>
      </div>

      <div className="chart-toolbar-center">
        <div className="chart-tf-group">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              className={`chart-tf-btn ${timeframe === tf.value || (timeframe === "M15" && tf.value === "15") || (timeframe === "M5" && tf.value === "5") ? "active" : ""}`}
              onClick={() => onTimeframeChange(tf.value)}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-toolbar-right">
        {/* Toggle On-Chart Position Tool Boxes */}
        <button
          className={`chart-toggle-pill ${showBoxes ? "active" : ""}`}
          onClick={onToggleBoxes}
          title="Toggle Visual Long/Short Position Tool Boxes on Chart"
        >
          <span className="pill-dot" />
          <span>Position Boxes</span>
        </button>


        <div className={`chart-status-pill ${isLive ? "live" : "connecting"}`}>
          <span className="chart-status-dot" />
          <span>{isLive ? "TradingView Live Feed" : "Connecting Feed..."}</span>
        </div>

        <button
          className={`chart-icon-btn ${panelOpen ? "active" : ""}`}
          onClick={onTogglePanel}
          title={panelOpen ? "Collapse Strategy Panel" : "Open Strategy Panel"}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
          <span className="chart-btn-label">Strategy</span>
        </button>

        <button
          className="chart-icon-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
