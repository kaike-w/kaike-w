// 生成「贡献热力图」数据卡 assets/stats.svg（浅色简约版）
// 用法: GH_TOKEN=xxx node scripts/stats.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const TOKEN = process.env.GH_TOKEN;
const LOGIN = process.env.GH_LOGIN || "kaike-w";
const OUT = process.env.OUT || "assets/stats.svg";

if (!TOKEN) {
  console.error("缺少 GH_TOKEN");
  process.exit(1);
}

const gql = async (query, variables) => {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "profile-stats",
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    console.error(JSON.stringify(json.errors));
    process.exit(1);
  }
  return json.data;
};

const CAL = `contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount weekday } } }`;

const head = await gql(
  `query($login:String!){ user(login:$login){ name login contributionsCollection{ contributionYears ${CAL} } } }`,
  { login: LOGIN }
);
const yearsList = head.user.contributionsCollection.contributionYears;
const recent = head.user.contributionsCollection.contributionCalendar;

const all = new Map();
for (const y of yearsList) {
  const d = await gql(
    `query($login:String!,$from:DateTime!,$to:DateTime!){ user(login:$login){ contributionsCollection(from:$from,to:$to){ ${CAL} } } }`,
    { login: LOGIN, from: `${y}-01-01T00:00:00Z`, to: `${y + 1}-01-01T00:00:00Z` }
  );
  for (const w of d.user.contributionsCollection.contributionCalendar.weeks)
    for (const day of w.contributionDays) all.set(day.date, day.contributionCount);
}

