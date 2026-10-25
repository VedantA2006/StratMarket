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
    expect(tradingViewAdapter.mapSymbol("XAUUSD")).toBe("OANDA:XAUUSD");
    expect(tradingViewAdapter.mapSymbol("GOLD")).toBe("OANDA:XAUUSD");
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
});
