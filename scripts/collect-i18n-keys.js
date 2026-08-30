// Temporary helper: lists all namespaced i18n keys used in src/
const fs = require("fs");
const path = require("path");
const keys = new Set();
function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(f)) {
      const c = fs.readFileSync(p, "utf8");
      for (const m of c.matchAll(/t\(\s*["']([a-zA-Z]+:[a-zA-Z.]+)["']/g))
        keys.add(m[1]);
    }
  }
}
walk("src");
console.log([...keys].sort().join("\n"));
