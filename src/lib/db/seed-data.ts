// Seed data for StratMarket - Elvaris Capital Algorithmic Trading Strategies
// Contains full details for 10 Python strategies and 4 Pine Script strategies

export interface StrategySeedItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  implementationType: "PYTHON" | "PINE_SCRIPT";
  instrument: string;
  timeframe: string;
  category: string;
  currentVersion: string;
  visibilityStatus: "PUBLIC" | "PRIVATE" | "DRAFT" | "ARCHIVED";
  trialEligibility: boolean;
  supportedUsageModes: string[];
  vpsStrategyRef?: string;
  metrics: {
    netReturn: number;
    maxDrawdown: number;
    profitFactor: number;
    winRate: number;
    totalTrades: number;
    averageTrade: number;
    sharpeRatio: number;
    backtestPeriod: string;
    transactionCosts: string;
    slippageAssumptions: string;
    dataSource: string;
    validationType: "BACKTESTED" | "SIMULATED" | "PAPER_TRADED" | "FORWARD_TESTED" | "LIVE";
    isDemo: boolean;
  };
  researchReport: {
    hypothesis: string;
    methodology: string;
    riskRules: string;
    knownLimitations: string;
    dataCleaning: string;
    executionProtocol: string;
  };
  equitySeries: number[];
  drawdownSeries: number[];
}

