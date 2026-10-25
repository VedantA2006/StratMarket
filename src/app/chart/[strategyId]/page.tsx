import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { StrategyChart } from "@/components/chart/StrategyChart";
import type { Metadata } from "next";

interface Props {
  params: Promise<{
    strategyId: string;
  }>;
}

export const instant = false;

export async function generateStaticParams() {
  const strategies = await db.getStrategies({ includeDrafts: true });
  const params: { strategyId: string }[] = [];
  strategies.forEach((s) => {
    params.push({ strategyId: s.id });
    params.push({ strategyId: s.slug });
  });
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { strategyId } = await params;
  const strategy = await db.getStrategyBySlug(strategyId);

  if (!strategy) {
    return {
      title: "Strategy Chart — StratMarket by Elvaris Capital",
    };
  }

  return {
    title: `${strategy.name} (${strategy.id}) Live Chart — StratMarket`,
    description: `Interactive LuxAlgo Vela charting terminal with live market data and private Pine Script execution overlays for ${strategy.name} (${strategy.instrument} ${strategy.timeframe}).`,
  };
}

export default async function ChartPage({ params }: Props) {
  const { strategyId } = await params;
  const strategy = await db.getStrategyBySlug(strategyId);

  if (!strategy) {
    notFound();
  }

  return (
    <main className="chart-page-fullscreen">
      <StrategyChart strategyId={strategy.id} />
    </main>
  );
}
