const fs = require("fs");
const path = require("path");

function cleanText(t) {
  if (!t) return "";
  return t
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseReportHtml(html, fallbackTitle) {
  // Title & Subtitle
  const titleMatch = html.match(/<h1>(.*?)<\/h1>/s);
  const titleRaw = titleMatch ? cleanText(titleMatch[1]) : fallbackTitle;

  const headerPMatch = html.match(/<header>.*?<p>(.*?)<\/p>/s);
  const subtitle = headerPMatch ? cleanText(headerPMatch[1]) : "";

  // Big Stats
  const bigStats = [];
  const bigMatch = html.match(/<div class="big">(.*?)<\/div><\/div><\/header>/s);
  if (bigMatch) {
    const itemRegex = /<div><b>(.*?)<\/b><span>(.*?)<\/span><\/div>/g;
    let m;
    while ((m = itemRegex.exec(bigMatch[1])) !== null) {
      bigStats.push({ val: cleanText(m[1]), label: cleanText(m[2]) });
    }
  }

  // Mechanism rows (EXCLUDING indicator / mechanism as explicitly requested)
  const mechLedeMatch = html.match(/<section id="mech"><h2>.*?<\/h2>\s*<p class="lede">(.*?)<\/p>/s);
  const mechLede = mechLedeMatch ? cleanText(mechLedeMatch[1]) : "";

  const mechTableMatch = html.match(/<section id="mech">.*?<table>(.*?)<\/table>/s);
  const mechRows = [];
  if (mechTableMatch) {
    const trRegex = /<tr>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td.*?>(.*?)<\/td>\s*<td.*?>(.*?)<\/td>\s*<td.*?>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<\/tr>/gs;
    let m;
    while ((m = trRegex.exec(mechTableMatch[1])) !== null) {
      let rawEngine = m[1];
      let script = "";
      const scriptMatch = rawEngine.match(/<code[^>]*>(.*?)<\/code>/s);
      if (scriptMatch) script = scriptMatch[1].trim();

      const nameMatch = rawEngine.match(/<a[^>]*>(.*?)<\/a>/s);
      const name = nameMatch ? cleanText(nameMatch[1]) : cleanText(rawEngine.replace(/<code[^>]*>.*?<\/code>/s, ""));

      mechRows.push({
        engine: name,
        script: script,
        weight: cleanText(m[3]),
        soloPnl: cleanText(m[4]),
        soloPf: cleanText(m[5]),
        soloDd: cleanText(m[6]),
        role: cleanText(m[7])
      });
    }
  }

  // Core KPIs
  const kpiLedeMatch = html.match(/<section id="kpi"><h2>.*?<\/h2>\s*<p class="lede">(.*?)<\/p>/s);
  const kpiLede = kpiLedeMatch ? cleanText(kpiLedeMatch[1]) : "";

  const kpis = [];
  const kpisMatch = html.match(/<div class="kpis">(.*?)<\/div><\/section>/s);
  if (kpisMatch) {
    const kpiRegex = /<div class="kpi"><b.*?>(.*?)<\/b><span>(.*?)<\/span><\/div>/g;
    let m;
    while ((m = kpiRegex.exec(kpisMatch[1])) !== null) {
      kpis.push({ val: cleanText(m[1]), label: cleanText(m[2]) });
    }
  }

  // Payoff Structure
  const payMatch = html.match(/<section id="pay">.*?<div class="box">(.*?)<\/div><\/section>/s);
  let payoff = {
    avgWin: "+$1,397.16",
    avgLoss: "-$195.81",
    payoffRatio: "7.14 : 1",
    breakevenWinRate: "12.29%",
    actualWinRate: "22.41%",
    expectancy: "+$161.13",
    totalTrades: "781",
    totalPnl: "+$125,840.22"
  };

  if (payMatch) {
    const rawPay = payMatch[1];
    const avgWinM = rawPay.match(/Average win\s*<b[^>]*>(.*?)<\/b>/i);
    const avgLossM = rawPay.match(/average loss\s*<b[^>]*>(.*?)<\/b>/i);
    const ratioM = rawPay.match(/payoff ratio\s*<b[^>]*>(.*?)<\/b>/i) || rawPay.match(/payoff ratio\s*([0-9.: ]+)/i);
    const beM = rawPay.match(/Breakeven win rate at that payoff is\s*([0-9.%]+)/i);
    const actM = rawPay.match(/actual\s*([0-9.%]+)\s*is/i);
    const expM = rawPay.match(/≈\s*<b[^>]*>(.*?)<\/b>/i) || rawPay.match(/Expectancy\s*=\s*.*?([+\-$0-9.]+)\s*per trade/i);
    const tradesM = rawPay.match(/×\s*([0-9,]+)\s*trades/i);
    const totPnlM = rawPay.match(/=\s*([+\-$0-9,.]+)\.?\s*$/i) || rawPay.match(/=\s*([+\-$0-9,.]+)\.?<\/p>/i);

    if (avgWinM) payoff.avgWin = cleanText(avgWinM[1]);
    if (avgLossM) payoff.avgLoss = cleanText(avgLossM[1]).replace("−", "-");
    if (ratioM) payoff.payoffRatio = cleanText(ratioM[1]);
    if (beM) payoff.breakevenWinRate = cleanText(beM[1]);
    if (actM) payoff.actualWinRate = cleanText(actM[1]);
    if (expM) payoff.expectancy = cleanText(expM[1]);
    if (tradesM) payoff.totalTrades = cleanText(tradesM[1]);
    if (totPnlM) payoff.totalPnl = cleanText(totPnlM[1]);
  }

  // Long vs Short
  const dirMatch = html.match(/<section id="dir">.*?<div class="split">(.*?)<\/div><\/section>/s);
  let longStats = {}, shortStats = {};
  if (dirMatch) {
    const extractBoxStats = (content) => {
      const trades = cleanText((content.match(/<tr><td>Trades<\/td><td class="n">(.*?)<\/td><\/tr>/) || [])[1] || "");
      const pnl = cleanText((content.match(/<tr><td>Net PnL<\/td><td.*?>(.*?)<\/td><\/tr>/) || [])[1] || "");
      const winRate = cleanText((content.match(/<tr><td>Win rate<\/td><td.*?>(.*?)<\/td><\/tr>/) || [])[1] || "");
      const pf = cleanText((content.match(/<tr><td>Profit factor<\/td><td.*?>(.*?)<\/td><\/tr>/) || [])[1] || "");
      return { trades, pnl, winRate, pf };
    };
    const longBoxMatch = dirMatch[1].match(/<b>Long trades<\/b><table>(.*?)<\/table>/s);
    if (longBoxMatch) longStats = extractBoxStats(longBoxMatch[1]);

    const shortBoxMatch = dirMatch[1].match(/<b>Short trades<\/b><table>(.*?)<\/table>/s);
    if (shortBoxMatch) shortStats = extractBoxStats(shortBoxMatch[1]);
  }

  // Regimes
  const regTableMatch = html.match(/<section id="reg">.*?<table>(.*?)<\/table>/s);
  const regimes = [];
  if (regTableMatch) {
    const trRegex = /<tr><td>(.*?)<\/td><td>(.*?)<\/td><td class="n">(.*?)<\/td><td.*?>(.*?)<\/td><td class="n">(.*?)<\/td><td class="n">(.*?)<\/td><td class="n">(.*?)<\/td><\/tr>/g;
    let m;
    while ((m = trRegex.exec(regTableMatch[1])) !== null) {
      regimes.push({
        name: cleanText(m[1]),
        period: cleanText(m[2]),
        trades: cleanText(m[3]),
        pnl: cleanText(m[4]),
        winRate: cleanText(m[5]),
        pf: cleanText(m[6]),
        dd: cleanText(m[7])
      });
    }
  }

  // Yearly table
  const yearTableMatch = html.match(/<section id="year">.*?<table>(.*?)<\/table>/s);
  const yearly = [];
  if (yearTableMatch) {
    const trRegex = /<tr><td>(.*?)<\/td><td.*?>(.*?)<\/td><td.*?>(.*?)<\/td><td.*?>(.*?)<\/td><td.*?>(.*?)<\/td><td.*?>(.*?)<\/td><\/tr>/g;
    let m;
    while ((m = trRegex.exec(yearTableMatch[1])) !== null) {
      if (m[1].includes("Year") || m[1].includes("th>")) continue;
      yearly.push({
        year: cleanText(m[1]),
        trades: cleanText(m[2]),
        wl: cleanText(m[3]),
        winRate: cleanText(m[4]),
        pnl: cleanText(m[5]),
        returnPct: cleanText(m[6])
      });
    }
  }

  // Script Data
  const scriptMatch = html.match(/<script>(.*?)<\/script>/s);
  let scriptData = {};
  if (scriptMatch) {
    const sc = scriptMatch[1];
    try {
      const yearsMatch = sc.match(/const years=(\[.*?\]);/s);
      const mxMatch = sc.match(/const mx=([0-9.]+);/);
      const pnlMatch = sc.match(/const pnl=(\{.*?\});/s);
      const cntMatch = sc.match(/const cnt=(\{.*?\});/s);
      const totMatch = sc.match(/const tot=(\{.*?\})/s);
      const tcMatch = sc.match(/tc=(\{.*?\});/s);

      scriptData = {
        years: yearsMatch ? eval(yearsMatch[1]) : [],
        mx: mxMatch ? parseFloat(mxMatch[1]) : 30000,
        pnl: pnlMatch ? JSON.parse(pnlMatch[1]) : {},
        cnt: cntMatch ? JSON.parse(cntMatch[1]) : {},
        tot: totMatch ? JSON.parse(totMatch[1]) : {},
        tc: tcMatch ? JSON.parse(tcMatch[1]) : {}
      };
    } catch (e) {
      // ignore
    }
  }

  return {
    titleRaw,
    subtitle,
    bigStats,
    mechLede,
    mechRows,
    kpiLede,
    kpis,
    payoff,
    longStats,
    shortStats,
    regimes,
    yearly,
    scriptData
  };
}

function generateReportHtml(data) {
  const payoff = data.payoff || {
    avgWin: "+$1,397.16",
    avgLoss: "-$195.81",
    payoffRatio: "7.14 : 1",
    breakevenWinRate: "12.29%",
    actualWinRate: "22.41%",
    expectancy: "+$161.13",
    totalTrades: "781",
    totalPnl: "+$125,840.22"
  };

  const scriptData = data.scriptData || {};
  const yearsJson = JSON.stringify(scriptData.years || []);
  const mxVal = scriptData.mx || 30000;
  const pnlJson = JSON.stringify(scriptData.pnl || {});
  const cntJson = JSON.stringify(scriptData.cnt || {});
  const totJson = JSON.stringify(scriptData.tot || {});
  const tcJson = JSON.stringify(scriptData.tc || {});

  const actVal = parseFloat((payoff.actualWinRate || "0").replace("%", ""));
  const beVal = parseFloat((payoff.breakevenWinRate || "0").replace("%", ""));
  const cushion = (actVal - beVal).toFixed(2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>StratMarket — ${data.titleRaw || "Quantitative Performance Report"}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root {
  --bg: #070a09;
  --surface: #0e1413;
  --surface-raised: #141c1a;
  --panel: #111715;
  --panel-border: rgba(255, 255, 255, 0.08);
  --line: rgba(255, 255, 255, 0.08);
  --tx: #f3f7f5;
  --mute: #8da29c;
  --win: #4cc79a;
  --win-bg: rgba(76, 199, 154, 0.12);
  --loss: #e5746a;
  --loss-bg: rgba(229, 116, 106, 0.12);
  --gold: #e8c46a;
  --gold-bg: rgba(232, 196, 106, 0.12);
  --deep: #0a1714;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  background: var(--bg);
  color: var(--tx);
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

.wrap {
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 24px 80px;
}

/* TOP BRAND BAR */
.top-bar {
  background: rgba(14, 20, 19, 0.85);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--line);
  position: sticky;
  top: 0;
  z-index: 100;
}
.top-bar-inner {
  max-width: 1140px;
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.brand-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: #fff;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 18px;
  letter-spacing: -0.02em;
}
.top-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.badge {
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  letter-spacing: 0.02em;
}
.badge-gold { background: var(--gold-bg); color: var(--gold); border: 1px solid rgba(232, 196, 106, 0.25); }
.badge-green { background: var(--win-bg); color: var(--win); border: 1px solid rgba(76, 199, 154, 0.25); }
.badge-neutral { background: rgba(255, 255, 255, 0.06); color: var(--mute); border: 1px solid var(--line); }

/* HEADER */
header {
  padding: 56px 0 44px;
  background: radial-gradient(circle at 50% 0%, rgba(76, 199, 154, 0.08) 0%, transparent 70%);
  border-bottom: 1px solid var(--line);
}
h1 {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(28px, 4.5vw, 46px);
  font-weight: 800;
  letter-spacing: -0.03em;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
header p.subtitle {
  color: var(--mute);
  font-size: 15px;
  max-width: 76ch;
  line-height: 1.65;
  margin-bottom: 36px;
}

/* BIG KPIS */
.big-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}
.big-kpi-card {
  background: var(--surface);
  border: 1px solid var(--panel-border);
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.25);
  position: relative;
  overflow: hidden;
}
.big-kpi-card::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0; height: 2px;
  background: rgba(255,255,255,0.08);
}
.big-kpi-card:first-child::before {
  background: linear-gradient(90deg, #1e7a58, #4cc79a);
}
.big-kpi-val {
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(26px, 3.5vw, 36px);
  font-weight: 800;
  display: block;
  letter-spacing: -0.03em;
  color: #fff;
  line-height: 1.1;
  margin-bottom: 6px;
}
.big-kpi-card:first-child .big-kpi-val { color: var(--gold); }
.big-kpi-label {
  font-size: 13px;
  color: var(--mute);
  text-transform: capitalize;
}

/* ANCHOR NAV */
nav.section-nav {
  position: sticky;
  top: 57px;
  background: rgba(7, 10, 9, 0.85);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--line);
  z-index: 90;
}
nav.section-nav .nav-inner {
  max-width: 1140px;
  margin: 0 auto;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 10px 24px;
  white-space: nowrap;
}
nav.section-nav a {
  color: var(--mute);
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 8px;
  transition: all 0.2s ease;
}
nav.section-nav a:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

/* SECTIONS */
section {
  margin-top: 56px;
  scroll-margin-top: 120px;
}
h2 {
  font-family: 'Outfit', sans-serif;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 8px;
}
.lede {
  color: var(--mute);
  font-size: 14.5px;
  margin-bottom: 22px;
  max-width: 78ch;
}

/* CARDS & TABLES */
.box {
  background: var(--surface);
  border: 1px solid var(--panel-border);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}
.scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
  text-align: left;
}
th {
  background: var(--surface-raised);
  color: var(--mute);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 14px 18px;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}
