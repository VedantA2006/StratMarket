import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { StrategyReportView } from "@/components/StrategyReportView";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const strategies = await db.getStrategies({ includeDrafts: true });
  return strategies.map((s) => ({
    slug: s.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const strategy = await db.getStrategyBySlug(slug);

  if (!strategy) {
    return {
      title: "Strategy Not Found — StratMarket",
    };
  }

  return {
    title: `${strategy.name} (${strategy.id}) Performance Report — StratMarket`,
    description: `${strategy.description} Audited institutional metrics: Net Return +${strategy.metrics.netReturn}%, Max Drawdown ${strategy.metrics.maxDrawdown}%, Profit Factor ${strategy.metrics.profitFactor}.`,
  };
}

export default async function StrategyReportPage({ params }: Props) {
  const { slug } = await params;
  const strategy = await db.getStrategyBySlug(slug);

  if (!strategy) {
    notFound();
  }

  return (
    <div className="page" id="p-strategy-report" style={{ minHeight: "100vh", paddingTop: "20px" }}>
      <StrategyReportView strategy={strategy} />
    </div>
  );
}
