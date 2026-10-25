"use client";

import { useState, useMemo } from "react";
import { StrategySeedItem, getStrategySortOrder } from "@/lib/db/seed-data";
import { StrategyDetailModal } from "./StrategyDetailModal";

interface Props {
  initialStrategies: StrategySeedItem[];
}

const INSTRUMENTS = ["All instruments", "XAUUSD"];
const TIMEFRAMES = ["All timeframes", "M5", "M15"];
const CATEGORIES = ["All categories", "Trend", "Mean reversion", "Breakout", "Momentum", "Volatility"];

export function MarketplaceCatalogue({ initialStrategies }: Props) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"All" | "Python" | "Pine Script">("All");
  const [instrument, setInstrument] = useState("All instruments");
  const [timeframe, setTimeframe] = useState("All timeframes");
  const [category, setCategory] = useState("All categories");
  const [sort, setSort] = useState<"order" | "name" | "upd" | "pf" | "dd">("order");
  const [selectedStrategy, setSelectedStrategy] = useState<StrategySeedItem | null>(null);

  const clearFilters = () => {
    setQuery("");
    setType("All");
    setInstrument("All instruments");
    setTimeframe("All timeframes");
    setCategory("All categories");
    setSort("order");
  };

  const filteredStrategies = useMemo(() => {
    return initialStrategies
      .filter((s) => {
        // Implementation type
        if (type === "Python" && s.implementationType !== "PYTHON") return false;
        if (type === "Pine Script" && s.implementationType !== "PINE_SCRIPT") return false;

        // Instrument
        if (!instrument.startsWith("All") && s.instrument !== instrument) return false;

        // Timeframe
        if (!timeframe.startsWith("All") && s.timeframe !== timeframe) return false;

        // Category
        if (!category.startsWith("All") && s.category !== category) return false;

        // Search Query
        if (query.trim()) {
          const q = query.toLowerCase().trim();
          const matches =
            s.name.toLowerCase().includes(q) ||
            s.id.toLowerCase().includes(q) ||
            s.instrument.toLowerCase().includes(q);
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sort === "order") return getStrategySortOrder(a) - getStrategySortOrder(b);
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "pf") return b.metrics.profitFactor - a.metrics.profitFactor;
        if (sort === "dd") return a.metrics.maxDrawdown - b.metrics.maxDrawdown;
        if (sort === "upd") return b.metrics.netReturn - a.metrics.netReturn;
        return getStrategySortOrder(a) - getStrategySortOrder(b);
      });
  }, [initialStrategies, query, type, instrument, timeframe, category, sort]);

  return (
    <>
      <div className="tools">
        <input
          id="q"
          type="search"
          placeholder="Search name, ID or instrument"
          aria-label="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          id="inst"
          aria-label="Instrument"
          value={instrument}
          onChange={(e) => setInstrument(e.target.value)}
        >
          {INSTRUMENTS.map((inst) => (
            <option key={inst} value={inst}>
              {inst}
            </option>
          ))}
        </select>
        <select
          id="tf"
          aria-label="Timeframe"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
        >
          {TIMEFRAMES.map((tf) => (
            <option key={tf} value={tf}>
              {tf}
            </option>
          ))}
        </select>
        <select
          id="cat"
          aria-label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select
          id="sort"
          aria-label="Sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
        >
          <option value="order">Strategy ID (Pine Script → Python)</option>
          <option value="name">Alphabetical</option>
          <option value="upd">Net return</option>
          <option value="pf">Profit factor</option>
          <option value="dd">Max drawdown (lowest)</option>
        </select>
      </div>

      <div className="chips" id="chips">
        {(["All", "Python", "Pine Script"] as const).map((t) => (
          <button
            key={t}
            className={`chip ${type === t ? "on" : ""} ${
              t === "Python" ? "chip-py" : t === "Pine Script" ? "chip-pn" : ""
            }`}
            onClick={() => setType(t)}
          >
            {t === "All" ? "All strategies (14)" : t === "Python" ? "🐍 Python MT5 (10)" : "🌲 Pine Script v5 (4)"}
          </button>
        ))}
      </div>

      <div className="meta">
        <span id="count">
          {filteredStrategies.length} of {initialStrategies.length} strategies · institutional metrics
        </span>
        <button className="chip" id="clear" onClick={clearFilters}>
          Clear filters
        </button>
      </div>

      <div className="grid" id="grid">
        {filteredStrategies.length > 0 ? (
          filteredStrategies.map((s) => {
            const isPython = s.implementationType === "PYTHON";
            return (
              <a
                key={s.id}
                href={`/strategies/${s.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`card ${isPython ? "card-python" : "card-pine"}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="card-top-accent" />
                <div className="row" style={{ alignItems: "center" }}>
                  <span className={`badge ${isPython ? "badge-python" : "badge-pine"}`}>
                    <span className={isPython ? "badge-dot-py" : "badge-dot-pn"}></span>
                    {isPython ? "Python MT5" : "Pine Script v5"}
                  </span>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "12px", color: "var(--mut)", fontWeight: 600 }}>
                    {s.id}
                  </span>
                </div>
                <h3>{s.name}</h3>
                <div className="row" style={{ fontSize: "12.5px" }}>
                  <span>{s.instrument} · {s.timeframe} · {s.category}</span>
                  <span style={{ color: isPython ? "#e8c46a" : "#4cc79a", fontWeight: 600 }}>
                    {isPython ? "MetaTrader 5" : "TradingView"}
                  </span>
                </div>
                <p>{s.description}</p>
                <div className="mm">
                  <div>
                    Net return*<b style={{ color: isPython ? "#e8c46a" : "#4cc79a" }}>+{s.metrics.netReturn}%</b>
                  </div>
                  <div>
                    Max DD*<b style={{ color: "#4cc79a" }}>{s.metrics.maxDrawdown}%</b>
                  </div>
                  <div>
                    Profit factor*<b>{s.metrics.profitFactor}</b>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "8px" }}>
                  <span className={isPython ? "note-tag-py" : "note-tag-pn"}>
                    {isPython ? "⚡ Full Automation" : "📊 Chart Strategy"}
                  </span>
                  <span className="note" style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--tx)", fontWeight: 600, fontSize: "12px" }}>
                    View Report ↗
                  </span>
                </div>
              </a>
            );
          })
        ) : (
          <div className="empty">
            No strategies match your criteria. Clear a filter to view more strategies.
          </div>
        )}
      </div>

      {selectedStrategy && (
        <StrategyDetailModal
          strategy={selectedStrategy}
          onClose={() => setSelectedStrategy(null)}
        />
      )}
    </>
  );
}
