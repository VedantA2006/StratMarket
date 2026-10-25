import { db } from "@/lib/db";
import { MarketplaceCatalogue } from "@/components/MarketplaceCatalogue";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Strategy Marketplace — StratMarket by Elvaris Capital",
  description: "Browse 14 systematic Python and Pine Script trading strategies. Filter by instrument, timeframe, and category with audited backtest reports.",
};

export default async function MarketPage() {
  const strategies = await db.getStrategies({ includeDrafts: false });

  return (
    <div className="page" id="p-market">
      <section className="b">
        <div className="wrap">
          <h2>Marketplace</h2>
          <p className="lede">
            14 researched trading strategies evaluated by the Elvaris Capital quant engine. Real database-backed queries with multi-dimensional filtering, provenance data, and 7-day trials.
          </p>
          <MarketplaceCatalogue initialStrategies={strategies} />
        </div>
      </section>
    </div>
  );
}
