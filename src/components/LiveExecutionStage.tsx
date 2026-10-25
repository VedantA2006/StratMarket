"use client";

import { useEffect, useState, useMemo } from "react";

interface Candle {
  open: number;
  close: number;
  high: number;
  low: number;
}

export function LiveExecutionStage() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentPrice, setCurrentPrice] = useState(2654.8);

  useEffect(() => {
    // Generate initial 55 candles
    let px = 2640.0;
    const initial: Candle[] = [];
    for (let i = 0; i < 55; i++) {
      const open = px;
      const drift = (Math.random() - 0.48) * 4.2;
      const close = +(open + drift).toFixed(2);
      px = close;
      const high = +(Math.max(open, close) + Math.random() * 2.5).toFixed(2);
      const low = +(Math.min(open, close) - Math.random() * 2.5).toFixed(2);
      initial.push({ open, close, high, low });
    }
    setCandles(initial);
    setCurrentPrice(px);

    // Live real-time tick addition
    const interval = setInterval(() => {
      setCandles((prev) => {
        if (!prev.length) return prev;
        const last = prev[prev.length - 1];
        const open = last.close;
        const drift = (Math.random() - 0.47) * 3.8;
        const close = +(open + drift).toFixed(2);
        const high = +(Math.max(open, close) + Math.random() * 2.2).toFixed(2);
        const low = +(Math.min(open, close) - Math.random() * 2.2).toFixed(2);
        const next = [...prev.slice(1), { open, close, high, low }];
        setCurrentPrice(close);
        return next;
      });
    }, 2400);

    return () => clearInterval(interval);
  }, []);

  const svgData = useMemo(() => {
    if (!candles.length) return null;
    const all = candles.flatMap((c) => [c.low, c.high]);
    const mn = Math.min(...all);
    const mx = Math.max(...all);
    const range = mx - mn || 1;
    const height = 300;
    const width = 1000;
    const w = width / candles.length;

    const y = (v: number) => 25 + ((mx - v) / range) * (height - 50);

    const elements = candles.map((c, i) => {
      const isUp = c.close >= c.open;
      const color = isUp ? "#ffffff" : "#666666";
      const fill = isUp ? "#ffffff" : "#0a0a0a";
      const x = i * w + 2;
      const bodyTop = y(Math.max(c.open, c.close));
      const bodyHeight = Math.max(2, Math.abs(y(c.open) - y(c.close)));
      const wickX = x + w / 2 - 1.5;

      return {
        wickX,
        wickY1: y(c.high),
        wickY2: y(c.low),
        bodyX: x,
        bodyY: bodyTop,
        bodyW: Math.max(2, w - 4),
        bodyH: bodyHeight,
        color,
        fill,
      };
    });

    const lastCandle = candles[candles.length - 1];
    const lastY = y(lastCandle.close);

    // Simulated algorithmic signal markers
    const signalMarkers = [
      { index: 14, isBuy: true, label: "ENTRY LONG" },
      { index: 32, isBuy: false, label: "EXIT TP" },
      { index: 46, isBuy: true, label: "ENTRY LONG" },
    ];

    return { elements, lastY, signalMarkers, y, w };
  }, [candles]);

  return (
    <div className="stage">
      <div className="sb">
        <b>XAUUSD · H1</b>
        <span>Spread: 0.12 pts</span>
        <span>Model: Volatility Breakout v1.2</span>
        <span className="live">LIVE EXECUTION ENGINE</span>
      </div>

      <div style={{ position: "relative", width: "100%", height: "260px", background: "var(--bg2)" }}>
        {svgData && (
          <svg
            viewBox="0 0 1000 300"
            preserveAspectRatio="none"
            style={{ width: "100%", height: "100%", display: "block" }}
          >
            {/* Grid lines */}
            <line x1="0" x2="1000" y1="75" y2="75" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
            <line x1="0" x2="1000" y1="150" y2="150" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
            <line x1="0" x2="1000" y1="225" y2="225" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />

            {/* Candlesticks */}
            {svgData.elements.map((el, i) => (
              <g key={i}>
                <line
                  x1={el.wickX}
                  x2={el.wickX}
                  y1={el.wickY1}
                  y2={el.wickY2}
                  stroke={el.color}
                  strokeWidth="1.2"
                />
                <rect
                  x={el.bodyX}
                  y={el.bodyY}
                  width={el.bodyW}
                  height={el.bodyH}
                  fill={el.fill}
                  stroke={el.color}
                  strokeWidth="1.2"
                  rx="1"
                />
              </g>
            ))}

            {/* Dynamic Gold Price Line */}
            <line
              x1="0"
              x2="1000"
              y1={svgData.lastY}
              y2={svgData.lastY}
              stroke="var(--gold)"
              strokeDasharray="4 4"
              strokeWidth="1.2"
            />
            <text
              x="988"
              y={svgData.lastY - 6}
              textAnchor="end"
              fill="var(--gold)"
              fontSize="12"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="600"
            >
              ${currentPrice.toFixed(2)}
            </text>

            {/* Algorithmic Execution Arrows */}
            {svgData.signalMarkers.map((sig, i) => {
              const candle = candles[sig.index];
              if (!candle) return null;
              const x = sig.index * svgData.w + svgData.w / 2 - 1.5;
              const y = sig.isBuy ? svgData.y(candle.low) + 16 : svgData.y(candle.high) - 16;
              const pathD = sig.isBuy
                ? `M${x},${y - 8}l-6,11h12z`
                : `M${x},${y + 8}l-6,-11h12z`;

              return (
                <g key={i}>
                  <path d={pathD} fill="var(--gold)" />
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
