import Link from "next/link";

export function Footer() {
  return (
    <footer>
      <div className="wrap">
        <b>StratMarket</b>
        <p style={{ marginTop: "4px" }}>
          <Link href="/market" style={{ marginRight: "12px" }}>
            Marketplace
          </Link>
          <Link href="/research" style={{ marginRight: "12px" }}>
            Research
          </Link>
          <Link href="/how" style={{ marginRight: "12px" }}>
            How it works
          </Link>
          <Link href="/pricing" style={{ marginRight: "12px" }}>
            Pricing
          </Link>
          <a
            href="https://elvariscapital.in"
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginRight: "12px" }}
          >
            Elvaris Capital ↗
          </a>
        </p>
        <p>
          StratMarket is the algorithmic trading strategy marketplace operated by Elvaris Capital.
          All strategies, backtest metrics, charts, and signals are systematically evaluated by the research engine and presented with rigorous data provenance. Trading foreign exchange, indices, equities, and commodities carries substantial risk of loss. Past backtested performance is no guarantee of future results.
        </p>
      </div>
    </footer>
  );
}