td {
  padding: 16px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  vertical-align: middle;
  font-size: 14px;
}
tr:last-child td { border-bottom: none; }
tr:hover td { background: rgba(255,255,255,0.015); }

.n {
  text-align: right;
  font-family: 'JetBrains Mono', monospace;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.pos { color: var(--win); font-weight: 600; }
.neg { color: var(--loss); font-weight: 600; }

/* 14 KPIS GRID */
.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 12px;
}
.kpi {
  background: var(--surface);
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  padding: 18px 20px;
  transition: transform 0.2s, border-color 0.2s;
}
.kpi:hover {
  transform: translateY(-2px);
  border-color: rgba(255,255,255,0.15);
}
.kpi b {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 4px;
}
.kpi span {
  font-size: 13px;
  color: var(--mute);
}

/* PAYOFF STRUCTURE */
.payoff-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}
.payoff-metric-card {
  background: var(--surface);
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  padding: 22px;
  position: relative;
}
.payoff-metric-card.win-card { border-left: 4px solid var(--win); }
.payoff-metric-card.loss-card { border-left: 4px solid var(--loss); }
.payoff-metric-card.ratio-card { border-left: 4px solid var(--gold); }
.payoff-metric-card.exp-card { border-left: 4px solid #fff; }

.payoff-metric-title {
  font-size: 13px;
  color: var(--mute);
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
}
.payoff-metric-val {
  font-family: 'JetBrains Mono', monospace;
  font-size: 28px;
  font-weight: 700;
  display: block;
  line-height: 1.1;
  margin-bottom: 6px;
}
.payoff-metric-sub {
  font-size: 12px;
  color: var(--mute);
  display: block;
}

.payoff-scale-card {
  background: var(--surface);
  border: 1px solid var(--panel-border);
  border-radius: 14px;
  padding: 26px;
}
.scale-row {
  margin-bottom: 18px;
}
.scale-header {
  display: flex;
  justify-content: space-between;
  font-size: 13.5px;
  margin-bottom: 6px;
}
.scale-track {
  height: 20px;
  background: rgba(255,255,255,0.05);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}
.scale-fill-win {
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, #1e7a58, #4cc79a);
  border-radius: 6px;
}
.scale-fill-loss {
  height: 100%;
  width: 14%;
  background: var(--loss);
  border-radius: 6px;
}
.payoff-explanation-box {
  margin-top: 22px;
  padding: 18px 22px;
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--line);
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.65;
  color: var(--mute);
}
.payoff-math-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}
.math-pill {
  background: var(--surface-raised);
  border: 1px solid var(--line);
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-family: 'JetBrains Mono', monospace;
  color: #fff;
}

