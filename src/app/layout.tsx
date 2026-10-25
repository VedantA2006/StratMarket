import type { Metadata } from "next";
import "./globals.css";
import { TopProgressBar } from "@/components/TopProgressBar";
import { HeaderNav } from "@/components/HeaderNav";
import { DockNav } from "@/components/DockNav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "StratMarket by Elvaris Capital — The Marketplace for AI-Researched Trading Strategies",
  description:
    "Discover, backtest, and trial quantitative trading strategies for Python and Pine Script engineered by Elvaris Capital. Real-time signals, rigorous risk controls, and automated broker routing.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="fx" aria-hidden="true">
          <i className="a1" />
        </div>
        <TopProgressBar />
        <HeaderNav />
        <main>{children}</main>
        <Footer />
        <DockNav />
      </body>
    </html>
  );
}
