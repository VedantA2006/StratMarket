"use client";

import { useState, useEffect } from "react";
import { DemoPreviewModal } from "./DemoPreviewModal";

const ALERTS_FEED = [
  "Entry signal · PY-03 · XAUUSD (Long)",
  "Exit signal · PS-02 · NAS100 (Take profit)",
  "Entry signal · PY-07 · EURUSD (Short)",
  "Stop-loss adjusted · PY-01 · BTCUSD",
];

export function ThreeWaysSection() {
  const [demoMessage, setDemoMessage] = useState<string | null>(null);
  const [currentAlerts, setCurrentAlerts] = useState<string[]>([
    "Entry signal · PY-03 · XAUUSD (Long)",
    "Exit signal · PS-02 · NAS100 (Take profit)",
  ]);

  useEffect(() => {
    let index = 2;
    const interval = setInterval(() => {
      const nextAlert = ALERTS_FEED[index % ALERTS_FEED.length];
      index++;
      setCurrentAlerts((prev) => [nextAlert, prev[0]]);
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="b" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <h2>Three ways to use a strategy.</h2>
        <p className="lede">
          Visual demonstrations of StratMarket integration modes. No emails are sent, no accounts connected, and no live trades placed without your explicit authorization.
        </p>

        <div className="three">
          {/* 1. View on chart */}
          <button
            className="fc"
            onClick={() =>
              setDemoMessage(
                "View on Chart: Interactive overlay that plots Elvaris quantitative entry, stop-loss, and target points directly against the historical candlestick series."
              )
            }
          >
            <svg viewBox="0 0 200 60">
              <path
                d="M0,50 C30,40 40,20 70,30 S120,50 150,20 S190,10 200,8"
                fill="none"
                stroke="var(--gold)"
                strokeWidth="2"
                pathLength="1"
                strokeDasharray="1"
                strokeDashoffset="1"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="1"
                  to="0"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
              </path>
            </svg>
            <h3>View on chart</h3>
            <p>See entries and exits plotted on price.</p>
          </button>

          {/* 2. Receive email alerts */}
          <button
            className="fc"
            onClick={() =>
              setDemoMessage(
                "Receive Email Alerts: StratMarket dispatches immediate notifications to your verified email within milliseconds of signal generation on the Elvaris VPS."
              )
            }
          >
            <div id="al" style={{ minHeight: "68px" }}>
              {currentAlerts.map((a, i) => (
                <div key={i} className="alert">
                  {a}
                </div>
              ))}
            </div>
            <h3>Receive email alerts</h3>
            <p>Get each signal as it is generated.</p>
          </button>

          {/* 3. Connect a trading account */}
          <button
            className="fc"
            onClick={() =>
              setDemoMessage(
                "Connect a Trading Account: Link your supported broker (Alpaca, Interactive Brokers, Binance) or use the zero-risk Virtual Paper Simulator to route signals automatically."
              )
            }
          >
            <svg viewBox="0 0 200 60">
              <circle cx="30" cy="30" r="10" fill="none" stroke="var(--tx)" />
              <circle cx="170" cy="30" r="10" fill="none" stroke="var(--tx)" />
              <line x1="40" y1="30" x2="160" y2="30" stroke="var(--line)" />
              <circle r="4" fill="var(--gold)" cy="30">
                <animate
                  attributeName="cx"
                  values="40;160;40"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
            <h3>Connect a trading account</h3>
            <p>Preview how execution would be linked.</p>
          </button>
        </div>
      </div>

      {demoMessage && (
        <DemoPreviewModal
          message={demoMessage}
          onClose={() => setDemoMessage(null)}
        />
      )}
    </section>
  );
}
