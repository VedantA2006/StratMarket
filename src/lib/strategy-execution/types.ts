// StratMarket Private Strategy Execution Output Contract
// Exclusively serves compiled visual representation. Never exposes Pine Script or Python source.

export interface StrategySeriesPoint {
  time: number;
  value: number | null;
  color?: string;
}

export interface StrategyLineSeries {
  id: string;
  name: string;
  kind: "line" | "area" | "step";
  color: string;
  overlay: boolean;
  points: StrategySeriesPoint[];
}

export interface StrategyMarker {
  time: number;
  position: "aboveBar" | "belowBar" | "inBar";
  shape: "arrowUp" | "arrowDown" | "circle" | "square";
  color: string;
  text?: string;
}

export interface StrategyPriceLevel {
  name: string;
  price: number;
  color: string;
  style: "solid" | "dashed" | "dotted";
}

export interface StrategyHudMetric {
  label: string;
  value: string;
  color?: string;
}

export interface StrategyNativeIndicatorConfig {
  type: string;
  inputs: Record<string, any>;
}

export interface StrategyTradeBox {
  id: string;
  type: "LONG" | "SHORT";
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  tpPrice: number;
  slPrice: number;
  profitUsd: number;
  isWin: boolean;
  entryBadge: string;
  exitBadge: string;
}

export interface StrategySovereignGuard {
  label: string;
  value: string;
  color?: string;
}

export interface StrategyChartContract {
  strategyId: string;
  name: string;
  symbol: string;
  timeframe: string;
  category: string;
  implementationType: "PINE_SCRIPT" | "PYTHON";
  dataStatus: "LIVE" | "HISTORICAL" | "CONNECTING" | "ERROR";
  executionStatus: "ACTIVE" | "STANDBY_FOR_SOURCE" | "ERROR";
  computedAt: number;
  candleCount: number;
  series: StrategyLineSeries[];
  markers: StrategyMarker[];
  priceLevels: StrategyPriceLevel[];
  nativeIndicators?: StrategyNativeIndicatorConfig[];
  tradeBoxes?: StrategyTradeBox[];
  sovereignGuards?: StrategySovereignGuard[];
  summary: {
    state: string;
    description: string;
    riskParameters: {
      stopLoss?: string;
      takeProfit?: string;
      rules?: string;
    };
    latestSignal?: {
      direction: "BUY" | "SELL" | "NEUTRAL";
      timestamp: number;
      price: number;
      label: string;
    } | null;
    hudMetrics?: StrategyHudMetric[];
  };
}


