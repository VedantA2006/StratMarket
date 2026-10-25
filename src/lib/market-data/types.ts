// StratMarket Market Data Types & Provider Interface
// Standardized across TradingView v4, Vela chart engine, and Strategy Execution

export interface MarketCandle {
  time: number; // Open timestamp in epoch milliseconds (for Vela compatibility)
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export type MarketDataStatus = "LIVE" | "HISTORICAL" | "DELAYED" | "DISCONNECTED" | "ERROR";

export interface MarketDataResponse {
  success: boolean;
  symbol: string;
  mappedSymbol: string;
  timeframe: string;
  source: string;
  status: MarketDataStatus;
  count: number;
  candles: MarketCandle[];
  error?: string;
}

export interface MarketDataProvider {
  getHistoricalBars(
    symbol: string,
    timeframe: string,
    count?: number
  ): Promise<MarketCandle[]>;
  getConnectionStatus(): MarketDataStatus;
}
