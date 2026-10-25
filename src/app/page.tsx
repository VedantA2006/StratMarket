import Link from "next/link";
import { db } from "@/lib/db";
import { TerrainCanvas } from "@/components/TerrainCanvas";
import { AnimatedStats } from "@/components/AnimatedStats";
import { IndexPreview } from "@/components/IndexPreview";
import { ThreeWaysSection } from "@/components/ThreeWaysSection";

export default async function HomePage() {
  const strategies = await db.getStrategies({ includeDrafts: false });

  return (
    <div className="page" id="p-home">
      {/* Hero Section */}
      <div className="h0">
        <div className="hc">
          <span className="tag">
            <b>New</b> StratMarket, by Elvaris Capital
          </span>
          <h1>Research-driven strategies. Built for the markets.</h1>
          <p>
            Discover algorithmic trading strategies developed through AI-assisted research, systematic backtesting and iterative improvement.
          </p>
          <div className="cta" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link className="pill" href="/market">
              Explore strategies
            </Link>
            <Link className="pill g" href="/research">
              Our research process
            </Link>
          </div>
        </div>

        {/* Dynamic Terrain Canvas */}
        <div className="tband">
          <TerrainCanvas />
        </div>
        <p className="note" style={{ textAlign: "center", margin: "8px 0 48px" }}>
          Simulated price terrain · illustrative
        </p>
      </div>

      {/* Stats Counter */}
      <AnimatedStats />

      {/* From Hypothesis to Strategy Pipeline */}
      <section className="b" style={{ paddingBottom: "40px" }}>
        <div className="wrap">
          <h2 style={{ marginBottom: "32px" }}>From hypothesis to strategy.</h2>
          <div className="pipe">
            <div className="st">
              <div className="n">1</div>
              <h3>Generate</h3>
              <p>AI-assisted research turns a hypothesis into testable rules.</p>
            </div>
            <div className="st">
              <div className="n">2</div>
              <h3>Backtest</h3>
              <p>Every candidate runs on historical data with fixed costs.</p>
            </div>
            <div className="st">
              <div className="n">3</div>
              <h3>Improve</h3>
              <p>Weak spots are reviewed; changes become new versions.</p>
            </div>
            <div className="st">
              <div className="n">4</div>
              <h3>Validate</h3>
              <p>Robustness and out-of-sample tests decide what is listed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Index Preview */}
      <section className="b">
        <div className="wrap">
          <h2>The index.</h2>
          <p className="lede">
            A first look at the catalogue. Hover a row for a preview, click to open the research report. Metrics are illustrative.
          </p>
          <IndexPreview initialStrategies={strategies} />
          <p style={{ marginTop: "32px" }}>
            <Link className="pill" href="/market">
              View all 14 strategies
            </Link>
          </p>
        </div>
      </section>

      {/* Three Ways to Use a Strategy */}
      <ThreeWaysSection />

      {/* 7-Day Trial Call-To-Action */}
      <section className="b" style={{ paddingTop: 0, paddingBottom: "150px", overflow: "hidden" }}>
        <div className="wrap" style={{ textAlign: "center", position: "relative" }}>
          <h2 style={{ fontSize: "clamp(40px, 7vw, 104px)" }}>
            Seven days to explore your next strategy.
          </h2>
          <p className="lede" style={{ marginInline: "auto" }}>
            Start a demo trial on any listed strategy. Pricing to be announced; no payment is taken here.
          </p>
          <Link className="pill" href="/market">
            Choose a strategy
          </Link>
        </div>
      </section>
    </div>
  );
}