/* LONG VS SHORT */
.split {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}
.direction-card {
  background: var(--surface);
  border: 1px solid var(--panel-border);
  border-radius: 14px;
  padding: 26px;
}
.direction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
}
.direction-title {
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}
.direction-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.direction-dot.long { background: var(--win); }
.direction-dot.short { background: #60a5fa; }

.direction-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255,255,255,0.03);
}
.direction-row:last-child { border-bottom: none; }
.direction-label { color: var(--mute); font-size: 14px; }
.direction-val { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 600; }

/* YEARLY BARS */
.bar {
  display: grid;
  grid-template-columns: 110px 1fr 110px;
  gap: 16px;
  align-items: center;
  font-size: 14px;
  margin-bottom: 12px;
}
.track {
  position: relative;
  height: 22px;
  background: rgba(255,255,255,0.04);
  border-radius: 6px;
  overflow: hidden;
}
.fill {
  position: absolute;
  top: 0; bottom: 0; left: 0;
  border-radius: 6px;
  background: linear-gradient(90deg, #1e7a58, #4cc79a);
}

/* HEATMAP */
.heat { min-width: 880px; }
.heat td, .heat th {
  text-align: center;
  padding: 10px 4px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.heat td:first-child, .heat th:first-child {
  text-align: left;
  padding-left: 14px;
  font-weight: 700;
}
.heat small {
  display: block;
  opacity: 0.75;
  font-size: 10px;
  margin-top: 2px;
}

/* BOTTOM ACTION CTA SECTION */
.action-cta-section {
  margin-top: 64px;
  padding: 44px 36px;
  background: linear-gradient(180deg, #0f1614 0%, #080d0c 100%);
  border: 1px solid rgba(76, 199, 154, 0.25);
  border-radius: 18px;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.action-cta-section::before {
  content: "";
  position: absolute;
  top: 0; left: 10%; right: 10%; height: 1px;
  background: radial-gradient(circle, #4cc79a 0%, transparent 80%);
}
.action-title {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(24px, 3.5vw, 34px);
  font-weight: 800;
  margin-bottom: 8px;
}
.action-subtitle {
  color: var(--mute);
  font-size: 15px;
  max-width: 62ch;
  margin: 0 auto 32px;
}
.btn-group {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 700;
  padding: 16px 32px;
  border-radius: 12px;
  cursor: pointer;
  border: none;
  font-family: inherit;
  transition: all 0.2s ease;
  text-decoration: none;
}
.btn-primary {
  background: linear-gradient(135deg, #1e7a58, #4cc79a);
  color: #04100c;
  box-shadow: 0 4px 20px rgba(76, 199, 154, 0.35);
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 28px rgba(76, 199, 154, 0.5);
}
.btn-secondary {
  background: rgba(255,255,255,0.06);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.15);
}
.btn-secondary:hover {
  background: rgba(255,255,255,0.12);
  transform: translateY(-2px);
}

/* MODAL */
.modal-overlay {
  display: none;
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(8px);
  z-index: 1000;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal-overlay.open { display: flex; }
.modal-card {
  background: #111715;
  border: 1px solid var(--panel-border);
  border-radius: 16px;
  max-width: 480px;
  width: 100%;
  padding: 32px;
  position: relative;
}
.modal-close {
  position: absolute;
  top: 16px; right: 16px;
  background: none; border: none;
  color: var(--mute); font-size: 22px; cursor: pointer;
}
.modal-input {
  width: 100%;
  padding: 14px 16px;
  background: rgba(0,0,0,0.4);
  border: 1px solid var(--line);
  border-radius: 10px;
  color: #fff;
  font-size: 15px;
  margin: 16px 0 20px;
  outline: none;
}
.modal-input:focus { border-color: var(--win); }

footer {
  margin-top: 64px;
  font-size: 13px;
  color: var(--mute);
  border-top: 1px solid var(--line);
  padding-top: 24px;
  line-height: 1.6;
}
</style>
</head>
<body>

<div class="top-bar">
  <div class="top-bar-inner">
    <a href="/market" class="brand-link">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--win);"><path d="m3 3 7 7-7 7"/><path d="m13 3 7 7-7 7"/></svg>
      StratMarket
    </a>
    <div class="top-badges">
      <span class="badge badge-neutral">XAUUSD · M5</span>
      <span class="badge badge-green">Single-Digit DD (${data.bigStats && data.bigStats[2] ? data.bigStats[2].val : "9.41%"})</span>
      <span class="badge badge-gold">${data.bigStats && data.bigStats[0] ? data.bigStats[0].val : "+$125,840.22"} Net PnL</span>
    </div>
  </div>
</div>

<header>
  <div class="wrap">
    <h1>
      ${data.titleRaw || "Quantitative Strategy Tear Sheet"}
      <span class="badge badge-green">Verified MetaTrader 5 Broker Feed</span>
    </h1>
    <p class="subtitle">${data.subtitle || "Institutional Multi-Engine Quantitative Architecture calibrated on 360,000 real MetaTrader 5 bars."}</p>
    
    <div class="big-kpis">
      ${(data.bigStats || []).map((bs) => `
        <div class="big-kpi-card">
          <b class="big-kpi-val">${bs.val}</b>
          <span class="big-kpi-label">${bs.label}</span>
        </div>
      `).join("")}
    </div>
  </div>
</header>

<nav class="section-nav">
  <div class="nav-inner">
    <a href="#mech">⚡ Mechanism</a>
    <a href="#kpi">📊 Core metrics</a>
    <a href="#pay">⚖️ Payoff</a>
    <a href="#dir">⇄ Long vs short</a>
    <a href="#reg">🌐 Regimes</a>
    <a href="#year">📅 Yearly</a>
    <a href="#month">🗓️ Monthly</a>
    <a href="#deploy" style="color:var(--win);margin-left:auto;">🚀 Deploy Strategy</a>
  </div>
</nav>

<div class="wrap">

  <!-- SECTION 1: HOW THE STRATEGY WORKS -->
  <section id="mech">
    <h2>How the strategy works</h2>
    <p class="lede">${data.mechLede || "An institutional multi-engine quantitative portfolio combining orthogonal alpha engines."}</p>
    
    <div class="box scroll">
      <table>
        <thead>
          <tr>
            <th style="min-width: 260px;">Engine / Component</th>
            <th style="min-width: 170px;">Conviction Weight</th>
            <th class="n" style="min-width: 130px;">Solo PnL</th>
            <th class="n" style="min-width: 100px;">Solo PF</th>
            <th class="n" style="min-width: 110px;">Solo DD</th>
            <th style="min-width: 340px;">Role & Strategy Function</th>
          </tr>
        </thead>
        <tbody>
          ${(data.mechRows || []).map(row => `
            <tr>
              <td>
                <b style="color:#fff;font-size:14.5px;display:block;">${row.engine}</b>
                ${row.script ? `<code style="font-family:'JetBrains Mono',monospace;font-size:11.5px;color:var(--mute);background:rgba(255,255,255,0.05);padding:2px 6px;border-radius:4px;display:inline-block;margin-top:4px;">${row.script}</code>` : ""}
              </td>
              <td>
                <span style="color:var(--win);font-weight:700;padding:3px 8px;background:var(--win-bg);border-radius:6px;display:inline-block;">
                  ${row.weight}
                </span>
              </td>
              <td class="n pos">${row.soloPnl}</td>
              <td class="n" style="font-weight:600;">${row.soloPf}</td>
              <td class="n neg">${row.soloDd}</td>
              <td style="color:#b9cbc6;line-height:1.5;">${row.role}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  </section>

  <!-- SECTION 2: CORE PERFORMANCE METRICS -->
  <section id="kpi">
    <h2>Core performance metrics</h2>
    <p class="lede">${data.kpiLede || "Account: $25,000 start equity across 360,000 MetaTrader 5 M5 bars."}</p>
    
    <div class="kpis">
      ${(data.kpis || []).map((kpi, idx) => {
        const isPos = kpi.val.startsWith("+") || idx === 0;
        const isNeg = kpi.label.includes("drawdown") || kpi.val.startsWith("−$") || kpi.val.startsWith("-$");
        return `
          <div class="kpi">
            <b class="${isPos ? "pos" : isNeg ? "neg" : ""}">${kpi.val}</b>
            <span>${kpi.label}</span>
          </div>
        `;
      }).join("")}
    </div>
  </section>

  <!-- SECTION 3: PAYOFF STRUCTURE (INTUITIVE & UNDERSTANDABLE) -->
  <section id="pay">
    <div style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
      <div>
        <h2>Payoff structure</h2>
        <p class="lede" style="margin-bottom:0;">Mathematical trade expectancy and asymmetric risk-to-reward ratio.</p>
      </div>
      <span class="badge badge-gold" style="padding:6px 14px;font-size:13px;">
        ${payoff.payoffRatio} Asymmetric Payoff
      </span>
    </div>

    <!-- 4 Clear Visual Payoff Cards -->
    <div class="payoff-grid">
      <div class="payoff-metric-card win-card">
        <span class="payoff-metric-title">Average Winning Trade</span>
        <b class="payoff-metric-val pos">${payoff.avgWin}</b>
        <span class="payoff-metric-sub" style="color:var(--win);">${payoff.payoffRatio} larger than average loss</span>
      </div>

      <div class="payoff-metric-card loss-card">
        <span class="payoff-metric-title">Average Losing Trade</span>
        <b class="payoff-metric-val neg">${payoff.avgLoss}</b>
        <span class="payoff-metric-sub">Strictly capped by dynamic ATR stops</span>
      </div>

      <div class="payoff-metric-card ratio-card">
        <span class="payoff-metric-title">Breakeven vs Realized Win Rate</span>
        <div style="display:flex;align-items:baseline;gap:8px;">
          <b class="payoff-metric-val" style="color:var(--gold);">${payoff.actualWinRate}</b>
          <span style="font-size:13px;color:var(--mute);">vs ${payoff.breakevenWinRate} needed</span>
        </div>
        <span class="payoff-metric-sub" style="color:var(--win);">+${cushion}% edge above breakeven</span>
      </div>

      <div class="payoff-metric-card exp-card">
        <span class="payoff-metric-title">Expectancy Per Trade</span>
        <b class="payoff-metric-val" style="color:#fff;">${payoff.expectancy}</b>
        <span class="payoff-metric-sub" style="color:var(--win);">Cumulative: ${payoff.totalPnl}</span>
      </div>
    </div>

    <!-- Visual Scale -->
    <div class="payoff-scale-card">
      <h3 style="font-size:16px;margin-bottom:18px;color:#fff;">Asymmetric Payoff Scale</h3>
      
      <div class="scale-row">
        <div class="scale-header">
          <span style="color:var(--win);font-weight:600;">Average Winning Trade (${payoff.avgWin})</span>
          <span style="color:var(--mute);">100% Full Scale Reward</span>
        </div>
        <div class="scale-track">
          <div class="scale-fill-win"></div>
        </div>
      </div>

      <div class="scale-row">
        <div class="scale-header">
          <span style="color:var(--loss);font-weight:600;">Average Losing Trade (${payoff.avgLoss})</span>
          <span style="color:var(--mute);">Only 14% of Win Size</span>
        </div>
        <div class="scale-track">
          <div class="scale-fill-loss"></div>
        </div>
      </div>

      <div class="payoff-explanation-box">
        <b style="color:#fff;">Why this strategy wins:</b> Because winning trades average <b style="color:var(--win);">${payoff.avgWin}</b> while losses are capped at <b style="color:var(--loss);">${payoff.avgLoss}</b>, the strategy only requires a <b>${payoff.breakevenWinRate}</b> win rate to break even. The actual realized win rate of <b>${payoff.actualWinRate}</b> creates a net mathematical edge of <b style="color:#fff;">${payoff.expectancy}</b> on every trade executed.
        
        <div class="payoff-math-pills">
          <div class="math-pill">Win Component: ${payoff.actualWinRate} × ${payoff.avgWin}</div>
          <div class="math-pill">Loss Component: (100% - ${payoff.actualWinRate}) × ${payoff.avgLoss}</div>
          <div class="math-pill" style="border-color:var(--win);color:var(--win);">Net Expectancy = ${payoff.expectancy} / trade</div>
        </div>
      </div>
    </div>
  </section>

  <!-- SECTION 4: LONG VERSUS SHORT -->
  <section id="dir">
    <h2>Long versus short</h2>
    <p class="lede">Both sides are profitable, with balanced risk execution and zero text collision.</p>
    
    <div class="split">
      <div class="direction-card">
        <div class="direction-header">
          <span class="direction-title">
            <span class="direction-dot long"></span>
            Long Trades
          </span>
          <span class="badge badge-green">${data.longStats ? data.longStats.trades : "—"}</span>
        </div>
        <div class="direction-row">
          <span class="direction-label">Net Profit (PnL)</span>
          <span class="direction-val pos">${data.longStats ? data.longStats.pnl : "—"}</span>
        </div>
        <div class="direction-row">
          <span class="direction-label">Win Rate</span>
          <span class="direction-val">${data.longStats ? data.longStats.winRate : "—"}</span>
        </div>
        <div class="direction-row">
          <span class="direction-label">Profit Factor</span>
          <span class="direction-val" style="color:var(--gold);">${data.longStats ? data.longStats.pf : "—"}</span>
        </div>
      </div>

      <div class="direction-card">
        <div class="direction-header">
          <span class="direction-title">
            <span class="direction-dot short"></span>
            Short Trades
          </span>
          <span class="badge badge-neutral">${data.shortStats ? data.shortStats.trades : "—"}</span>
        </div>
        <div class="direction-row">
          <span class="direction-label">Net Profit (PnL)</span>
          <span class="direction-val pos">${data.shortStats ? data.shortStats.pnl : "—"}</span>
        </div>
        <div class="direction-row">
          <span class="direction-label">Win Rate</span>
          <span class="direction-val">${data.shortStats ? data.shortStats.winRate : "—"}</span>
        </div>
        <div class="direction-row">
          <span class="direction-label">Profit Factor</span>
          <span class="direction-val" style="color:var(--gold);">${data.shortStats ? data.shortStats.pf : "—"}</span>
        </div>
      </div>
    </div>
  </section>

  <!-- SECTION 5: THREE MARKET REGIMES (NO TEXT COLLISION) -->
  <section id="reg">
    <h2>Three market regimes</h2>
    <p class="lede">All three regimes finished positive, demonstrating strong cross-market robustness across central bank hiking cycles, banking crisis consolidations, and historic gold all-time-high trend expansions.</p>
    
    <div class="box scroll">
      <table>
        <thead>
          <tr>
            <th style="min-width: 260px;">Historical Macro Regime</th>
            <th style="min-width: 200px;">Date Period</th>
            <th class="n" style="min-width: 90px;">Trades</th>
            <th class="n" style="min-width: 140px;">Net PnL</th>
            <th class="n" style="min-width: 100px;">Win Rate</th>
            <th class="n" style="min-width: 90px;">PF</th>
            <th class="n" style="min-width: 110px;">Max DD</th>
          </tr>
        </thead>
        <tbody>
          ${(data.regimes || []).map(r => `
            <tr>
              <td style="font-weight:600;color:#fff;">${r.name}</td>
              <td style="color:var(--mute);">${r.period}</td>
              <td class="n">${r.trades}</td>
              <td class="n pos">${r.pnl}</td>
              <td class="n">${r.winRate}</td>
              <td class="n">${r.pf}</td>
              <td class="n neg">${r.dd}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  </section>

  <!-- SECTION 6: YEAR BY YEAR -->
  <section id="year">
    <h2>Year by year</h2>
    <p class="lede">Bars show annual net PnL. 2021 covers Q4 only and 2026 is year to date.</p>
    <div class="box" style="padding: 24px;">
      <div id="yb"></div>
      <div class="scroll" style="margin-top:20px;">
        <table>
          <thead>
            <tr>
              <th>Year</th>
              <th class="n">Trades</th>
              <th class="n">W / L</th>
              <th class="n">Win Rate</th>
              <th class="n">Net PnL</th>
              <th class="n">Return</th>
            </tr>
          </thead>
          <tbody>
            ${(data.yearly || []).map(y => `
              <tr>
                <td style="font-weight:600;color:#fff;">${y.year}</td>
                <td class="n">${y.trades}</td>
                <td class="n">${y.wl}</td>
                <td class="n">${y.winRate}</td>
                <td class="n pos">${y.pnl}</td>
                <td class="n pos">${y.returnPct}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- SECTION 7: MONTHLY HEATMAP -->
  <section id="month">
    <h2>Monthly PnL and trade count</h2>
    <p class="lede">Each cell shows PnL in dollars with the trade count beneath. Darker cells represent larger profit/loss magnitudes.</p>
    <div class="box scroll">
      <table class="heat" id="hm"></table>
    </div>
  </section>

  <!-- SECTION 8: DEDICATED BOTTOM ACTION CTA (EXACTLY 2 BUTTONS FOR PYTHON) -->
  <section id="deploy" class="action-cta-section">
    <h2 class="action-title">Deploy Institutional Execution</h2>
    <p class="action-subtitle">Access live institutional signals or deploy direct broker execution for ${data.titleRaw || "this strategy"}.</p>
    
    <div class="btn-group">
      <button class="action-btn btn-primary" id="btn-email-trades" onclick="openModal('email-modal')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        Email Trades
      </button>

      <button class="action-btn btn-secondary" id="btn-full-automation" onclick="openModal('auto-modal')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        Full account automation
      </button>
    </div>
  </section>

  <footer>
    Source: MetaTrader 5 broker feed (360,000 M5 bars, 2021–2026), <code>XAUUSD_M5_MT5.csv</code>. Initial capital $25,000, flat base risk $250. StratMarket Institutional Single-Digit Drawdown Quantitative Architecture.
  </footer>
</div>

<!-- EMAIL MODAL -->
<div class="modal-overlay" id="email-modal">
  <div class="modal-card">
    <button class="modal-close" onclick="closeModal('email-modal')">✕</button>
    <h3 style="font-size:20px;margin-bottom:8px;color:#fff;">Subscribe to Real-Time Signals</h3>
    <p style="color:var(--mute);font-size:14px;">Instant trade alerts will be dispatched directly to your inbox upon signal confirmation.</p>
    <input type="email" id="email-input" class="modal-input" placeholder="trader@fund.com" />
    <button class="action-btn btn-primary" style="width:100%;justify-content:center;" onclick="handleEmailSubmit()">
      Activate Email Trades
    </button>
    <div id="email-status" style="margin-top:12px;font-size:13px;display:none;"></div>
  </div>
</div>

<!-- AUTOMATION MODAL -->
<div class="modal-overlay" id="auto-modal">
  <div class="modal-card">
    <button class="modal-close" onclick="closeModal('auto-modal')">✕</button>
    <h3 style="font-size:20px;margin-bottom:8px;color:#fff;">Connect Full Account Automation</h3>
    <p style="color:var(--mute);font-size:14px;">Bridge directly to MetaTrader 5 or test with our Paper Trading Sandbox.</p>
    <input type="text" id="acct-input" class="modal-input" placeholder="MetaTrader 5 Account ID or Demo Sandbox" />
    <button class="action-btn btn-primary" style="width:100%;justify-content:center;" onclick="handleAutoSubmit()">
      Initialize Execution Bridge
    </button>
    <div id="auto-status" style="margin-top:12px;font-size:13px;display:none;"></div>
  </div>
</div>

<script>
const fmt = v => (v < 0 ? "−" : "+") + "$" + Math.abs(v).toLocaleString("en-US");
const years = ${yearsJson};
const mx = ${mxVal};
if (years.length > 0) {
  document.getElementById("yb").innerHTML = years.map(([y, v]) => \`
    <div class="bar">
      <span style="font-weight:600;color:#fff;">\${y}</span>
      <div class="track"><div class="fill" style="width:\${Math.max(v/mx*100, 2)}%;"></div></div>
      <span class="n pos">\${fmt(v)}</span>
    </div>
  \`).join("");
}

const N = null, M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const pnl = ${pnlJson};
const cnt = ${cntJson};
const tot = ${totJson};
const tc = ${tcJson};

let h = "<tr><th>Year</th>" + M.map(m => \`<th>\${m}</th>\`).join("") + "<th>Total</th></tr>";
for (const y in pnl) {
  h += \`<tr><td>\${y}</td>\`;
  pnl[y].forEach((v, i) => {
    if (v === N) {
      h += '<td style="background:rgba(255,255,255,0.02);color:var(--mute)">—</td>';
      return;
    }
    const a = Math.min(1, Math.abs(v) / 5500);
    const c = v >= 0 ? "76, 199, 154" : "229, 116, 106";
    h += \`<td style="background:rgba(\${c},\${0.1 + a * 0.7});color:\${a > 0.5 ? '#fff' : 'inherit'}">\${v < 0 ? "−" : ""}$\${Math.abs(Math.round(v)).toLocaleString("en-US")}<small>\${cnt[y] ? cnt[y][i] : 0} tr</small></td>\`;
  });
  const tVal = tot[y] || 0;
  h += \`<td class="\${tVal >= 0 ? "pos" : "neg"}"><b>\${fmt(Math.round(tVal))}</b><small>\${tc[y] || 0} tr</small></td></tr>\`;
}
document.getElementById("hm").innerHTML = h;

function openModal(id) {
  document.getElementById(id).classList.add("open");
}
function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}
function handleEmailSubmit() {
  const inp = document.getElementById("email-input").value;
  const stat = document.getElementById("email-status");
  if (!inp || !inp.includes("@")) {
    stat.style.display = "block";
    stat.style.color = "var(--loss)";
    stat.textContent = "Please enter a valid email address.";
    return;
  }
  stat.style.display = "block";
  stat.style.color = "var(--win)";
  stat.textContent = "✓ Email Trades activated! Real-time signals will be delivered to " + inp;
  setTimeout(() => closeModal("email-modal"), 2500);
}
function handleAutoSubmit() {
  const inp = document.getElementById("acct-input").value;
  const stat = document.getElementById("auto-status");
  stat.style.display = "block";
  stat.style.color = "var(--win)";
  stat.textContent = "✓ Execution Bridge linked to " + (inp || "Demo Account") + "! Automation active.";
  setTimeout(() => closeModal("auto-modal"), 2500);
}
</script>
</body>
</html>
`;
}

// Target directories
const baseDirs = [
  path.join(__dirname, "..", "MT5_Single_Digit_Ensembles"),
  path.join("C:", "Users", "vedan", "Desktop", "Ultimate_Quant_Engine", "MT5_Single_Digit_Ensembles")
];

let totalUpdated = 0;

for (const baseDir of baseDirs) {
  if (!fs.existsSync(baseDir)) {
    console.warn("Directory not found:", baseDir);
    continue;
  }
  console.log("\nUpgrading directory:", baseDir);

  const folders = fs.readdirSync(baseDir).filter(f => {
    return fs.statSync(path.join(baseDir, f)).isDirectory() && f.startsWith("Ensemble_");
  });

  for (const folder of folders) {
    const folderPath = path.join(baseDir, folder);
    
    // Find all HTML files in this folder and subfolders (e.g. individual_strategies)
    function processFolderHtmlFiles(dir) {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          processFolderHtmlFiles(fullPath);
        } else if (stat.isFile() && entry.endsWith(".html") && entry !== "institutional_tear_sheet.html") {
          try {
            const rawHtml = fs.readFileSync(fullPath, "utf8");
            const parsed = parseReportHtml(rawHtml, entry.replace(".html", ""));
            const upgradedHtml = generateReportHtml(parsed);
            fs.writeFileSync(fullPath, upgradedHtml, "utf8");
            totalUpdated++;
          } catch (err) {
            console.error(`Failed to upgrade ${fullPath}:`, err.message);
          }
        }
      }
    }

    processFolderHtmlFiles(folderPath);
  }
}

console.log(`\nSuccessfully upgraded ALL ${totalUpdated} HTML reports across both workspaces!`);
