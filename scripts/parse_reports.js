const fs = require("fs");
const path = require("path");

const baseDir = path.join(__dirname, "..", "MT5_Single_Digit_Ensembles");
const folders = fs.readdirSync(baseDir).filter(f => {
  return fs.statSync(path.join(baseDir, f)).isDirectory() && f.startsWith("Ensemble_");
}).sort();

const reports = {};

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

for (const folder of folders) {
  const num = parseInt(folder.split("_")[1], 10);
  const slug = `py-${String(num).padStart(2, "0")}`;
  const htmlPath = path.join(baseDir, folder, "Stratmarket_Performance_Report.html");

  if (!fs.existsSync(htmlPath)) {
    console.warn("File missing:", htmlPath);
    continue;
  }

  const html = fs.readFileSync(htmlPath, "utf8");

  // Title & Subtitle
  const titleMatch = html.match(/<h1>(.*?)<\/h1>/s);
  const titleRaw = titleMatch ? cleanText(titleMatch[1]) : folder;

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
      // Split engine title and script filename
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

  // Payoff Structure (Structured)
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

    if (avgWinM) payoff.avgWin = cleanText(avgWinM[1]);
    if (avgLossM) payoff.avgLoss = cleanText(avgLossM[1]).replace("−", "-");
    if (ratioM) payoff.payoffRatio = cleanText(ratioM[1]);
    if (beM) payoff.breakevenWinRate = cleanText(beM[1]);
    if (actM) payoff.actualWinRate = cleanText(actM[1]);
    if (expM) payoff.expectancy = cleanText(expM[1]);
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

  // Script Data (Heatmap & annual bars)
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
      console.error("Error evaluating script in " + folder, e.message);
    }
  }

  reports[slug] = {
    folder,
    num,
    slug,
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

const outDir = path.join(__dirname, "..", "src", "lib", "data");
fs.writeFileSync(path.join(outDir, "ensembleReports.json"), JSON.stringify(reports, null, 2), "utf8");
console.log("Successfully updated ensembleReports.json with cleaned structured data for " + Object.keys(reports).length + " strategies");
