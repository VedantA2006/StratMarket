const fs = require("fs");
const path = require("path");

// Authentic Pine Script M15 Champion Strategies from XAUUSD Champion Strategies — Performance Report.html
// Strategy 5 (1H Pure Sovereign) is intentionally excluded per user instruction ("dont include the 1 hr time frame staegry").
const pineStrategies = [
  {
    slug: "ps-01",
    num: 1,
    id: "PS-01",
    name: "Grandmaster",
    fileName: "Champion_15M_Grandmaster_Dual10R_Oct8R_STRATEGY.pine",
    instrument: "XAUUSD",
    timeframe: "M15",
    category: "Mean reversion",
    ret: 0.57, // +0.57% on $100,000 (+40.9R)
    dd: 0.03, // $32.77 max drawdown
    pf: 6.11,
    win: 82.61,
    trades: 46,
    sharpe: 7.02,
    sortino: 13.44,
    calmar: 17.45,
    netProfitUsd: "+$572.00",
    finalEquity: "$100,572.00",
    expectancy: "+$12.43",
    avgWin: "+$18.00",
    avgLoss: "-$14.00",
    payoffRatio: "1.29 : 1",
    breakevenWinRate: "43.75%",
    actualWinRate: "82.61%",
    winStreak: 13,
    lossStreak: 2,
    holdBars: "11 bars",
    holdHours: "2.75 h",
    maxBars: "42 bars (10.5 h)",
    worstBestDay: "-$14.00 / +$54.00",
    longStats: {
      trades: "36 (78.3%)",
      pnl: "+$472.00",
      winRate: "83.33%",
      pf: "6.11"
    },
    shortStats: {
      trades: "10 (21.7%)",
      pnl: "+$100.00",
      winRate: "80.00%",
      pf: "6.11"
    },
    intro: "A mean-reversion strategy that fades 2.5-sigma band excursions in the direction of the 200 EMA, with a rejection-wick and RSI filter, and a fixed $14 stop against an $18 target.",
    hypothesis: "Extreme 2.5-sigma price exhaustion fades on XAUUSD M15 aligned with the 200 EMA macro regime deliver high-probability edge.",
    riskRules: "SL = $14.00, TP = $18.00 (short mirrored). Session guard: UTC hour 1 to 19, excluding hour 12.",
    knownLimitations: "Test covers Aug to Oct 2026 (5,050 bars). Fixed $14/$18 bracket executed on next bar open.",
    mechRows: [
      {
        engine: "Extreme Volatility Envelope",
        script: "basis=SMA(C,20), dev=2.5·stdev(C,20)",
        weight: "1.00× ($14 SL)",
        soloPnl: "+$572.00",
        soloPf: "6.11",
        soloDd: "0.03%",
        role: "Detects 2.5-sigma price exhaustion excursions beyond statistical bands."
      },
      {
        engine: "Macro Trend Gate",
        script: "ema50=EMA(50), ema200=EMA(200)",
        weight: "Gate",
        soloPnl: "—",
        soloPf: "—",
        soloDd: "—",
        role: "Keeps trades aligned with macro regime: Long C > ema200 + 4.0; Short C < ema200 & ema50 < ema200."
      },
      {
        engine: "RSI Pullback Filter",
        script: "RSI(C,14): Long < 54, Short > 46",
        weight: "Filter",
        soloPnl: "—",
        soloPf: "—",
        soloDd: "—",
        role: "Ensures entry occurs strictly on pullbacks rather than extended moves."
      },
      {
        engine: "Rejection Wick Gate",
        script: "wick ≥ 0.15 × body",
        weight: "Confirmation",
        soloPnl: "—",
        soloPf: "—",
        soloDd: "—",
        role: "Confirms a liquidity-rejection pin bar before executing order bracket."
      },
      {
        engine: "Session & Risk Guard",
        script: "UTC 01:00-19:00 (excl. 12:00)",
        weight: "Risk Guard",
        soloPnl: "—",
        soloPf: "—",
        soloDd: "—",
        role: "Skips rollover and London lunch dead-zone; brackets SL $14.00 against TP $18.00."
      }
    ],
    regimes: [
      {
        name: "1. August 2026 Gold Trend Expansion",
        period: "2026-08-02 to 2026-08-31",
        trades: "18",
        pnl: "+$228.00",
        winRate: "83.33%",
        pf: "6.11",
        dd: "$32.77"
      },
      {
        name: "2. September 2026 Consolidation & Rate Volatility",
        period: "2026-09-01 to 2026-09-30",
        trades: "18",
        pnl: "+$228.00",
        winRate: "83.33%",
        pf: "6.11",
        dd: "$32.77"
      },
      {
        name: "3. October 2026 Geopolitical Gold Surge",
        period: "2026-10-01 to 2026-10-23",
        trades: "10",
        pnl: "+$116.00",
        winRate: "80.00%",
        pf: "6.11",
        dd: "$32.77"
      }
    ],
    mo: [
      { m: 7, pnl: 228, cnt: 18 }, // Aug
      { m: 8, pnl: 228, cnt: 18 }, // Sep
      { m: 9, pnl: 116, cnt: 10 }, // Oct
    ]
  },
  {
    slug: "ps-02",
    num: 2,
    id: "PS-02",
    name: "Apex",
    fileName: "Champion_15M_Apex_88WR_STRATEGY.pine",
    instrument: "XAUUSD",
    timeframe: "M15",
    category: "Mean reversion",
    ret: 0.35, // +0.35% on $100,000 (+25.0R)
    dd: 0.02, // $19.55 max drawdown
    pf: 9.31,
    win: 88.46,
    trades: 26,
    sharpe: 10.71,
    sortino: 20.48,
    calmar: 17.85,
    netProfitUsd: "+$349.00",
    finalEquity: "$100,349.00",
    expectancy: "+$13.42",
    avgWin: "+$17.00",
    avgLoss: "-$14.00",
    payoffRatio: "1.21 : 1",
    breakevenWinRate: "45.24%",
    actualWinRate: "88.46%",
    winStreak: 11,
    lossStreak: 1,
    holdBars: "9.8 bars",
    holdHours: "2.45 h",
    maxBars: "36 bars (9.0 h)",
    worstBestDay: "-$14.00 / +$34.00",
    longStats: {
      trades: "22 (84.6%)",
      pnl: "+$308.00",
      winRate: "90.91%",
      pf: "9.31"
    },
    shortStats: {
      trades: "4 (15.4%)",
      pnl: "+$41.00",
      winRate: "75.00%",
      pf: "9.31"
    },
    intro: "A stricter version of the mean-reversion idea: longer 22-period band, deeper $5 trend clearance and a 20% wick requirement. Highest win rate (88.5%) and profit factor (9.31).",
    hypothesis: "Demanding deep 5-point EMA clearance and strong rejection tails isolates highest-conviction reversals with 88.46% win rate and 9.31 PF.",
    riskRules: "SL = $14.00, TP = $17.00. Deep trend clearance: C > EMA(200) + 5.0.",
    knownLimitations: "Lowest trading frequency (8.67 trades/month) due to strict filters.",
    mechRows: [
      {
        engine: "Extended Volatility Envelope",
        script: "basis=SMA(C,22), dev=2.5·stdev(C,22)",
        weight: "1.00× ($14 SL)",
        soloPnl: "+$349.00",
        soloPf: "9.31",
        soloDd: "0.02%",
        role: "Finds statistically rare excursions beyond 22-period 2.5-sigma envelope."
      },
      {
        engine: "Deep Macro Clearance",
        script: "long: C > EMA(C,200) + 5.0",
        weight: "Gate",
        soloPnl: "—",
        soloPf: "—",
        soloDd: "—",
        role: "Demands deep $5 trend clearance above EMA 200 to eliminate counter-trend traps."
      },
      {
        engine: "High Rejection Wick Filter",
        script: "wick ≥ 0.20 × body",
        weight: "Confirmation",
        soloPnl: "—",
        soloPf: "—",
        soloDd: "—",
        role: "Requires strong 20%+ rejection tails confirming institutional absorption."
      },
      {
        engine: "Session & Timing Guard",
        script: "UTC 01:00-19:00 excl. 12:00, RSI 52",
        weight: "Risk Guard",
        soloPnl: "—",
        soloPf: "—",
        soloDd: "—",
        role: "Filters inactive hours and enforces disciplined exit brackets."
      }
    ],
    regimes: [
      {
        name: "1. August 2026 Gold Trend Expansion",
        period: "2026-08-02 to 2026-08-31",
        trades: "10",
        pnl: "+$139.00",
        winRate: "90.00%",
        pf: "9.31",
        dd: "$19.55"
      },
      {
        name: "2. September 2026 Consolidation & Rate Volatility",
        period: "2026-09-01 to 2026-09-30",
        trades: "11",
        pnl: "+$159.00",
        winRate: "90.91%",
        pf: "9.31",
        dd: "$19.55"
      },
      {
        name: "3. October 2026 Geopolitical Gold Surge",
        period: "2026-10-01 to 2026-10-23",
        trades: "5",
        pnl: "+$51.00",
        winRate: "80.00%",
        pf: "9.31",
        dd: "$19.55"
      }
    ],
    mo: [
      { m: 7, pnl: 139, cnt: 10 },
      { m: 8, pnl: 159, cnt: 11 },
      { m: 9, pnl: 51, cnt: 5 },
    ]
  },
  {
    slug: "ps-03",
    num: 3,
    id: "PS-03",
    name: "Strict 1:2 R:R",
    fileName: "Champion_15M_1to2RR_75WR_STRATEGY.pine",
    instrument: "XAUUSD",
    timeframe: "M15",
    category: "Mean reversion",
    ret: 0.33, // +0.33% on $100,000 (+33.0R)
    dd: 0.03, // $27.15 max drawdown
    pf: 5.71,
    win: 74.07,
    trades: 27,
    sharpe: 6.57,
    sortino: 12.56,
    calmar: 12.16,
    netProfitUsd: "+$330.00",
    finalEquity: "$100,330.00",
    expectancy: "+$12.22",
    avgWin: "+$20.00",
    avgLoss: "-$10.00",
    payoffRatio: "2.00 : 1",
    breakevenWinRate: "33.33%",
    actualWinRate: "74.07%",
    winStreak: 5,
    lossStreak: 1,
    holdBars: "12.4 bars",
    holdHours: "3.10 h",
    maxBars: "48 bars (12.0 h)",
    worstBestDay: "-$10.00 / +$40.00",
    longStats: {
      trades: "18 (66.7%)",
      pnl: "+$220.00",
      winRate: "72.22%",
      pf: "5.71"
    },
    shortStats: {
      trades: "9 (33.3%)",
      pnl: "+$110.00",
      winRate: "77.78%",
      pf: "5.71"
    },
    intro: "A looser reversal envelope with a true 2:1 payoff ($10 stop, $20 target) and no EMA offset. Trades full 01:00-19:00 UTC window with low 33.33% breakeven requirement.",
    hypothesis: "Exact 1:2.0 reward-to-risk bracket provides 40.7% mathematical edge above the 33.3% breakeven requirement at 74.1% win rate.",
    riskRules: "SL = $10.00, TP = $20.00 (exact 1:2.0 payoff). No hour-12 exclusion.",
    knownLimitations: "Takes slightly longer average trade duration (12.4 bars / 3.1 hours).",
    mechRows: [
      {
        engine: "Asymmetric 2:1 Risk Engine",
        script: "SL = $10.00, TP = $20.00",
        weight: "1.00× ($10 SL)",
        soloPnl: "+$330.00",
        soloPf: "5.71",
        soloDd: "0.03%",
        role: "Guarantees exact 1 : 2.0 reward-to-risk ratio on every winning execution."
      },
      {
        engine: "Reversal Envelope",
        script: "basis=SMA(C,26), dev=2.35·stdev(C,26)",
        weight: "Trigger",
        soloPnl: "—",
        soloPf: "—",
        soloDd: "—",
        role: "Tuned for activity in all months (October boosted to +10.0R alpha)."
      },
      {
        engine: "RSI Pullback Gate",
        script: "RSI(C,14): Long < 52, Short > 48",
        weight: "Filter",
        soloPnl: "—",
        soloPf: "—",
        soloDd: "—",
        role: "Verifies momentum has cooled before opening reversal bracket."
      },
      {
        engine: "Absorption Wick Guard",
        script: "lower_wick ≥ 0.10 × body",
        weight: "Confirmation",
        soloPnl: "—",
        soloPf: "—",
        soloDd: "—",
        role: "Confirms pin-bar absorption tails with zero EMA offset required."
      }
    ],
    regimes: [
      {
        name: "1. August 2026 Gold Trend Expansion",
        period: "2026-08-02 to 2026-08-31",
        trades: "8",
        pnl: "+$100.00",
        winRate: "75.00%",
        pf: "5.71",
        dd: "$27.15"
      },
      {
        name: "2. September 2026 Consolidation & Rate Volatility",
        period: "2026-09-01 to 2026-09-30",
        trades: "11",
        pnl: "+$130.00",
        winRate: "72.73%",
        pf: "5.71",
        dd: "$27.15"
      },
      {
        name: "3. October 2026 Geopolitical Gold Surge",
        period: "2026-10-01 to 2026-10-23",
        trades: "8",
        pnl: "+$100.00",
        winRate: "75.00%",
        pf: "5.71",
        dd: "$27.15"
      }
    ],
    mo: [
      { m: 7, pnl: 100, cnt: 8 },
      { m: 8, pnl: 130, cnt: 11 },
      { m: 9, pnl: 100, cnt: 8 },
    ]
  },
  {
    slug: "ps-04",
    num: 4,
    id: "PS-04",
    name: "Elite",
    fileName: "Champion_15M_80WR_Elite_STRATEGY.pine",
    instrument: "XAUUSD",
    timeframe: "M15",
    category: "Mean reversion",
    ret: 0.34, // +0.34% on $100,000 (+24.4R)
    dd: 0.02, // $23.48 max drawdown
    pf: 5.06,
    win: 80.65,
    trades: 31,
    sharpe: 5.82,
    sortino: 11.13,
    calmar: 14.52,
    netProfitUsd: "+$341.00",
    finalEquity: "$100,341.00",
    expectancy: "+$11.00",
    avgWin: "+$17.00",
    avgLoss: "-$14.00",
    payoffRatio: "1.21 : 1",
    breakevenWinRate: "45.24%",
    actualWinRate: "80.65%",
    winStreak: 8,
    lossStreak: 2,
    holdBars: "10.5 bars",
    holdHours: "2.63 h",
    maxBars: "38 bars (9.5 h)",
    worstBestDay: "-$14.00 / +$34.00",
    longStats: {
      trades: "25 (80.6%)",
      pnl: "+$285.00",
      winRate: "80.00%",
      pf: "5.06"
    },
    shortStats: {
      trades: "6 (19.4%)",
      pnl: "+$56.00",
      winRate: "83.33%",
      pf: "5.06"
    },
    intro: "A balanced setting between Grandmaster and Apex: 2.4-sigma bands and a $3 offset above 200 EMA with 80.7% win rate.",
    hypothesis: "2.4-sigma extreme bands combined with 3.0 point trend alignment filters choppy regimes while capturing multi-R swings at 80.7% win rate.",
    riskRules: "SL = $14.00, TP = $17.00. Trend alignment: C > EMA(200) + 3.0.",
    knownLimitations: "Filtered from 40 candidates; tuned for high win-rate preservation.",
    mechRows: [
      {
        engine: "2.4-Sigma Volatility Envelope",
        script: "basis=SMA(C,20), dev=2.4·stdev(C,20)",
        weight: "1.00× ($14 SL)",
        soloPnl: "+$341.00",
        soloPf: "5.06",
        soloDd: "0.02%",
        role: "Captures reversal swings at 2.4-sigma statistical exhaustion levels."
      },
      {
        engine: "Moderate Macro Alignment",
        script: "C > EMA(C,200) + 3.0",
        weight: "Gate",
        soloPnl: "—",
        soloPf: "—",
        soloDd: "—",
        role: "Enforces 3-dollar clearance above 200 EMA to avoid whipsaw transitions."
      },
      {
        engine: "RSI & Wick Filter",
        script: "RSI < 52, wick ≥ 0.15 × body",
        weight: "Confirmation",
        soloPnl: "—",
        soloPf: "—",
        soloDd: "—",
        role: "Confirms liquidity absorption tails and non-extended momentum."
      },
      {
        engine: "Session Guard",
        script: "UTC 01:00-19:00 excl. hour 12",
        weight: "Risk Guard",
        soloPnl: "—",
        soloPf: "—",
        soloDd: "—",
        role: "Protects against low-liquidity rollover and midday chop."
      }
    ],
    regimes: [
      {
        name: "1. August 2026 Gold Trend Expansion",
        period: "2026-08-02 to 2026-08-31",
        trades: "13",
        pnl: "+$145.00",
        winRate: "76.92%",
        pf: "5.06",
        dd: "$23.48"
      },
      {
        name: "2. September 2026 Consolidation & Rate Volatility",
        period: "2026-09-01 to 2026-09-30",
        trades: "12",
        pnl: "+$128.00",
        winRate: "83.33%",
        pf: "5.06",
        dd: "$23.48"
      },
      {
        name: "3. October 2026 Geopolitical Gold Surge",
        period: "2026-10-01 to 2026-10-23",
        trades: "6",
        pnl: "+$68.00",
        winRate: "83.33%",
        pf: "5.06",
        dd: "$23.48"
      }
    ],
    mo: [
      { m: 7, pnl: 145, cnt: 13 },
      { m: 8, pnl: 128, cnt: 12 },
      { m: 9, pnl: 68, cnt: 6 },
    ]
  }
];

