"use client";

import { StrategyChartContract, StrategyTradeBox } from "@/lib/strategy-execution";

interface Props {
  contract: StrategyChartContract | null;
  visible: boolean;
  showBoxes: boolean;
}

export function ChartFloatingHUD({ contract, visible, showBoxes }: Props) {
  if (!contract) return null;

  const isElite = contract.strategyId.toUpperCase().includes("PS-04");
  const isGrandmaster = contract.strategyId.toUpperCase().includes("PS-01");
  const strategyTitle = isElite
    ? "15M ELITE 80%+ SOVEREIGN"
    : isGrandmaster
    ? "15M GRANDMASTER DUAL-10R"
    : `${contract.strategyId} ${contract.name.toUpperCase()}`;

  const hudMetrics = contract.summary.hudMetrics || [];
  const sovereignGuards = contract.sovereignGuards || [];
  const recentTrades = (contract.tradeBoxes || []).slice(-4);

  return (
    <div className="chart-hud-overlay-root pointer-events-none">
      {/* Dual Performance HUD Tables (Exact TradingView Pine Script Parity) */}
      {visible && (
        <>
          {/* Top-Right Metrics Table */}
          <div className="tv-hud-top-right pointer-events-auto">
            <div className="tv-hud-table metrics-table">
              <div className="tv-hud-header">
                <span className="tv-hud-header-title">{strategyTitle}</span>
                <span className="tv-hud-header-sub">METRICS (TV ENGINE)</span>
              </div>
              <div className="tv-hud-body">
                {hudMetrics.map((m, idx) => (
                  <div key={idx} className="tv-hud-row">
                    <span className="tv-hud-label">{m.label}</span>
                    <span className="tv-hud-value" style={{ color: m.color || "#34d399" }}>
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom-Right Sovereign Guards Table */}
          {sovereignGuards.length > 0 && (
            <div className="tv-hud-bottom-right pointer-events-auto">
              <div className="tv-hud-table guards-table">
                <div className="tv-hud-header guards-header">
                  <span className="tv-hud-header-title guards-title">SOVEREIGN GUARDS</span>
                  <span className="tv-hud-header-sub guards-title">STATUS</span>
                </div>
                <div className="tv-hud-body">
                  {sovereignGuards.map((g, idx) => (
                    <div key={idx} className="tv-hud-row">
                      <span className="tv-hud-label">{g.label}</span>
                      <span className="tv-hud-value" style={{ color: g.color || "#34d399" }}>
                        {g.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
