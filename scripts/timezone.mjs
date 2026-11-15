// 生成「我的时区」卡片 assets/timezone.svg（浅色简约版）
// 用法: node scripts/timezone.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const OUT = process.env.OUT || "assets/timezone.svg";

const ME = { label: "Asia/Shanghai", name: "中国标准时间", utc: 8, note: "无夏令时" };

const CITIES = [
  { name: "伦敦", utc: 0, onDial: true },
  { name: "纽约", utc: -5, onDial: true },
  { name: "东京", utc: 9, onDial: false },
  { name: "悉尼", utc: 11, onDial: true },
];

const W = 1040;
const H = 300;
const PAD = 40;

const CX = 500;
const CY = 176;
const R = 70;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const angle = (h) => (h - 6) * 15;
const pt = (h, r) => {
  const a = (angle(h) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
};

const minor = Array.from({ length: 24 }, (_, h) => {
  const [x1, y1] = pt(h, R + 5);
  const [x2, y2] = pt(h, R + 9);
  return `  <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#E8EAEE" stroke-width="1"/>`;
}).join("\n");

const major = [0, 6, 12, 18]
  .map((h) => {
    const [x1, y1] = pt(h, R + 4);
    const [x2, y2] = pt(h, R + 11);
    return `  <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#CBD0D8" stroke-width="1.4"/>`;
  })
  .join("\n");

const LABEL_POS = {
  伦敦: { anchor: "middle", dx: 0, dy: -14 },
  纽约: { anchor: "end", dx: -14, dy: 4 },
  悉尼: { anchor: "start", dx: 10, dy: 18 },
};

const marker = (c) => {
  const [x, y] = pt(c.utc, R);
  const p = LABEL_POS[c.name] || { anchor: "start", dx: 14, dy: 4 };
  return `  <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.2" fill="#FFFFFF" stroke="#64748B" stroke-width="1.8"/>
  <text x="${(x + p.dx).toFixed(1)}" y="${(y + p.dy).toFixed(1)}" text-anchor="${p.anchor}" font-size="12" fill="#334155">${esc(c.name)}</text>`;
};

const meP = pt(ME.utc, R);
const meMarker = `  <circle cx="${meP[0].toFixed(1)}" cy="${meP[1].toFixed(1)}" r="10" fill="none" stroke="#2563EB" stroke-opacity="0.25" stroke-width="1.2" class="halo"/>
  <circle cx="${meP[0].toFixed(1)}" cy="${meP[1].toFixed(1)}" r="5.4" fill="#2563EB"/>
  <text x="${(meP[0] + 17).toFixed(1)}" y="${(meP[1] + 5).toFixed(1)}" font-size="12" font-weight="600" fill="#2563EB">我 · UTC+8</text>`;

const rows = CITIES.map((c, i) => {
  const diff = c.utc - ME.utc;
  const rel = diff === 0 ? "同一时刻" : diff > 0 ? `比我早 ${diff} 小时` : `比我晚 ${-diff} 小时`;
  const y = 108 + i * 38;
  return `  <circle cx="760" cy="${y - 4}" r="3.4" fill="${c.onDial ? "#2563EB" : "#CBD0D8"}"/>
  <text x="776" y="${y}" font-size="13" fill="#111827">${esc(c.name)}</text>
  <text x="1000" y="${y}" text-anchor="end" font-size="11.5" fill="#9CA3AF">UTC${c.utc >= 0 ? "+" : ""}${c.utc} · ${rel}</text>`;
}).join("\n");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" role="img" aria-label="我的时区">
  <defs>
    <style>
      @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes halo { 0%{stroke-opacity:.35} 50%{stroke-opacity:.08} 100%{stroke-opacity:.35} }
      .dash{animation:spin 60s linear infinite;transform-origin:${CX}px ${CY}px}
      .halo{animation:halo 4s ease-in-out infinite}
      text{font-family:'Segoe UI','PingFang SC','Microsoft YaHei',system-ui,sans-serif;font-variant-numeric:tabular-nums}
    </style>
  </defs>

  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="18" fill="#FFFFFF" stroke="#EAECEF"/>

  <text x="${PAD}" y="44" font-size="17" letter-spacing="3" fill="#0F172A">我的时区</text>
  <text x="${PAD + 100}" y="44" font-size="11" letter-spacing="2.5" fill="#C7CBD1">TIMEZONE</text>
  <path d="M${PAD} 60H${W - PAD}" stroke="#F0F1F4" stroke-width="1"/>

  <text x="${PAD}" y="118" font-size="42" font-weight="700" fill="#0F172A">UTC+8</text>
  <text x="${PAD}" y="148" font-size="15" letter-spacing="1" fill="#6B7280">${esc(ME.label)}</text>
  <text x="${PAD}" y="172" font-size="12" letter-spacing="1" fill="#9CA3AF">${esc(ME.name)} · ${esc(ME.note)}</text>
  <path d="M${PAD} 194H${PAD + 250}" stroke="#F0F1F4" stroke-width="1"/>
  <text x="${PAD}" y="220" font-size="12" letter-spacing="1" fill="#6B7280">与我同步时间：按 UTC+8 计算</text>
  <text x="${PAD}" y="244" font-size="12" letter-spacing="1" fill="#9CA3AF">24 小时表盘 · 0 点在正上方</text>

  <circle cx="${CX}" cy="${CY}" r="${R}" fill="#FFFFFF" stroke="#E8EAEE" stroke-width="1.4"/>
  <circle cx="${CX}" cy="${CY}" r="${R + 18}" stroke="#EDEFF2" stroke-width="1" stroke-dasharray="2 8" class="dash"/>
${minor}
${major}
${CITIES.filter((c) => c.onDial).map(marker).join("\n")}
${meMarker}

  <text x="${CX}" y="${CY - 4}" text-anchor="middle" font-size="26" font-weight="700" fill="#0F172A">+8</text>
  <text x="${CX}" y="${CY + 18}" text-anchor="middle" font-size="10.5" letter-spacing="1.5" fill="#C7CBD1">UTC OFFSET</text>

  <path d="M700 84V252" stroke="#F0F1F4" stroke-width="1"/>
  <text x="760" y="92" font-size="11" letter-spacing="2" fill="#C7CBD1">城市对照</text>
${rows}

  <text x="${W - PAD}" y="${H - 24}" text-anchor="end" font-size="11" letter-spacing="1" fill="#C7CBD1">时区数据固定，无需定时刷新</text>
</svg>
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, svg, "utf8");
console.log(`已生成 ${OUT}`);
