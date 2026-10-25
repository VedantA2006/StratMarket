const fs = require("fs");
const path = require("path");

const p = path.join(__dirname, "..", "src", "lib", "data", "ensembleReports.json");
const data = JSON.parse(fs.readFileSync(p, "utf8"));

for (const k in data) {
  if (data[k].titleRaw) {
    data[k].titleRaw = data[k].titleRaw.replace(/\b\d+\s*[-–—]?\s*Engine\s*/gi, "").trim();
    console.log(k, "->", data[k].titleRaw);
  }
}

fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
console.log("Successfully stripped engine count from all titles in ensembleReports.json");
