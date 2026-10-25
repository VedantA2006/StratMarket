import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works — StratMarket by Elvaris Capital",
  description: "Step-by-step walkthrough of finding, evaluating, trialing, and connecting trading strategies on StratMarket.",
};

export default function HowPage() {
  return (
    <div className="page" id="p-how">
      <section className="b">
        <div className="wrap">
          <h2>How StratMarket works.</h2>
          <p className="lede">From first look to live execution in five systematic steps.</p>

          <div className="tl" id="tl">
            <i style={{ height: "100%" }} />

            <div className="ts">
              <h3>1. Discover a strategy</h3>
              <p>
                Filter the catalogue by asset class (Gold, FX, Nasdaq, Bitcoin, S&amp;P), timeframe (M15 to D1), and strategy philosophy (Trend, Mean Reversion, Breakout, Volatility).
              </p>
            </div>

            <div className="ts">
              <h3>2. Read its research report</h3>
              <p>
                Every strategy includes full quant documentation: the governing economic hypothesis, backtest data provenance, risk caps, parameter stability tests, and limitations.
              </p>
            </div>

            <div className="ts">
              <h3>3. Explore charts and signals</h3>
              <p>
                Inspect detailed equity curves, historical drawdown recovery times, win rates, and profit factors with interactive tooltips and historical signal logs.
              </p>
            </div>

            <div className="ts">
              <h3>4. Start a seven-day trial</h3>
              <p>
                Instantly activate a server-enforced 7-day trial on any eligible strategy. Full access to real-time signals and research reports without providing payment details upfront.
              </p>
            </div>

            <div className="ts">
              <h3>5. Choose how to use it</h3>
              <p>
                Select your preferred delivery mode: view signals on live interactive charts, receive instant email trade alerts, or configure automated broker routing via Alpaca, Binance, or the Virtual Paper Simulator.
              </p>
            </div>
          </div>

          <div style={{ marginTop: "40px" }}>
            <Link className="pill" href="/market">
              Explore the strategy catalogue
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