const ordered = [...all.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
const lifetime = ordered.reduce((s, [, n]) => s + n, 0);
const activeDays = ordered.filter(([, n]) => n > 0).length;

let longest = 0;
let run = 0;
for (const [, n] of ordered) {
  run = n > 0 ? run + 1 : 0;
  if (run > longest) longest = run;
}

const days = recent.weeks.flatMap((w) => w.contributionDays);
let current = 0;
let i = days.length - 1;
if (days[i] && days[i].contributionCount === 0) i -= 1;
for (; i >= 0; i--) {
  if (days[i].contributionCount > 0) current += 1;
  else break;
}

// ---- 版式 ----
const W = 1040;
const H = 366;
const PAD = 40;
const STEP = 15.4;
const CELL = 12;
const GRID_X = 74;
const GRID_Y = 196;

const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
const WEEK_LABELS = { 1: "一", 3: "三", 5: "五" };

const LEVELS = ["#EDF1F6", "#DBEAFE", "#93C5FD", "#3B82F6", "#1D4ED8"];
const level = (n) => (n === 0 ? 0 : n <= 1 ? 1 : n <= 4 ? 2 : n <= 9 ? 3 : 4);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const monthLabels = [];
recent.weeks.forEach((w, wi) => {
  const first = w.contributionDays[0];
  if (!first) return;
  const m = Number(first.date.slice(5, 7));
  const prev = wi > 0 ? Number(recent.weeks[wi - 1].contributionDays[0].date.slice(5, 7)) : -1;
  if (m !== prev && wi < recent.weeks.length - 2) monthLabels.push({ x: GRID_X + wi * STEP, label: MONTHS[m - 1] });
});

const stamp = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

const lastDate = days[days.length - 1].date;
const cells = recent.weeks
  .map((w, wi) =>
    w.contributionDays
      .map((d) => {
        const x = GRID_X + wi * STEP;
        const y = GRID_Y + d.weekday * STEP;
        return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${CELL}" height="${CELL}" rx="3" fill="${LEVELS[level(d.contributionCount)]}"${
          d.date === lastDate ? ' class="today"' : ""
        }><title>${d.date} · ${d.contributionCount} 次</title></rect>`;
      })
      .join("")
  )
  .join("");

const kpi = (x, value, label, hint) => `  <text x="${x}" y="104" font-size="38" font-weight="700" fill="#0F172A">${esc(value)}</text>
  <text x="${x}" y="128" font-size="13" fill="#6B7280" letter-spacing="1">${esc(label)}</text>
  <text x="${x}" y="147" font-size="10.5" fill="#C7CBD1" letter-spacing="1.6">${esc(hint)}</text>`;

const kpis = [
  { x: PAD, v: String(lifetime), label: "累计贡献", hint: "SINCE 2022" },
  { x: PAD + 245, v: String(activeDays), label: "活跃天数", hint: "ACTIVE DAYS" },
  { x: PAD + 490, v: String(longest), label: "最长连续", hint: "LONGEST STREAK" },
  { x: PAD + 735, v: String(current), label: "当前连续", hint: "CURRENT STREAK" },
];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" role="img" aria-label="贡献热力图">
  <defs>
    <style>
      @keyframes ring { 0%{stroke-opacity:1} 50%{stroke-opacity:.25} 100%{stroke-opacity:1} }
      .today{stroke:#1D4ED8;stroke-width:1.4;animation:ring 3s ease-in-out infinite}
      text{font-family:'Segoe UI','PingFang SC','Microsoft YaHei',system-ui,sans-serif;font-variant-numeric:tabular-nums}
    </style>
  </defs>

  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="18" fill="#FFFFFF" stroke="#EAECEF"/>

  <text x="${PAD}" y="44" font-size="17" letter-spacing="3" fill="#0F172A">近一年贡献</text>
  <text x="${PAD + 132}" y="44" font-size="11" letter-spacing="2.5" fill="#C7CBD1">CONTRIBUTION ACTIVITY</text>
  <text x="${W - PAD}" y="44" text-anchor="end" font-size="12" letter-spacing="1" fill="#B6BBC4">${esc(LOGIN)} · 更新于 ${esc(stamp)}</text>
  <path d="M${PAD} 60H${W - PAD}" stroke="#F0F1F4" stroke-width="1"/>
${kpis.map((k) => kpi(k.x, k.v, k.label, k.hint)).join("\n")}
  <path d="M${PAD + 215} 82V122" stroke="#F0F1F4" stroke-width="1"/>
  <path d="M${PAD + 460} 82V122" stroke="#F0F1F4" stroke-width="1"/>
  <path d="M${PAD + 705} 82V122" stroke="#F0F1F4" stroke-width="1"/>

${monthLabels.map((m) => `  <text x="${m.x.toFixed(1)}" y="178" font-size="11" letter-spacing="1" fill="#9CA3AF">${m.label}</text>`).join("\n")}
${Object.entries(WEEK_LABELS)
  .map(([wd, t]) => `  <text x="${GRID_X - 12}" y="${(GRID_Y + Number(wd) * STEP + 9.5).toFixed(1)}" text-anchor="end" font-size="11" fill="#B6BBC4">${t}</text>`)
  .join("\n")}
${cells}

  <text x="${GRID_X}" y="${H - 26}" font-size="11" letter-spacing="1" fill="#B6BBC4">少</text>
${LEVELS.map((c, n) => `  <rect x="${(GRID_X + 22 + n * STEP).toFixed(1)}" y="${H - 37}" width="${CELL}" height="${CELL}" rx="3" fill="${c}"/>`).join("\n")}
  <text x="${(GRID_X + 30 + LEVELS.length * STEP).toFixed(1)}" y="${H - 26}" font-size="11" letter-spacing="1" fill="#B6BBC4">多</text>
  <text x="${W - PAD}" y="${H - 26}" text-anchor="end" font-size="11" letter-spacing="1" fill="#C7CBD1">累计 ${lifetime} 次贡献 · 数据来自 GitHub</text>
</svg>
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, svg, "utf8");
console.log(`已生成 ${OUT}（累计 ${lifetime} / 活跃 ${activeDays} / 最长 ${longest} / 当前 ${current}）`);
