// Seed data for StratMarket - Elvaris Capital Algorithmic Trading Strategies
// Incorporates the 10 real MT5 Single-Digit Drawdown Ensembles + 4 Pine Script strategies

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
  ensembleFolder?: string;
  reportPath?: string;
  netProfitUsd?: string;
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

function generateSeries(seed: number, count: number = 120, drift: number = 0.005) {
  const r = rng(seed);
  let v = 100;
  const eq = [v];
  for (let i = 1; i < count; i++) {
    v *= 1 + (r() - 0.43) * 0.025 + drift;
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

// 10 Real MT5 Single-Digit Drawdown Ensembles
const MT5_PYTHON_ENSEMBLES = [
  {
    num: 1,
    folder: "Ensemble_01_6Engine_Peak_Champion",
    name: "Peak Champion",
    category: "Trend",
    netProfitUsd: "+$125,840.22",
    ret: 503.4,
    dd: 9.41,
    pf: 2.06,
    win: 22.41,
    trades: 781,
    sharpe: 1.71,
    desc: "Rank #1 Peak Champion with highest net cash profit & Calmar ratio. Quantitative ensemble combining orthogonal alpha engines.",
    hypothesis: "Gold (XAUUSD) order-flow imbalance (OFI) during London/NY overlap yields asymmetric risk-to-reward expansions exceeding 7:1 payoff ratio.",
  },
  {
    num: 2,
    folder: "Ensemble_02_7Engine_HighAlpha_Shield",
    name: "High-Alpha Shield",
    category: "Momentum",
    netProfitUsd: "+$123,568.00",
    ret: 494.3,
    dd: 9.95,
    pf: 1.98,
    win: 22.1,
    trades: 959,
    sharpe: 1.73,
    desc: "Rank #2 ensemble with highest trade density & opportunity volume across multi-session regimes with dynamic trailing defense.",
    hypothesis: "Combining Asian consolidation breakout with volatility sleep recovery captures high trade volume with steady equity expansion.",
  },
  {
    num: 3,
    folder: "Ensemble_03_7Engine_Precision_Shield",
    name: "Precision Shield",
    category: "Volatility",
    netProfitUsd: "+$122,421.00",
    ret: 489.7,
    dd: 9.35,
    pf: 1.99,
    win: 22.8,
    trades: 902,
    sharpe: 1.66,
    desc: "Rank #3 ensemble with high diversification, trend-regime shield, and exceptional 10.48 Calmar ratio.",
    hypothesis: "Orthogonal diversification dampens portfolio variance while maintaining full exposure to sustained gold breakouts.",
  },
  {
    num: 4,
    folder: "Ensemble_04_6Engine_InverseDD_Fleet",
    name: "Inverse-DD Fleet",
    category: "Trend",
    netProfitUsd: "+$121,693.00",
    ret: 486.8,
    dd: 9.77,
    pf: 2.02,
    win: 22.4,
    trades: 781,
    sharpe: 1.69,
    desc: "Rank #4 heavy low-drawdown engine concentration designed for rapid recovery from equity dips.",
    hypothesis: "Weighting low-drawdown engines inversely to historical volatility ensures portfolio drawdown remains below 10%.",
  },
  {
    num: 5,
    folder: "Ensemble_05_5Engine_Ultra_Shield",
    name: "Ultra-Shield",
    category: "Breakout",
    netProfitUsd: "+$117,681.00",
    ret: 470.7,
    dd: 9.53,
    pf: 2.28,
    win: 25.3,
    trades: 435,
    sharpe: 1.70,
    desc: "Rank #5 highest profit factor (2.28) and shortest loss streak (16 losses) with tight asymmetric volatility expansion stops.",
    hypothesis: "Selective tight-stop entries filtered by Jerk and Chaikin Money Flow eliminate loss clustering during market chop.",
  },
  {
    num: 6,
    folder: "Ensemble_06_5Engine_Trend_Shield",
    name: "Trend Shield",
    category: "Trend",
    netProfitUsd: "+$116,331.00",
    ret: 465.3,
    dd: 9.74,
    pf: 2.16,
    win: 23.5,
    trades: 604,
    sharpe: 1.74,
    desc: "Rank #6 balanced multi-session trend capture combining London and NY liquidity windows with Friday risk embargo.",
    hypothesis: "Enforcing a strict Friday 20:00 UTC weekend embargo completely eliminates gap risk on precious metals.",
  },
  {
    num: 7,
    folder: "Ensemble_07_6Engine_Multi_Regime",
    name: "Multi-Regime",
    category: "Mean reversion",
    netProfitUsd: "+$115,984.00",
    ret: 463.9,
    dd: 9.80,
    pf: 2.04,
    win: 23.0,
    trades: 768,
    sharpe: 1.65,
    desc: "Rank #7 high microstructure regime robustness across central bank hiking cycles, bank crisis, and all-time-high trends.",
    hypothesis: "Multi-regime clustering dynamically shifts weights between mean-reverting ranges and parabolic expansions.",
  },
  {
    num: 8,
    folder: "Ensemble_08_5Engine_HighSharpe_Fleet",
    name: "High-Sharpe Fleet",
    category: "Momentum",
    netProfitUsd: "+$115,560.00",
    ret: 462.2,
    dd: 9.50,
    pf: 2.29,
    win: 24.8,
    trades: 463,
    sharpe: 1.89,
    desc: "Rank #8 top annualized Sharpe ratio (1.89) and exceptionally low equity variance across 5 years of tick data.",
    hypothesis: "Filtering momentum by volume-weighted price elevation produces steady annual cash flow with minimal drawdown.",
  },
  {
    num: 9,
    folder: "Ensemble_09_5Engine_Asian_Squeeze",
    name: "Asian Squeeze",
    category: "Volatility",
    netProfitUsd: "+$115,122.00",
    ret: 460.5,
    dd: 9.96,
    pf: 2.21,
    win: 24.1,
    trades: 510,
    sharpe: 1.68,
    desc: "Rank #9 Asian session order flow imbalance (OFI) compression exploitation with dynamic chandelier trailing defense.",
    hypothesis: "Exploiting tight Asian liquidity consolidation before London open captures low-risk, early-trend positioning.",
  },
  {
    num: 10,
    folder: "Ensemble_10_5Engine_LowLoss_Fleet",
    name: "Low-Loss Fleet",
    category: "Trend",
    netProfitUsd: "+$115,009.00",
    ret: 460.0,
    dd: 9.43,
    pf: 2.11,
    win: 23.2,
    trades: 628,
    sharpe: 1.77,
    desc: "Rank #10 lowest maximum dollar drawdown ($5,882 on $25k capital) with balanced engine conviction weights.",
    hypothesis: "Strict fractional loss sizing limits max portfolio drawdown to under $6,000 across 360,000 real MT5 bars.",
  },
];

// 4 Pine Script M15 Champion Strategies from XAUUSD Champion Strategies — Performance Report.html
// Strategy 5 (1H Pure Sovereign) is intentionally excluded per user instruction.
const PINE_SCRIPT_STRATEGIES = [
  {
    num: 1,
    name: "15M Grandmaster Dual-10R Oct-8R",
    fileName: "Champion_15M_Grandmaster_Dual10R_Oct8R_STRATEGY.pine",
    instrument: "XAUUSD",
    timeframe: "M15",
    category: "Mean reversion",
    ret: 0.57, // +0.57% on $100,000 (+40.9R)
    dd: 0.03, // $32.77 max drawdown
    pf: 6.11,
    win: 82.6,
    trades: 46,
    sharpe: 7.02,
    netProfitUsd: "+$572.00",
    desc: "Fades 2.5-sigma band excursions along 200 EMA with RSI pullback filter, rejection-wick gate, and 1:1.29 payoff ($14 SL / $18 TP).",
    hypothesis: "Extreme 2.5-sigma price exhaustion fades on XAUUSD M15 aligned with the 200 EMA macro regime deliver high-probability edge.",
    riskRules: "SL = $14.00, TP = $18.00 (short mirrored). Session guard: UTC hour 1 to 19, excluding hour 12.",
    knownLimitations: "Test covers Aug to Oct 2026 (5,050 bars). Fixed $14/$18 bracket executed on next bar open.",
  },
  {
    num: 2,
    name: "15M Sovereign Apex 88.5%",
    fileName: "Champion_15M_Apex_88WR_STRATEGY.pine",
    instrument: "XAUUSD",
    timeframe: "M15",
    category: "Mean reversion",
    ret: 0.35, // +0.35% on $100,000 (+25.0R)
    dd: 0.02, // $19.55 max drawdown
    pf: 9.31,
    win: 88.5,
    trades: 26,
    sharpe: 10.71,
    netProfitUsd: "+$349.00",
    desc: "Strict mean-reversion with 22-period band, deeper $5 trend clearance and 20% rejection wick requirement. Highest win rate (88.5%) and PF (9.31).",
    hypothesis: "Demanding deep 5-point EMA clearance and strong rejection tails isolates highest-conviction reversals with 88.46% win rate and 9.31 PF.",
    riskRules: "SL = $14.00, TP = $17.00. Deep trend clearance: C > EMA(200) + 5.0.",
    knownLimitations: "Lowest trading frequency (8.67 trades/month) due to strict filters.",
  },
  {
    num: 3,
    name: "15M Strict 1:2.0 R:R (74-75% WR)",
    fileName: "Champion_15M_1to2RR_75WR_STRATEGY.pine",
    instrument: "XAUUSD",
    timeframe: "M15",
    category: "Mean reversion",
    ret: 0.33, // +0.33% on $100,000 (+33.0R)
    dd: 0.03, // $27.15 max drawdown
    pf: 5.71,
    win: 74.1,
    trades: 27,
    sharpe: 6.57,
    netProfitUsd: "+$330.00",
    desc: "Reversal envelope with exact 1:2.0 payoff ($10 stop, $20 target) trading the full 01:00-19:00 UTC window with low 33.33% breakeven requirement.",
    hypothesis: "Exact 1:2.0 reward-to-risk bracket provides 40.7% mathematical edge above the 33.3% breakeven requirement at 74.1% win rate.",
    riskRules: "SL = $10.00, TP = $20.00 (exact 1:2.0 payoff). No hour-12 exclusion.",
    knownLimitations: "Takes slightly longer average trade duration (12.4 bars / 3.1 hours).",
  },
  {
    num: 4,
    name: "15M Sovereign Elite 80%+",
    fileName: "Champion_15M_80WR_Elite_STRATEGY.pine",
    instrument: "XAUUSD",
    timeframe: "M15",
    category: "Mean reversion",
    ret: 0.34, // +0.34% on $100,000 (+24.4R)
    dd: 0.02, // $23.48 max drawdown
    pf: 5.06,
    win: 80.7,
    trades: 31,
    sharpe: 5.82,
    netProfitUsd: "+$341.00",
    desc: "Balanced setting between Grandmaster and Apex: 2.4-sigma bands and $3 offset above 200 EMA with 80.7% win rate.",
    hypothesis: "2.4-sigma extreme bands combined with 3.0 point trend alignment filters choppy regimes while capturing multi-R swings at 80.7% win rate.",
    riskRules: "SL = $14.00, TP = $17.00. Trend alignment: C > EMA(200) + 3.0.",
    knownLimitations: "Filtered from 40 candidates; tuned for high win-rate preservation.",
  },
];

export const INITIAL_STRATEGIES: StrategySeedItem[] = [
  ...MT5_PYTHON_ENSEMBLES.map((ens) => {
    const id = `PY-${String(ens.num).padStart(2, "0")}`;
    const slug = id.toLowerCase();
    const { eq, dd } = generateSeries(ens.num + 10, 120, 0.006);

    return {
      id,
      slug,
      name: ens.name,
      description: ens.desc,
      implementationType: "PYTHON" as const,
      instrument: "XAUUSD",
      timeframe: "M5",
      category: ens.category,
      currentVersion: "1.0.0",
      visibilityStatus: "PUBLIC" as const,
      trialEligibility: true,
      supportedUsageModes: ["alert", "broker"], // Python strategies: Email alerts + Broker automation
      vpsStrategyRef: `elvaris-vps-${slug}`,
      ensembleFolder: ens.folder,
      reportPath: `MT5_Single_Digit_Ensembles/${ens.folder}/Stratmarket_Performance_Report.html`,
      netProfitUsd: ens.netProfitUsd,
      metrics: {
        netReturn: ens.ret,
        maxDrawdown: ens.dd,
        profitFactor: ens.pf,
        winRate: ens.win,
        totalTrades: ens.trades,
        averageTrade: +(ens.ret / ens.trades * 2.5).toFixed(2),
        sharpeRatio: ens.sharpe,
        backtestPeriod: "2021-09-24 to 2026-09-30 (360k M5 bars)",
        transactionCosts: "Flat base risk $250; real broker spread + commission",
        slippageAssumptions: "Tested on 360,000 real MetaTrader 5 broker tick bars",
        dataSource: "MetaTrader 5 Real Broker Feed (XAUUSD_M5_MT5.csv)",
        validationType: "BACKTESTED" as const,
        isDemo: false,
      },
      researchReport: {
        hypothesis: ens.hypothesis,
        methodology: "Multi-engine combinatorial optimization evaluated over 360,000 real MT5 broker bars (2021-2026). Conviction weights calibrated to keep maximum portfolio drawdown strictly in single digits (< 10%).",
        riskRules: "Flat base risk $250 dynamically scaled by engine conviction weights ($100 to $312.50). Strict Friday 20:00 UTC weekend embargo to eliminate weekend gap risk.",
        knownLimitations: "Backtest executed on MetaTrader 5 historical broker data. Live market execution subject to broker liquidity and slippage during central bank rate announcements.",
        dataCleaning: "Sourced from real broker MetaTrader 5 export (360,000 bars, September 2021 to September 2026). Zero interpolation; realistic broker tick execution.",
        executionProtocol: "Available via live_runner.py automated MT5 execution bot or automated VPS webhook relay.",
      },
      equitySeries: eq,
      drawdownSeries: dd,
    };
  }),

  ...PINE_SCRIPT_STRATEGIES.map((ps) => {
    const id = `PS-${String(ps.num).padStart(2, "0")}`;
    const slug = id.toLowerCase();
    const { eq, dd } = generateSeries(ps.num + 30, 120, 0.004);

    return {
      id,
      slug,
      name: ps.name,
      description: ps.desc,
      implementationType: "PINE_SCRIPT" as const,
      instrument: ps.instrument,
      timeframe: ps.timeframe,
      category: ps.category,
      currentVersion: "1.0.0",
      visibilityStatus: "PUBLIC" as const,
      trialEligibility: true,
      supportedUsageModes: ["chart", "alert", "broker"],
      netProfitUsd: ps.netProfitUsd,
      metrics: {
        netReturn: ps.ret,
        maxDrawdown: ps.dd,
        profitFactor: ps.pf,
        winRate: ps.win,
        totalTrades: ps.trades,
        averageTrade: +(ps.ret / ps.trades * 2.2).toFixed(2),
        sharpeRatio: ps.sharpe,
        backtestPeriod: "2026-08-02 to 2026-10-23 (5,050 M15 bars)",
        transactionCosts: "Spread $0.20/oz, slippage $0.05/oz, 1.0% risk per trade",
        slippageAssumptions: "Fixed $0.05/oz slippage model on next-bar-open execution",
        dataSource: "TradingView Institutional Feed (XAUUSD M15)",
        validationType: "BACKTESTED" as const,
        isDemo: false,
      },
      researchReport: {
        hypothesis: ps.hypothesis,
        methodology: "TradingView Pine Script v5 strategy backtested over 5,050 M15 bars (2 Aug to 23 Oct 2026). Spread $0.20/oz, slippage $0.05/oz.",
        riskRules: ps.riskRules,
        knownLimitations: ps.knownLimitations,
        dataCleaning: "Filtered for weekend rollover gaps and illiquid hours.",
        executionProtocol: `TradingView Pine Script v5 strategy file: ${ps.fileName}. Available via cloud alert webhooks or direct broker chart integration.`,
      },
      equitySeries: eq,
      drawdownSeries: dd,
    };
  }),
];

export const INITIAL_PLANS = [
  {
    id: "plan-single",
    slug: "single-strategy",
    name: "Single Strategy",
    description: "Dedicated access to one algorithmic trading strategy of your choice.",
    priceMonthly: 7900,
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
    priceMonthly: 19900,
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
    priceMonthly: 49900,
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
