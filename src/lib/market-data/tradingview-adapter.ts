// StratMarket TradingView Data Adapter
// Uses verified @mathieuc/tradingview v4 API for real live institutional market data

import { getCandles } from "@mathieuc/tradingview/data";
import { MarketCandle, MarketDataProvider, MarketDataStatus } from "./types";

interface CacheEntry {
  timestamp: number;
  candles: MarketCandle[];
}

export class TradingViewDataAdapter implements MarketDataProvider {
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTtlMs: number = 8000; // 8-second cache to prevent feed spamming
  private status: MarketDataStatus = "LIVE";

  /**
   * Maps internal StratMarket symbols to verified TradingView feed symbols
   */
  public mapSymbol(rawSymbol: string): string {
    const sym = rawSymbol.trim().toUpperCase();
    if (sym.includes(":")) return sym;

    switch (sym) {
      case "XAUUSD":
      case "GOLD":
        return "FOREXCOM:XAUUSD";
      case "BTCUSDT":
        return "BINANCE:BTCUSDT";
      case "ETHUSDT":
        return "BINANCE:ETHUSDT";
      case "EURUSD":
        return "FX:EURUSD";
      case "GBPUSD":
        return "FX:GBPUSD";
      default:
        return `FOREXCOM:${sym}`;
    }
  }

  /**
   * Maps StratMarket timeframe formats (e.g. M15, M5) to TradingView API timeframe strings
   */
  public mapTimeframe(rawTf: string): string {
    const tf = rawTf.trim().toUpperCase();
    if (tf === "M1" || tf === "1") return "1";
    if (tf === "M3" || tf === "3") return "3";
    if (tf === "M5" || tf === "5") return "5";
    if (tf === "M15" || tf === "15") return "15";
    if (tf === "M30" || tf === "30") return "30";
    if (tf === "1H" || tf === "H1" || tf === "60") return "60";
    if (tf === "2H" || tf === "H2" || tf === "120") return "120";
    if (tf === "4H" || tf === "H4" || tf === "240") return "240";
    if (tf === "1D" || tf === "D1" || tf === "D") return "D";
    if (tf === "1W" || tf === "W1" || tf === "W") return "W";
    return "15"; // Default to M15
  }

  /**
   * Fetches historical candles from TradingView via v4 API
   */
  public async getHistoricalBars(
    symbol: string,
    timeframe: string,
    count: number = 2000
  ): Promise<MarketCandle[]> {
    const tvSymbol = this.mapSymbol(symbol);
    const tvTimeframe = this.mapTimeframe(timeframe);
    const effectiveCount = Math.min(Math.max(count, 10), 5500);
    const cacheKey = `${tvSymbol}:${tvTimeframe}:${effectiveCount}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.candles;
    }

    try {
      const rawCandles = await getCandles({
        symbol: tvSymbol,
        timeframe: tvTimeframe,
        count: effectiveCount,
      });

      if (!rawCandles || rawCandles.length === 0) {
        // Try fallback to OANDA if FOREXCOM returned empty
        if (tvSymbol === "FOREXCOM:XAUUSD") {
          const fallbackCandles = await getCandles({
            symbol: "OANDA:XAUUSD",
            timeframe: tvTimeframe,
            count: effectiveCount,
          });
          if (fallbackCandles && fallbackCandles.length > 0) {
            return this.transformAndCache(cacheKey, fallbackCandles);
          }
        }
        return [];
      }

      return this.transformAndCache(cacheKey, rawCandles);
    } catch (err: any) {
      console.error(`[TradingViewDataAdapter] Fetch failed for ${tvSymbol} (${tvTimeframe}):`, err?.message || err);
      this.status = "ERROR";
      throw err;
    }
  }

  private transformAndCache(cacheKey: string, rawCandles: any[]): MarketCandle[] {
    const transformed: MarketCandle[] = rawCandles.map((c) => {
      // TradingView returns timestamp in seconds; Vela requires milliseconds
      const timeMs = c.time < 10000000000 ? c.time * 1000 : c.time;
      return {
        time: timeMs,
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
        volume: c.volume != null ? Number(c.volume) : 0,
      };
    });

    // Sort ascending by time
    transformed.sort((a, b) => a.time - b.time);

    // Save to cache
    this.cache.set(cacheKey, {
      timestamp: Date.now(),
      candles: transformed,
    });
    this.status = "LIVE";

    return transformed;
  }

  public getConnectionStatus(): MarketDataStatus {
    return this.status;
  }
}

export const tradingViewAdapter = new TradingViewDataAdapter();