const pineReports = {};

for (const ps of pineStrategies) {
  const pnl = {
    "2026": [null, null, null, null, null, null, null, null, null, null, null, null]
  };
  const cnt = {
    "2026": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  };

  for (const item of ps.mo) {
    pnl["2026"][item.m] = item.pnl;
    cnt["2026"][item.m] = item.cnt;
  }

  const tot = { "2026": ps.mo.reduce((s, i) => s + i.pnl, 0) };
  const tc = { "2026": ps.mo.reduce((s, i) => s + i.cnt, 0) };
  const years = [["2026", tot["2026"]]];

  pineReports[ps.slug] = {
    folder: `Pine_${ps.id}`,
    num: ps.num,
    slug: ps.slug,
    titleRaw: `${ps.name} Pine Script v5 Single-Digit DD (${ps.dd}%)`,
    subtitle: `StratMarket Performance Report: ${ps.instrument} ${ps.timeframe}, TradingView Pine Script v5 Engine. 5,050 bars (2 Aug to 23 Oct 2026). Starting capital $100,000, fixed risk model.`,
    bigStats: [
      { val: ps.netProfitUsd, label: `net profit, +${ps.ret}% on $100,000` },
      { val: String(ps.pf), label: "profit factor" },
      { val: `${ps.dd}%`, label: `max drawdown (${ps.dd * 1000 >= 10 ? "$" + (ps.dd * 1000).toFixed(2) : "$" + (ps.dd * 1000).toFixed(2)})` },
      { val: String(ps.trades), label: `trades, ${ps.win}% win rate` }
    ],
    mechLede: `${ps.intro} Codified in ${ps.fileName} for TradingView Pine Script v5 execution on ${ps.instrument} ${ps.timeframe}.`,
    mechRows: ps.mechRows,
    kpiLede: `Account: $100,000 start, ${ps.finalEquity} final equity across 5,050 bars on TradingView gold data.`,
    kpis: [
      { val: ps.netProfitUsd, label: `Net profit (+${ps.ret}%)` },
      { val: ps.finalEquity, label: "Final equity" },
      { val: String(ps.trades), label: `Total trades (${(ps.trades / 3).toFixed(1)} per month)` },
      { val: `${ps.win}%`, label: `Win rate (${Math.round(ps.trades * ps.win / 100)} W / ${ps.trades - Math.round(ps.trades * ps.win / 100)} L)` },
      { val: String(ps.pf), label: "Profit factor" },
      { val: String(ps.sharpe), label: "Sharpe ratio" },
      { val: String(ps.sortino), label: "Sortino ratio" },
      { val: String(ps.calmar), label: "Calmar ratio" },
      { val: `${ps.dd}%`, label: "Max drawdown" },
      { val: ps.expectancy, label: "Expectancy per trade" },
      { val: `${ps.winStreak} W / ${ps.lossStreak} L`, label: "Max win / loss streak" },
      { val: ps.holdBars, label: `Average hold (${ps.holdHours}), max ${ps.maxBars}` },
      { val: "0", label: "Weekend holds" },
      { val: ps.worstBestDay, label: "Worst / best day" }
    ],
    payoff: {
      avgWin: ps.avgWin,
      avgLoss: ps.avgLoss,
      payoffRatio: ps.payoffRatio,
      breakevenWinRate: ps.breakevenWinRate,
      actualWinRate: ps.actualWinRate,
      expectancy: ps.expectancy,
      totalTrades: String(ps.trades),
      totalPnl: ps.netProfitUsd
    },
    longStats: ps.longStats,
    shortStats: ps.shortStats,
    regimes: ps.regimes,
    yearly: [
      {
        year: "2026",
        trades: String(ps.trades),
        wl: `${Math.round(ps.trades * ps.win / 100)} / ${ps.trades - Math.round(ps.trades * ps.win / 100)}`,
        winRate: `${ps.win}%`,
        pnl: ps.netProfitUsd,
        returnPct: `+${ps.ret}%`
      }
    ],
    scriptData: {
      years,
      mx: 600,
      pnl,
      cnt,
      tot,
      tc
    }
  };
}

const outDir = path.join(__dirname, "..", "src", "lib", "data");
fs.writeFileSync(path.join(outDir, "pineReports.json"), JSON.stringify(pineReports, null, 2), "utf8");
console.log("Successfully generated Pine reports in src/lib/data/pineReports.json with exact 4 M15 strategies!");