function rng(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateSeries(seed: number, count: number = 120, drift: number = 0.004) {
  const r = rng(seed);
  let v = 100;
  const eq = [v];
  for (let i = 1; i < count; i++) {
    v *= 1 + (r() - 0.44) * 0.03 + drift;
    eq.push(+v.toFixed(2));
  }
  let peak = 0;
  const dd = eq.map((val) => {
    peak = Math.max(peak, val);
    const d = (val / peak - 1) * 100;
    return +d.toFixed(2);
  });
  return { eq, dd };
}

const instruments = ["XAUUSD", "EURUSD", "NAS100", "BTCUSD", "SPX500"];
const timeframes = ["M15", "H1", "H4", "D1"];
const categories = ["Trend", "Mean reversion", "Breakout", "Momentum", "Volatility"];
const categoryDescriptions: Record<string, string> = {
  "Trend": "Follows sustained moves with layered moving average and volatility filters.",
  "Mean reversion": "Identifies statistically stretched price action returning to volume-weighted mean.",
  "Breakout": "Trades directional expansions following multi-session volatility compression.",
  "Momentum": "Ranks multi-timeframe relative strength to time structural market entries.",
  "Volatility": "Dynamically scales exposure and adjusts stop barriers based on ATR regimes."
};

export const INITIAL_STRATEGIES: StrategySeedItem[] = Array.from({ length: 14 }).map((_, i) => {
  const isPython = i < 10;
  const num = isPython ? i + 1 : i - 9;
  const id = (isPython ? "PY-" : "PS-") + String(num).padStart(2, "0");
  const slug = id.toLowerCase();
  const name = (isPython ? "Python Strategy " : "Pine Strategy ") + String(num).padStart(2, "0");
  const instrument = instruments[i % 5];
  const timeframe = timeframes[(i * 3) % 4];
  const category = categories[(i * 2) % 5];
  const seed = i + 3;
  const r = rng(seed);

  const ret = +(12 + r() * 60).toFixed(1);
  const dd = +(4 + r() * 14).toFixed(1);
  const pf = +(1.2 + r() * 1.1).toFixed(2);
  const win = Math.round(42 + r() * 25);
  const trades = Math.round(120 + r() * 700);
  const sharpe = +(1.1 + r() * 1.4).toFixed(2);
  const avgTrade = +(0.4 + r() * 0.8).toFixed(2);

  const { eq, dd: drawdownList } = generateSeries(seed, 120, 0.004);

  return {
    id,
    slug,
    name,
    description: categoryDescriptions[category] || "Systematic algorithmic strategy engineered by Elvaris Capital.",
    implementationType: isPython ? "PYTHON" : "PINE_SCRIPT",
    instrument,
    timeframe,
    category,
    currentVersion: "1.2.0",
    visibilityStatus: "PUBLIC",
    trialEligibility: true,
    supportedUsageModes: ["chart", "alert", "broker"],
    vpsStrategyRef: isPython ? `elvaris-vps-${slug}` : undefined,
    metrics: {
      netReturn: ret,
      maxDrawdown: dd,
      profitFactor: pf,
      winRate: win,
      totalTrades: trades,
      averageTrade: avgTrade,
      sharpeRatio: sharpe,
      backtestPeriod: "2022-01-01 to 2026-09-01",
      transactionCosts: "Fixed commission $2.50/lot + 0.5 pip spread",
      slippageAssumptions: "Simulated 1.0 pip slippage on market entries and stop triggers",
      dataSource: "Tick Data LLC Institutional Tick Feeds (Historical M1)",
      validationType: "BACKTESTED",
      isDemo: true
    },
    researchReport: {
      hypothesis: `Asset ${instrument} displays structural regime persistence on ${timeframe} during specific liquidity windows, allowing asymmetric risk-to-reward positioning via ${category.toLowerCase()} logic.`,
      methodology: `Multi-stage hypothesis decomposition evaluated over 4.5 years of historical tick data. Parameters were optimized using walk-forward matrix windows (70% in-sample train, 30% out-of-sample test) to resist curve-fitting.`,
      riskRules: `Strict fixed fractional risk per trade capped at 1.5% of equity. Volatility stop calibrated dynamically via rolling 20-period Average True Range (ATR). Maximum 2 concurrent positions permitted.`,
      knownLimitations: `Backtest excludes extreme macro black-swan events and broker spread widening during central bank interest rate announcements. Past performance does not guarantee future results.`,
      dataCleaning: `Filtered for bad ticks, out-of-session spread spikes, and holiday illiquidity gaps using Elvaris Capital Institutional Data Pipeline v3.`,
      executionProtocol: isPython 
        ? "Hosted on Elvaris VPS (Ubuntu 24.04 LTS, low-latency cross-connect to LD4/NY4). Signals dispatched via authenticated webhook." 
        : "TradingView Pine Script v5 execution container with automated alerts and webhooks."
    },
    equitySeries: eq,
    drawdownSeries: drawdownList
  };
});

export const INITIAL_PLANS = [
  {
    id: "plan-single",
    slug: "single-strategy",
    name: "Single Strategy",
    description: "Dedicated access to one algorithmic trading strategy of your choice.",
    priceMonthly: 7900, // $79.00
    currency: "USD",
    priceDisplay: "$79 / month",
    features: [
      "One strategy of your choice",
      "Full research reports and equity charts",
      "Real-time email signal alerts",
      "Supported broker connection preview",
      "Community discord access"
    ],
    isHot: false,
    active: true
  },
  {
    id: "plan-all-access",
    slug: "all-access",
    name: "All-Access",
    description: "Complete access to every listed Python and Pine Script trading strategy.",
    priceMonthly: 19900, // $199.00
    currency: "USD",
    priceDisplay: "$199 / month",
    features: [
      "Every listed strategy (10 Python + 4 Pine Script)",
      "All new strategy versions and releases",
      "Instant priority email signal alerts",
      "Interactive chart visualization with entry/exits",
      "Multi-asset portfolio diversification guidelines",
      "Direct Q&A with Elvaris research quants"
    ],
    isHot: true,
    active: true
  },
  {
    id: "plan-professional",
    slug: "professional",
    name: "Professional",
    description: "Institutional-grade strategy access with direct API and automated broker routing.",
    priceMonthly: 49900, // $499.00
    currency: "USD",
    priceDisplay: "$499 / month",
    features: [
      "Everything included in All-Access",
      "Low-latency VPS webhook relay access",
      "Automated broker account execution integration",
      "Custom parameter overrides for risk governance",
      "1-on-1 monthly quant research briefing",
      "Dedicated account manager & SLA support"
    ],
    isHot: false,
    active: true
  }
];
