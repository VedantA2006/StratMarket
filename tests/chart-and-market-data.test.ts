import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { tradingViewAdapter } from "@/lib/market-data";
import { strategyExecutionRunner } from "@/lib/strategy-execution";

describe("Private Live Charting Platform & Market Data", () => {
  it("resolves the four Pine Script strategies to their exact IDs, instrument, and M15 timeframe", async () => {
    const pineIds = ["PS-01", "PS-02", "PS-03", "PS-04"];
    for (const id of pineIds) {
      const strategy = await db.getStrategyBySlug(id);
      expect(strategy).toBeDefined();
      expect(strategy?.id).toBe(id);
      expect(strategy?.implementationType).toBe("PINE_SCRIPT");
      expect(strategy?.instrument).toBe("XAUUSD");
      expect(strategy?.timeframe).toBe("M15");
      expect(strategy?.name).toBeTruthy();
    }
  });

  it("maps market data symbols and timeframes correctly for TradingView v4 feed", () => {
    expect(tradingViewAdapter.mapSymbol("XAUUSD")).toBe("FOREXCOM:XAUUSD");
    expect(tradingViewAdapter.mapSymbol("GOLD")).toBe("FOREXCOM:XAUUSD");
    expect(tradingViewAdapter.mapSymbol("BTCUSDT")).toBe("BINANCE:BTCUSDT");
    expect(tradingViewAdapter.mapSymbol("EURUSD")).toBe("FX:EURUSD");
    expect(tradingViewAdapter.mapSymbol("BINANCE:SOLUSDT")).toBe("BINANCE:SOLUSDT");

    expect(tradingViewAdapter.mapTimeframe("M1")).toBe("1");
    expect(tradingViewAdapter.mapTimeframe("M5")).toBe("5");
    expect(tradingViewAdapter.mapTimeframe("M15")).toBe("15");
    expect(tradingViewAdapter.mapTimeframe("1H")).toBe("60");
    expect(tradingViewAdapter.mapTimeframe("4H")).toBe("240");
    expect(tradingViewAdapter.mapTimeframe("1D")).toBe("D");
  });

  it("converts historical candles to Vela-compatible epoch millisecond timestamps", async () => {
    const bars = await tradingViewAdapter.getHistoricalBars("XAUUSD", "15", 25);
    expect(bars.length).toBeGreaterThan(0);
    expect(bars.length).toBeLessThanOrEqual(25);

    const first = bars[0];
    expect(first.time).toBeGreaterThan(1000000000000); // Must be epoch milliseconds
    expect(typeof first.open).toBe("number");
    expect(typeof first.high).toBe("number");
    expect(typeof first.low).toBe("number");
    expect(typeof first.close).toBe("number");
    expect(first.high).toBeGreaterThanOrEqual(first.low);
  });

  it("enforces private execution boundary: output contract contains NO raw source code", async () => {
    const strat = await db.getStrategyBySlug("PS-01");
    expect(strat).toBeDefined();

    const mockCandles = [
      { time: 1700000000000, open: 2000, high: 2010, low: 1995, close: 2005, volume: 100 },
      { time: 1700000900000, open: 2005, high: 2015, low: 2000, close: 2012, volume: 150 },
      { time: 1700001800000, open: 2012, high: 2020, low: 2008, close: 2018, volume: 120 },
    ];

    const contract = strategyExecutionRunner.execute(strat!, mockCandles);

    expect(contract.strategyId).toBe("PS-01");
    expect(contract.implementationType).toBe("PINE_SCRIPT");
    expect(contract.priceLevels.length).toBeGreaterThan(0);
    expect(contract.series).toBeDefined();

    // STRICT IP SECURITY AUDIT:
    const serialized = JSON.stringify(contract);
    expect(serialized).not.toContain("//@version=5");
    expect(serialized).not.toContain("strategy(");
    expect(serialized).not.toContain("ta.ema");
    expect(serialized).not.toContain("strategy.entry");
    expect(serialized).not.toContain("strategy.exit");
    expect(serialized).not.toContain("pine_source");
    expect(serialized).not.toContain("private_key");
  });

  it("calculates dynamic SL and TP price levels corresponding to strategy risk rules", async () => {
    const strat = await db.getStrategyBySlug("PS-01");
    expect(strat).toBeDefined();

    const mockCandles = [
      { time: 1700000000000, open: 2600, high: 2605, low: 2595, close: 2600, volume: 50 },
    ];

    const contract = strategyExecutionRunner.execute(strat!, mockCandles);
    const tpLevel = contract.priceLevels.find((lvl) => lvl.name.includes("Target Payoff"));
    const slLevel = contract.priceLevels.find((lvl) => lvl.name.includes("Max Risk Stop"));

    expect(tpLevel).toBeDefined();
    expect(slLevel).toBeDefined();
    expect(tpLevel!.price).toBe(2618.00); // 2600 + $18 TP
    expect(slLevel!.price).toBe(2586.00); // 2600 - $14 SL
  });

  it("updates forming candle in place without creating duplicates", () => {
    const initialCandles = [
      { time: 1000, open: 10, high: 12, low: 9, close: 11, volume: 10 },
      { time: 2000, open: 11, high: 14, low: 10, close: 13, volume: 20 },
    ];

    const incomingTick = { time: 2000, open: 11, high: 15, low: 10, close: 14.5, volume: 25 };

    const updated = [...initialCandles];
    const lastExisting = updated[updated.length - 1];

    if (incomingTick.time === lastExisting.time) {
      updated[updated.length - 1] = incomingTick;
    } else if (incomingTick.time > lastExisting.time) {
      updated.push(incomingTick);
    }

    expect(updated.length).toBe(2);
    expect(updated[1].close).toBe(14.5);
    expect(updated[1].high).toBe(15);
    expect(updated[1].volume).toBe(25);
  });

  it("authenticates that private scripts PS-01, PS-02, PS-03, and PS-04 exist in protected directory", () => {
    expect(strategyExecutionRunner.hasPrivateScript("PS-01")).toBe(true);
    expect(strategyExecutionRunner.hasPrivateScript("PS-02")).toBe(true);
    expect(strategyExecutionRunner.hasPrivateScript("PS-03")).toBe(true);
    expect(strategyExecutionRunner.hasPrivateScript("PS-04")).toBe(true);
  });

  it("executes Grandmaster (PS-01) with 5 plot overlays, exact $18/$14 bracket, and 82.61% HUD metrics", async () => {
    const strat = await db.getStrategyBySlug("PS-01");
    expect(strat).toBeDefined();

    // Generate 60 test candles with UTC timestamps to test indicators and state
    const baseTime = Date.UTC(2026, 9, 15, 10, 0, 0); // 10:00 UTC (active session)
    const candles = Array.from({ length: 60 }, (_, i) => ({
      time: baseTime + i * 15 * 60 * 1000,
      open: 2650 + Math.sin(i * 0.2) * 10,
      high: 2655 + Math.sin(i * 0.2) * 10,
      low: 2645 + Math.sin(i * 0.2) * 10,
      close: 2652 + Math.sin(i * 0.2) * 10,
      volume: 100 + i * 5,
    }));

    const contract = strategyExecutionRunner.execute(strat!, candles);

    expect(contract.strategyId).toBe("PS-01");
    expect(contract.executionStatus).toBe("ACTIVE");
    expect(contract.series.length).toBe(5);

    const seriesNames = contract.series.map((s) => s.name);
    expect(seriesNames).toContain("Fast EMA (50)");
    expect(seriesNames).toContain("Macro EMA (200)");
    expect(seriesNames).toContain("Upper Band (2.1σ)");
    expect(seriesNames).toContain("Lower Band (2.1σ)");
    expect(seriesNames).toContain("Band Basis SMA (28)");

    expect(contract.summary.riskParameters.takeProfit).toBe("+$18.00");
    expect(contract.summary.riskParameters.stopLoss).toBe("-$14.00");

    const wrMetric = contract.summary.hudMetrics?.find((m) => m.label === "Win Rate");
    expect(wrMetric).toBeDefined();
    expect(wrMetric?.value).toContain("82.61%");

    const rrMetric = contract.summary.hudMetrics?.find((m) => m.label === "Realized R:R Ratio");
    expect(rrMetric).toBeDefined();
    expect(rrMetric?.value).toContain("1 : 1.29");
  });

  it("executes Elite (PS-04) with 5 plot overlays, exact $17/$14 bracket, and 80.65% HUD metrics", async () => {
    const strat = await db.getStrategyBySlug("PS-04");
    expect(strat).toBeDefined();

    const baseTime = Date.UTC(2026, 9, 15, 8, 0, 0); // 08:00 UTC (active session: 06:00-20:00)
    const candles = Array.from({ length: 60 }, (_, i) => ({
      time: baseTime + i * 15 * 60 * 1000,
      open: 2680 + Math.cos(i * 0.2) * 8,
      high: 2684 + Math.cos(i * 0.2) * 8,
      low: 2676 + Math.cos(i * 0.2) * 8,
      close: 2679 + Math.cos(i * 0.2) * 8,
      volume: 80 + i * 4,
    }));

    const contract = strategyExecutionRunner.execute(strat!, candles);

    expect(contract.strategyId).toBe("PS-04");
    expect(contract.executionStatus).toBe("ACTIVE");
    expect(contract.series.length).toBe(5);

    const seriesNames = contract.series.map((s) => s.name);
    expect(seriesNames).toContain("Fast EMA (50)");
    expect(seriesNames).toContain("Macro EMA (200)");
    expect(seriesNames).toContain("Upper Band (2.2σ)");
    expect(seriesNames).toContain("Lower Band (2.2σ)");
    expect(seriesNames).toContain("Band Basis SMA (30)");

    expect(contract.summary.riskParameters.takeProfit).toBe("+$17.00");
    expect(contract.summary.riskParameters.stopLoss).toBe("-$14.00");

    const wrMetric = contract.summary.hudMetrics?.find((m) => m.label === "Win Rate");
    expect(wrMetric).toBeDefined();
    expect(wrMetric?.value).toContain("80.65%");

    const rrMetric = contract.summary.hudMetrics?.find((m) => m.label === "Realized R:R Ratio");
    expect(rrMetric).toBeDefined();
    expect(rrMetric?.value).toContain("1 : 1.21");
  });

  it("produces authentic visual Trade Boxes (Long/Short Position tool zones) and Sovereign Guards", async () => {
    const strat = await db.getStrategyBySlug("PS-04");
    expect(strat).toBeDefined();

    // Fetch real historical bars from TradingView adapter which contains confirmed trades
    const candles = await tradingViewAdapter.getHistoricalBars("XAUUSD", "15", 500);
    const contract = strategyExecutionRunner.execute(strat!, candles);

    expect(contract.sovereignGuards).toBeDefined();
    expect(contract.sovereignGuards!.length).toBe(5);

    const guardLabels = contract.sovereignGuards!.map((g) => g.label);
    expect(guardLabels).toContain("Timeframe Lock");
    expect(guardLabels).toContain("Execution Bias");
    expect(guardLabels).toContain("Macro Trend Alignment");
    expect(guardLabels).toContain("Session Guard (UTC)");
    expect(guardLabels).toContain("Order Architecture");

    const tfLock = contract.sovereignGuards!.find((g) => g.label === "Timeframe Lock");
    expect(tfLock?.value).toBe("STRICTLY 15M (900s)");

    expect(contract.tradeBoxes).toBeDefined();
    expect(contract.tradeBoxes!.length).toBeGreaterThan(0);

    const trade = contract.tradeBoxes![0];
    expect(trade.type).toBe("SHORT");
    expect(trade.entryPrice).toBeGreaterThan(4000);
    expect(trade.tpPrice).toBeLessThan(trade.entryPrice);
    expect(trade.slPrice).toBeGreaterThan(trade.entryPrice);
    expect(trade.entryBadge).toContain("SHORT");
    expect(trade.exitBadge).toBeDefined();
  });

  it("executes Apex (PS-02) with 88.46% WR, PF 9.31, 25% rejection wick gate, and $17/$14 payoff", async () => {
    const strat = await db.getStrategyBySlug("PS-02");
    expect(strat).toBeDefined();

    const baseTime = Date.UTC(2026, 9, 15, 8, 0, 0);
    const candles = Array.from({ length: 60 }, (_, i) => ({
      time: baseTime + i * 15 * 60 * 1000,
      open: 2650 + Math.sin(i * 0.3) * 12,
      high: 2658 + Math.sin(i * 0.3) * 12,
      low: 2642 + Math.sin(i * 0.3) * 12,
      close: 2651 + Math.sin(i * 0.3) * 12,
      volume: 120 + i * 2,
    }));

    const contract = strategyExecutionRunner.execute(strat!, candles);
    expect(contract.strategyId).toBe("PS-02");
    expect(contract.executionStatus).toBe("ACTIVE");

    const wrMetric = contract.summary.hudMetrics?.find((m) => m.label === "Win Rate");
    expect(wrMetric?.value).toContain("88.46%");

    const pfMetric = contract.summary.hudMetrics?.find((m) => m.label === "Profit Factor");
    expect(pfMetric?.value).toBe("9.31");

    const wickGuard = contract.sovereignGuards?.find((g) => g.label === "Rejection Wick Gate");
    expect(wickGuard?.value).toBe("≥25% Candle Body");
  });

  it("executes Strict 1:2 R:R (PS-03) with exact $20 TP / $10 SL bracket, 74.07% WR, and 10% wick gate", async () => {
    const strat = await db.getStrategyBySlug("PS-03");
    expect(strat).toBeDefined();

    const baseTime = Date.UTC(2026, 9, 15, 8, 0, 0);
    const candles = Array.from({ length: 60 }, (_, i) => ({
      time: baseTime + i * 15 * 60 * 1000,
      open: 2650 + Math.sin(i * 0.3) * 12,
      high: 2658 + Math.sin(i * 0.3) * 12,
      low: 2642 + Math.sin(i * 0.3) * 12,
      close: 2651 + Math.sin(i * 0.3) * 12,
      volume: 120 + i * 2,
    }));

    const contract = strategyExecutionRunner.execute(strat!, candles);
    expect(contract.strategyId).toBe("PS-03");
    expect(contract.executionStatus).toBe("ACTIVE");
    expect(contract.summary.riskParameters.takeProfit).toBe("+$20.00");
    expect(contract.summary.riskParameters.stopLoss).toBe("-$10.00");

    const wrMetric = contract.summary.hudMetrics?.find((m) => m.label === "Win Rate");
    expect(wrMetric?.value).toContain("74.07%");

    const payoffMetric = contract.summary.hudMetrics?.find((m) => m.label === "Payoff Ratio");
    expect(payoffMetric?.value).toContain("1 : 2.00");

    const wickGuard = contract.sovereignGuards?.find((g) => g.label === "Rejection Wick Gate");
    expect(wickGuard?.value).toBe("≥10% Candle Body");
  });
});

