"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ChartToolbar } from "./ChartToolbar";
import { StrategyStatusPanel } from "./StrategyStatusPanel";
import { StrategyChartContract } from "@/lib/strategy-execution";
import { MarketCandle } from "@/lib/market-data";

interface Props {
  strategyId: string;
}

export function StrategyChart({ strategyId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<any>(null);

  const [contract, setContract] = useState<StrategyChartContract | null>(null);
  const [candles, setCandles] = useState<MarketCandle[]>([]);
  const [timeframe, setTimeframe] = useState<string>("15");
  const [status, setStatus] = useState<"LIVE" | "HISTORICAL" | "CONNECTING" | "ERROR">("CONNECTING");
  const [error, setError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  // Fetch candle history and strategy execution contract
  const loadChartData = useCallback(async (tf: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/chart/${strategyId}/series?count=300&timeframe=${tf}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to load strategy chart series");
      }

      setContract(data.contract);
      setCandles(data.candles || []);
      setStatus("LIVE");
    } catch (err: any) {
      console.error("[StrategyChart] Data load error:", err);
      setError(err?.message || "Failed to load market data");
      setStatus("ERROR");
    } finally {
      setLoading(false);
    }
  }, [strategyId]);

  // Initial load
  useEffect(() => {
    loadChartData(timeframe);
  }, [loadChartData, timeframe]);

  // Mount Vela workspace when candles and container are ready
  useEffect(() => {
    if (!containerRef.current || candles.length === 0 || loading) return;

    let disposed = false;

    async function initVela() {
      try {
        // Destroy prior instance if present
        if (workspaceRef.current) {
          workspaceRef.current.destroy();
          workspaceRef.current = null;
        }

        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }

        const { VelaWorkspace } = await import("@luxalgo/vela/workspace");

        if (disposed || !containerRef.current) return;

        const ws = new VelaWorkspace(containerRef.current, {
          layout: false, // Single-chart professional mode
          theme: "dark",
          symbol: contract?.symbol || "XAUUSD",
          timeframe: timeframe,
          live: true,
          volume: true,
          drawingToolbar: true,
          cells: {
            c1: {
              symbol: contract?.symbol || "XAUUSD",
              timeframe: timeframe,
              data: candles,
            },
          },
        });

        workspaceRef.current = ws;
      } catch (err: any) {
        console.warn("[StrategyChart] Vela WebGL initialization warning:", err?.message || err);
      }
    }

    initVela();

    return () => {
      disposed = true;
      if (workspaceRef.current) {
        try {
          workspaceRef.current.destroy();
        } catch (_) {}
        workspaceRef.current = null;
      }
    };
  }, [candles, timeframe, loading, contract?.symbol]);

  // Periodic live candle updates (every 6 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/market-data/candles?symbol=${contract?.symbol || "XAUUSD"}&timeframe=${timeframe}&count=50`);
        const data = await res.json();
        if (data.success && data.candles?.length > 0) {
          setCandles((prev) => {
            if (prev.length === 0) return data.candles;
            const updated = [...prev];
            const latestIncoming = data.candles[data.candles.length - 1];
            const lastExisting = updated[updated.length - 1];

            if (latestIncoming.time === lastExisting.time) {
              // Update forming bar in place
              updated[updated.length - 1] = latestIncoming;
            } else if (latestIncoming.time > lastExisting.time) {
              // Append newly opened bar
              updated.push(latestIncoming);
            }
            return updated;
          });
          setStatus("LIVE");
        }
      } catch (e) {
        console.warn("[StrategyChart] Live update poll failed:", e);
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [contract?.symbol, timeframe]);

  const handleTimeframeChange = (newTf: string) => {
    setTimeframe(newTf);
  };

  return (
    <div className="chart-layout-root">
      {/* Trading Terminal Topbar */}
      <ChartToolbar
        strategyId={contract?.strategyId || strategyId}
        strategyName={contract?.name || "Pine Script Strategy"}
        symbol={contract?.symbol || "XAUUSD"}
        timeframe={timeframe === "15" ? "M15" : timeframe === "5" ? "M5" : timeframe}
        status={status}
        onTimeframeChange={handleTimeframeChange}
        onTogglePanel={() => setPanelOpen((prev) => !prev)}
        panelOpen={panelOpen}
      />

      <div className="chart-main-body">
        {/* Main Chart Stage */}
        <div className="chart-canvas-wrapper">
          {loading && (
            <div className="chart-loading-overlay">
              <div className="chart-spinner" />
              <p>Streaming authoritative TradingView market data for {strategyId}...</p>
            </div>
          )}

          {error && (
            <div className="chart-error-banner">
              <p>⚠️ {error}</p>
              <button className="chart-retry-btn" onClick={() => loadChartData(timeframe)}>
                Retry Connection
              </button>
            </div>
          )}

          <div
            id="vela-container"
            ref={containerRef}
            className="vela-container"
            style={{ width: "100%", height: "100%", position: "relative" }}
          />
        </div>

        {/* Collapsible Strategy Panel */}
        <StrategyStatusPanel
          contract={contract}
          onClose={() => setPanelOpen(false)}
          isOpen={panelOpen}
          candleCount={candles.length}
        />
      </div>
    </div>
  );
}
