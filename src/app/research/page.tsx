import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quant Research Process — StratMarket by Elvaris Capital",
  description: "Learn how Elvaris Capital generates, backtests, refines, and validates systematic trading strategies.",
};

export default function ResearchPage() {
  return (
    <div className="page" id="p-research">
      <section className="b">
        <div className="wrap">
          <h2>From hypothesis to strategy.</h2>
          <p className="lede">
            Every candidate strategy undergoes rigorous quant verification. No results are curve-fitted, parameters are locked before out-of-sample evaluation, and execution latency is accounted for.
          </p>

          <div className="pipe" id="pipe">
            <div className="st">
              <div className="n">1</div>
              <h3>Generate</h3>
              <p>AI-assisted research turns a quantitative hypothesis into strictly codified testable rules.</p>
            </div>
            <div className="st">
              <div className="n">2</div>
              <h3>Backtest</h3>
              <p>Rules run on tick-level historical data with realistic fixed costs and zero look-ahead bias.</p>
            </div>
            <div className="st">
              <div className="n">3</div>
              <h3>Improve</h3>
              <p>Weak spots and regime transitions are reviewed; improvements are committed as immutable versions.</p>
            </div>
            <div className="st">
              <div className="n">4</div>
              <h3>Validate</h3>
              <p>Multi-window robustness, Monte Carlo stress testing, and out-of-sample periods decide listing approval.</p>
            </div>
          </div>

          <div style={{ marginTop: "80px" }}>
            <h2 style={{ fontSize: "36px" }}>Questions, answered.</h2>

            <details>
              <summary>Are these results real or hypothetical?</summary>
              <p>
                Metrics in the marketplace reflect systematic backtest and paper simulation evaluations using historical tick data. All models are clearly labeled with their validation type (Backtested, Forward-Tested, Simulated). Live trading performance is never fabricated.
              </p>
            </details>

            <details>
              <summary>What is out-of-sample testing?</summary>
              <p>
                A strategy's rules and parameters are discovered exclusively on the training window (70% of dataset). The strategy is then executed blindly on the remaining unseen out-of-sample period (30%) to guarantee it has not memorized historical market noise.
              </p>
            </details>

            <details>
              <summary>Do strategies get versioned?</summary>
              <p>
                Yes. Every parameter change or logic update produces a new immutable version identifier (e.g. v1.2.0). Previous versions, reports, and provenance remain accessible to users so historical accountability is preserved.
              </p>
            </details>

            <details>
              <summary>Where do the Python strategies run?</summary>
              <p>
                The Python algorithms run in an isolated execution container on an Elvaris Capital VPS with sub-millisecond connectivity to major liquidity providers (LD4/NY4). Next.js communicates with this runner over an authenticated HMAC SHA-256 server-to-server gateway.
              </p>
            </details>

            <details>
              <summary>How is slippage and commission calculated?</summary>
              <p>
                Every report incorporates realistic transaction costs (e.g. $2.50/lot commission + 0.5 pip spread) and dynamic slippage assumptions (1.0 pip on entry and stop triggers) to ensure metrics reflect real-world execution drag.
              </p>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}
