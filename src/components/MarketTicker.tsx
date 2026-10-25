"use client";

import { useEffect, useState } from "react";

interface TickerItem {
  symbol: string;
  price: string;
  change: string;
  isUp: boolean;
}

const INITIAL_TICKERS: TickerItem[] = [
  { symbol: "XAUUSD", price: "2,654.80", change: "+1.24%", isUp: true },
  { symbol: "EURUSD", price: "1.0842", change: "+0.18%", isUp: true },
  { symbol: "NAS100", price: "20,248.50", change: "+0.86%", isUp: true },
  { symbol: "BTCUSD", price: "94,220.00", change: "+3.42%", isUp: true },
  { symbol: "SPX500", price: "5,864.10", change: "+0.52%", isUp: true },
  { symbol: "GBPUSD", price: "1.2985", change: "-0.22%", isUp: false },
  { symbol: "US30", price: "42,380.00", change: "+0.31%", isUp: true },
  { symbol: "ETHUSD", price: "3,140.50", change: "+2.15%", isUp: true },
];

export function MarketTicker() {
  const [tickers, setTickers] = useState<TickerItem[]>(INITIAL_TICKERS);

  useEffect(() => {
    // Subtle realistic random fluctuations
    const interval = setInterval(() => {
      setTickers((prev) =>
        prev.map((t) => {
          if (Math.random() > 0.4) return t;
          const drift = (Math.random() - 0.48) * 0.15;
          const currentChange = parseFloat(t.change);
          const newChange = +(currentChange + drift).toFixed(2);
          return {
            ...t,
            change: `${newChange >= 0 ? "+" : ""}${newChange}%`,
            isUp: newChange >= 0,
          };
        })
      );
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  const items = [...tickers, ...tickers]; // Duplicate for seamless infinite loop

  return (
    <div className="tick" aria-hidden="true">
      <div className="tick-track">
        {items.map((t, i) => (
          <span key={i} className="tick-item">
            <span className="tick-symbol">{t.symbol}</span>
            <span className="tick-price">{t.price}</span>
            <em className={t.isUp ? "tick-up" : "tick-dn"}>{t.change}</em>
          </span>
        ))}
      </div>
    </div>
  );
}
