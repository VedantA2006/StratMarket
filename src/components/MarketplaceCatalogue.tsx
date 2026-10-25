"use client";

import { useState, useMemo } from "react";
import { StrategySeedItem } from "@/lib/db/seed-data";
import { StrategyDetailModal } from "./StrategyDetailModal";

interface Props {
  initialStrategies: StrategySeedItem[];
}

const INSTRUMENTS = ["All instruments", "XAUUSD", "EURUSD", "NAS100", "BTCUSD", "SPX500"];
const TIMEFRAMES = ["All timeframes", "M15", "H1", "H4", "D1"];
const CATEGORIES = ["All categories", "Trend", "Mean reversion", "Breakout", "Momentum", "Volatility"];

export function MarketplaceCatalogue({ initialStrategies }: Props) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"All" | "Python" | "Pine Script">("All");
  const [instrument, setInstrument] = useState("All instruments");
  const [timeframe, setTimeframe] = useState("All timeframes");
  const [category, setCategory] = useState("All categories");
  const [sort, setSort] = useState<"name" | "upd" | "pf" | "dd">("name");
  const [selectedStrategy, setSelectedStrategy] = useState<StrategySeedItem | null>(null);

  const clearFilters = () => {
    setQuery("");
    setType("All");
    setInstrument("All instruments");
    setTimeframe("All timeframes");
    setCategory("All categories");
    setSort("name");
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
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "pf") return b.metrics.profitFactor - a.metrics.profitFactor;
        if (sort === "dd") return a.metrics.maxDrawdown - b.metrics.maxDrawdown;
        if (sort === "upd") return b.metrics.netReturn - a.metrics.netReturn;
        return 0;
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
            className={`chip ${type === t ? "on" : ""}`}
            onClick={() => setType(t)}
          >
            {t === "All" ? "All strategies" : t}
          </button>
        ))}
      </div>

      <div className="meta">
        <span id="count">
          {filteredStrategies.length} of {initialStrategies.length} strategies · illustrative metrics
        </span>
        <button className="chip" id="clear" onClick={clearFilters}>
          Clear filters
        </button>
      </div>

      <div className="grid" id="grid">
        {filteredStrategies.length > 0 ? (
          filteredStrategies.map((s) => (
            <a
              key={s.id}
              href={`/strategies/${s.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="card"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="row">
                <span className={`badge ${s.implementationType === "PYTHON" ? "py" : "pn"}`}>
                  {s.implementationType === "PYTHON" ? "Python" : "Pine Script"}
                </span>
                <span>{s.id}</span>
              </div>
              <h3>{s.name}</h3>
              <div className="row">
                {s.instrument} · {s.timeframe} · {s.category}
              </div>
              <p>{s.description}</p>
              <div className="mm">
                <div>
                  Net return*<b>{s.metrics.netReturn}%</b>
                </div>
                <div>
                  Max DD*<b>{s.metrics.maxDrawdown}%</b>
                </div>
                <div>
                  Profit factor*<b>{s.metrics.profitFactor}</b>
                </div>
              </div>
              <span className="note" style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "auto", color: "var(--tx)", fontWeight: 500 }}>
                View Performance Report ↗
              </span>
            </a>
          ))
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
