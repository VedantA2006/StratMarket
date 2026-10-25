const fs = require("fs");
const path = require("path");

const baseDir = path.join(__dirname, "..", "MT5_Single_Digit_Ensembles");
const folders = fs.readdirSync(baseDir).filter(f => {
  return fs.statSync(path.join(baseDir, f)).isDirectory() && f.startsWith("Ensemble_");
}).sort();

const reports = {};

for (const folder of folders) {
  const num = parseInt(folder.split("_")[1], 10);
  const slug = `py-${String(num).padStart(2, "0")}`;
  const htmlPath = path.join(baseDir, folder, "Stratmarket_Performance_Report.html");

  if (!fs.existsSync(htmlPath)) {
    console.warn("File missing:", htmlPath);
    continue;
  }

  const html = fs.readFileSync(htmlPath, "utf8");

  // Extract Title & Subtitle
  const titleMatch = html.match(/<h1>(.*?)<\/h1>/s);
  const titleRaw = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : folder;
  
  const headerPMatch = html.match(/<header>.*?<p>(.*?)<\/p>/s);
  const subtitle = headerPMatch ? headerPMatch[1].trim() : "";

  // Extract Big stats
  const bigStats = [];
  const bigMatch = html.match(/<div class="big">(.*?)<\/div><\/div><\/header>/s);
  if (bigMatch) {
    const itemRegex = /<div><b>(.*?)<\/b><span>(.*?)<\/span><\/div>/g;
    let m;
    while ((m = itemRegex.exec(bigMatch[1])) !== null) {
      bigStats.push({ val: m[1].trim(), label: m[2].trim() });
    }
  }

  // Extract Mechanism lede & rows
  const mechLedeMatch = html.match(/<section id="mech"><h2>.*?<\/h2>\s*<p class="lede">(.*?)<\/p>/s);
  const mechLede = mechLedeMatch ? mechLedeMatch[1].trim() : "";

  const mechTableMatch = html.match(/<section id="mech">.*?<table>(.*?)<\/table>/s);
  const mechRows = [];
  if (mechTableMatch) {
    const trRegex = /<tr>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td.*?>(.*?)<\/td>\s*<td.*?>(.*?)<\/td>\s*<td.*?>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<\/tr>/gs;
    let m;
    while ((m = trRegex.exec(mechTableMatch[1])) !== null) {
      // Clean tags from engine name
      const engineName = m[1].replace(/<a[^>]*>(.*?)<\/a>/s, "$1").replace(/<code[^>]*>(.*?)<\/code>/s, " ($1)").replace(/<br>/g, " ").replace(/\s+/g, " ").trim();
      mechRows.push({
        engine: engineName,
        indicator: m[2].replace(/\s+/g, " ").trim(),
        weight: m[3].replace(/<[^>]+>/g, "").trim(),
        soloPnl: m[4].replace(/<[^>]+>/g, "").trim(),
        soloPf: m[5].replace(/<[^>]+>/g, "").trim(),
        soloDd: m[6].replace(/<[^>]+>/g, "").trim(),
        role: m[7].replace(/\s+/g, " ").trim()
      });
    }
  }

  // Extract Core KPIs
  const kpiLedeMatch = html.match(/<section id="kpi"><h2>.*?<\/h2>\s*<p class="lede">(.*?)<\/p>/s);
  const kpiLede = kpiLedeMatch ? kpiLedeMatch[1].trim() : "";

  const kpis = [];
  const kpisMatch = html.match(/<div class="kpis">(.*?)<\/div><\/section>/s);
  if (kpisMatch) {
    const kpiRegex = /<div class="kpi"><b.*?>(.*?)<\/b><span>(.*?)<\/span><\/div>/g;
    let m;
    while ((m = kpiRegex.exec(kpisMatch[1])) !== null) {
      kpis.push({ val: m[1].trim(), label: m[2].trim() });
    }
  }

  // Extract Payoff text
  const payMatch = html.match(/<section id="pay">.*?<div class="box">(.*?)<\/div><\/section>/s);
  const payText = payMatch ? payMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";

  // Extract Long vs Short
  const dirMatch = html.match(/<section id="dir">.*?<div class="split">(.*?)<\/div><\/section>/s);
  let longStats = {}, shortStats = {};
  if (dirMatch) {
    const extractBoxStats = (content) => {
      const trades = (content.match(/<tr><td>Trades<\/td><td class="n">(.*?)<\/td><\/tr>/) || [])[1] || "";
      const pnl = (content.match(/<tr><td>Net PnL<\/td><td.*?>(.*?)<\/td><\/tr>/) || [])[1] || "";
      const winRate = (content.match(/<tr><td>Win rate<\/td><td.*?>(.*?)<\/td><\/tr>/) || [])[1] || "";
      const pf = (content.match(/<tr><td>Profit factor<\/td><td.*?>(.*?)<\/td><\/tr>/) || [])[1] || "";
      return { trades, pnl, winRate, pf };
    };
    const longBoxMatch = dirMatch[1].match(/<b>Long trades<\/b><table>(.*?)<\/table>/s);
    if (longBoxMatch) longStats = extractBoxStats(longBoxMatch[1]);

    const shortBoxMatch = dirMatch[1].match(/<b>Short trades<\/b><table>(.*?)<\/table>/s);
    if (shortBoxMatch) shortStats = extractBoxStats(shortBoxMatch[1]);
  }

  // Extract Regimes
  const regTableMatch = html.match(/<section id="reg">.*?<table>(.*?)<\/table>/s);
  const regimes = [];
  if (regTableMatch) {
    const trRegex = /<tr><td>(.*?)<\/td><td>(.*?)<\/td><td class="n">(.*?)<\/td><td.*?>(.*?)<\/td><td class="n">(.*?)<\/td><td class="n">(.*?)<\/td><td class="n">(.*?)<\/td><\/tr>/g;
    let m;
    while ((m = trRegex.exec(regTableMatch[1])) !== null) {
      regimes.push({
        name: m[1].trim(),
        period: m[2].trim(),
        trades: m[3].trim(),
        pnl: m[4].replace(/<[^>]+>/g, "").trim(),
        winRate: m[5].trim(),
        pf: m[6].trim(),
        dd: m[7].trim()
      });
    }
  }

  // Extract Yearly table
  const yearTableMatch = html.match(/<section id="year">.*?<table>(.*?)<\/table>/s);
  const yearly = [];
  if (yearTableMatch) {
    const trRegex = /<tr><td>(.*?)<\/td><td.*?>(.*?)<\/td><td.*?>(.*?)<\/td><td.*?>(.*?)<\/td><td.*?>(.*?)<\/td><td.*?>(.*?)<\/td><\/tr>/g;
    let m;
    while ((m = trRegex.exec(yearTableMatch[1])) !== null) {
      if (m[1].includes("Year") || m[1].includes("th>")) continue;
      yearly.push({
        year: m[1].replace(/<[^>]+>/g, "").trim(),
        trades: m[2].replace(/<[^>]+>/g, "").trim(),
        wl: m[3].replace(/<[^>]+>/g, "").trim(),
        winRate: m[4].replace(/<[^>]+>/g, "").trim(),
        pnl: m[5].replace(/<[^>]+>/g, "").trim(),
        returnPct: m[6].replace(/<[^>]+>/g, "").trim()
      });
    }
  }

  // Extract Script Data (years, pnl, cnt, tot, tc)
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
    payText,
    longStats,
    shortStats,
    regimes,
    yearly,
    scriptData
  };
}

const outDir = path.join(__dirname, "..", "src", "lib", "data");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, "ensembleReports.json"), JSON.stringify(reports, null, 2), "utf8");
console.log("Successfully extracted reports for " + Object.keys(reports).length + " strategies to src/lib/data/ensembleReports.json");
