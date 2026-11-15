// 生成「我的时区」卡片 assets/timezone.svg
// 用法: node scripts/timezone.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const OUT = process.env.OUT || "assets/timezone.svg";

const ME = { tz: "Asia/Shanghai", label: "Asia/Shanghai", name: "中国标准时间", utc: 8, note: "无夏令时" };

const CITIES = [
  { name: "伦敦", utc: 0, color: "#34D399" },
  { name: "纽约", utc: -5, color: "#F472B6" },
  { name: "东京", utc: 9, color: "#818CF8", onDial: false },
  { name: "悉尼", utc: 11, color: "#22D3EE" },
];

const W = 1040;
const H = 300;
const PAD = 40;

const CX = 500;
const CY = 176;
const R = 70;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// 24 小时刻度：0 点在正上方，顺时针
const angle = (h) => (h - 6) * 15; // 度
const pt = (h, r) => {
  const a = (angle(h) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
};
const minor = Array.from({ length: 24 }, (_, h) => {
  const [x1, y1] = pt(h, R + 5);
  const [x2, y2] = pt(h, R + 9);
  return `  <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#24304A" stroke-width="1"/>`;
}).join("\n");
const major = [0, 6, 12, 18]
  .map((h) => {
    const [x1, y1] = pt(h, R + 4);
    const [x2, y2] = pt(h, R + 11);
    return `  <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#4A5C7D" stroke-width="1.5"/>`;
  })
  .join("\n");

// 城市标记：标签位置按方位固定，避免互相压字
const LABEL_POS = {
  伦敦: { anchor: "middle", dx: 0, dy: -14 },
  纽约: { anchor: "end", dx: -14, dy: 4 },
  悉尼: { anchor: "start", dx: 10, dy: 18 },
};

const marker = (c) => {
  const [x, y] = pt(c.utc, R);
  const p = LABEL_POS[c.name] || { anchor: "start", dx: 14, dy: 4 };
  return `  <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.6" fill="${c.color}"/>
  <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="none" stroke="${c.color}" stroke-opacity="0.28" stroke-width="1.2"/>
  <text x="${(x + p.dx).toFixed(1)}" y="${(y + p.dy).toFixed(1)}" text-anchor="${p.anchor}" font-size="12" fill="#C9D6EE">${esc(c.name)}</text>`;
};

const meP = pt(ME.utc, R);
const meMarker = `  <circle cx="${meP[0].toFixed(1)}" cy="${meP[1].toFixed(1)}" r="6.5" fill="#0B1220" stroke="#22D3EE" stroke-width="2"/>
  <circle cx="${meP[0].toFixed(1)}" cy="${meP[1].toFixed(1)}" r="12" fill="none" stroke="#22D3EE" stroke-opacity="0.35" stroke-width="1.2" class="halo"/>
  <text x="${(meP[0] + 17).toFixed(1)}" y="${(meP[1] + 5).toFixed(1)}" font-size="12" font-weight="600" fill="#7DEEFF">我 · UTC+8</text>`;

const rows = CITIES.map((c, i) => {
  const diff = c.utc - ME.utc;
  const rel = diff === 0 ? "同一时刻" : diff > 0 ? `比我早 ${diff} 小时` : `比我晚 ${-diff} 小时`;
  const y = 108 + i * 38;
  return `  <circle cx="${760}" cy="${y - 4}" r="4" fill="${c.color}"/>
  <text x="${776}" y="${y}" font-size="13" fill="#C9D6EE">${esc(c.name)}</text>
  <text x="${1000}" y="${y}" text-anchor="end" font-size="11.5" fill="#6B7C9B">UTC${c.utc >= 0 ? "+" : ""}${c.utc} · ${rel}</text>`;
}).join("\n");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" role="img" aria-label="我的时区">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${W}" y2="${H}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#080D18"/>
      <stop offset="0.55" stop-color="#0B1220"/>
      <stop offset="1" stop-color="#111A2D"/>
    </linearGradient>
    <linearGradient id="edge" x1="0" y1="0" x2="${W}" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#22D3EE" stop-opacity="0.55"/>
      <stop offset="0.45" stop-color="#818CF8" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#F472B6" stop-opacity="0.4"/>
    </linearGradient>
    <linearGradient id="ring" x1="${CX - R}" y1="${CY}" x2="${CX + R}" y2="${CY}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#22D3EE" stop-opacity="0.85"/>
      <stop offset="0.5" stop-color="#818CF8" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#F472B6" stop-opacity="0.8"/>
    </linearGradient>
    <radialGradient id="core" cx="0" cy="0" r="1" gradientTransform="translate(${CX} ${CY}) rotate(90) scale(${R})" gradientUnits="userSpaceOnUse">
      <stop stop-color="#22D3EE" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#22D3EE" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M32 0H0V32" stroke="#8FA8D8" stroke-opacity="0.05" stroke-width="1"/>
    </pattern>
    <style>
      @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes halo { 0%{stroke-opacity:.45} 50%{stroke-opacity:.1} 100%{stroke-opacity:.45} }
      .dash{animation:spin 44s linear infinite;transform-origin:${CX}px ${CY}px}
      .halo{animation:halo 3.6s ease-in-out infinite}
      text{font-family:'Segoe UI','PingFang SC','Microsoft YaHei',system-ui,sans-serif;font-variant-numeric:tabular-nums}
    </style>
  </defs>

  <rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="18" fill="url(#bg)" stroke="url(#edge)" stroke-width="1.5"/>
  <rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="18" fill="url(#grid)"/>

  <text x="${PAD}" y="44" font-size="17" letter-spacing="3" fill="#C9D6EE">我的时区</text>
  <text x="${PAD + 100}" y="44" font-size="11" letter-spacing="2.5" fill="#465876">TIMEZONE</text>
  <path d="M${PAD} 60H${W - PAD}" stroke="#1B263C" stroke-width="1"/>

  <text x="${PAD}" y="118" font-size="42" font-weight="700" fill="#E9F3FF">UTC+8</text>
  <text x="${PAD}" y="148" font-size="15" letter-spacing="1" fill="#9FB2D4">${esc(ME.label)}</text>
  <text x="${PAD}" y="172" font-size="12" letter-spacing="1" fill="#5E6F8F">${esc(ME.name)} · ${esc(ME.note)}</text>
  <path d="M${PAD} 194H${PAD + 250}" stroke="#1B263C" stroke-width="1"/>
  <text x="${PAD}" y="220" font-size="12" letter-spacing="1" fill="#6B7C9B">与我同步时间：按 UTC+8 计算</text>
  <text x="${PAD}" y="244" font-size="12" letter-spacing="1" fill="#6B7C9B">24 小时表盘 · 0 点在正上方</text>

  <circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#core)"/>
  <circle cx="${CX}" cy="${CY}" r="${R}" stroke="url(#ring)" stroke-width="2" stroke-opacity="0.9"/>
  <circle cx="${CX}" cy="${CY}" r="${R + 18}" stroke="#25314B" stroke-width="1" stroke-dasharray="2 8" class="dash"/>
${minor}
${major}
${CITIES.filter((c) => c.onDial !== false).map(marker).join("\n")}
${meMarker}

  <text x="${CX}" y="${CY - 6}" text-anchor="middle" font-size="26" font-weight="700" fill="#E9F3FF">+8</text>
  <text x="${CX}" y="${CY + 16}" text-anchor="middle" font-size="11" letter-spacing="1.5" fill="#6B7C9B">UTC OFFSET</text>

  <path d="M700 84V252" stroke="#1B263C" stroke-width="1"/>
  <text x="760" y="92" font-size="11" letter-spacing="2" fill="#465876">城市对照</text>
${rows}

  <text x="${W - PAD}" y="${H - 24}" text-anchor="end" font-size="11" letter-spacing="1" fill="#465876">时区数据固定，无需定时刷新</text>
</svg>
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, svg, "utf8");
console.log(`已生成 ${OUT}`);
