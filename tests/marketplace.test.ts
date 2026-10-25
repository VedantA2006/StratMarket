import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";

describe("Marketplace Catalogue & Filtering", () => {
  it("loads exactly 14 strategies in catalogue (10 Python + 4 Pine Script)", async () => {
    const all = await db.getStrategies();
    expect(all.length).toBe(14);

    const py = all.filter((s) => s.implementationType === "PYTHON");
    const ps = all.filter((s) => s.implementationType === "PINE_SCRIPT");

    expect(py.length).toBe(10);
    expect(ps.length).toBe(4);
  });

  it("filters strategies by instrument, timeframe, and category", async () => {
    const gold = await db.getStrategies({ instrument: "XAUUSD" });
    expect(gold.every((s) => s.instrument === "XAUUSD")).toBe(true);

    const m15 = await db.getStrategies({ timeframe: "M15" });
    expect(m15.length).toBe(4);
    expect(m15.every((s) => s.timeframe === "M15")).toBe(true);

    const trend = await db.getStrategies({ category: "Trend" });
    expect(trend.every((s) => s.category === "Trend")).toBe(true);
  });

  it("searches strategies by name, ID, or asset", async () => {
    const searchById = await db.getStrategies({ query: "PY-01" });
    expect(searchById.length).toBeGreaterThan(0);
    expect(searchById[0].id).toBe("PY-01");

    const searchByName = await db.getStrategies({ query: "Peak" });
    expect(searchByName.length).toBe(1);
    expect(searchByName[0].name).toBe("Peak Champion");

    const pythonByType = await db.getStrategies({ type: "Python" });
    expect(pythonByType.length).toBe(10);
  });

  it("sorts strategies by profit factor and max drawdown", async () => {
    const sortedByPf = await db.getStrategies({ sort: "pf" });
    for (let i = 0; i < sortedByPf.length - 1; i++) {
      expect(sortedByPf[i].metrics.profitFactor).toBeGreaterThanOrEqual(
        sortedByPf[i + 1].metrics.profitFactor
      );
    }

    const sortedByDd = await db.getStrategies({ sort: "dd" });
    for (let i = 0; i < sortedByDd.length - 1; i++) {
      expect(sortedByDd[i].metrics.maxDrawdown).toBeLessThanOrEqual(
        sortedByDd[i + 1].metrics.maxDrawdown
      );
    }
  });

  it("keeps private and draft strategies hidden from public listings", async () => {
    // Hide PY-05
    await db.updateStrategyStatus("PY-05", "PRIVATE");

    const publicList = await db.getStrategies({ includeDrafts: false });
    expect(publicList.find((s) => s.id === "PY-05")).toBeUndefined();

    // Restore status
    await db.updateStrategyStatus("PY-05", "PUBLIC");
    const restored = await db.getStrategies({ includeDrafts: false });
    expect(restored.find((s) => s.id === "PY-05")).toBeDefined();
  });

  it("resolves all 10 MT5 single-digit drawdown ensemble strategies with report paths", async () => {
    for (let i = 1; i <= 10; i++) {
      const slug = `py-${String(i).padStart(2, "0")}`;
      const strat = await db.getStrategyBySlug(slug);
      expect(strat).toBeDefined();
      expect(strat?.implementationType).toBe("PYTHON");
      expect(strat?.ensembleFolder).toMatch(/^Ensemble_/);
      expect(strat?.reportPath).toContain("Stratmarket_Performance_Report.html");
      expect(strat?.metrics.maxDrawdown).toBeLessThan(10.0); // Strict single-digit DD
      expect(strat?.supportedUsageModes).toEqual(["alert", "broker"]);
    }
  });
});

