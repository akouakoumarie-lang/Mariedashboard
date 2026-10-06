/* Cotonou Box — illustrations vectorielles : coffrets, natures mortes, calendrier, paysages */
(() => {
  "use strict";

  const GOLD = "url(#cb-gold)";
  const THEMES = {
    peach: { bg: "cb-bg-peach", table: "#e2b08a" },
    rose: { bg: "cb-bg-rose", table: "#e3b2a6" },
    sun: { bg: "cb-bg-sun", table: "#dfae5e" },
    cream: { bg: "cb-bg-cream", table: "#e4d3b6" },
    green: { bg: "cb-bg-green", table: "#0b2c22" },
    red: { bg: "cb-bg-red", table: "#6e1d17" },
    terra: { bg: "cb-bg-terra", table: "#93422c" },
  };

  // ---------- Définitions partagées (dégradés, motifs wax) ----------
  const DEFS = `
  <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="cb-box" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f5c47"/><stop offset="1" stop-color="#0b3126"/></linearGradient>
      <linearGradient id="cb-wood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a5a34"/><stop offset="1" stop-color="#5a3519"/></linearGradient>
      <linearGradient id="cb-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1dca4"/><stop offset=".45" stop-color="#c9a65c"/><stop offset="1" stop-color="#8d6b2c"/></linearGradient>
      <linearGradient id="cb-amber" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f7c35a"/><stop offset=".5" stop-color="#e09a2c"/><stop offset="1" stop-color="#b56a17"/></linearGradient>
      <linearGradient id="cb-rosebottle" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f9c9cf"/><stop offset=".6" stop-color="#ee9fae"/><stop offset="1" stop-color="#d77b8d"/></linearGradient>
      <linearGradient id="cb-wine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9c2b2e"/><stop offset="1" stop-color="#5a1418"/></linearGradient>
      <linearGradient id="cb-dark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3c3a37"/><stop offset="1" stop-color="#171615"/></linearGradient>
      <linearGradient id="cb-glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity=".55"/><stop offset="1" stop-color="#ffffff" stop-opacity=".15"/></linearGradient>
      <radialGradient id="cb-bg-peach" cx=".7" cy=".2" r="1"><stop offset="0" stop-color="#fdebd6"/><stop offset=".6" stop-color="#f3c9a3"/><stop offset="1" stop-color="#e3a47c"/></radialGradient>
      <radialGradient id="cb-bg-rose" cx=".7" cy=".2" r="1"><stop offset="0" stop-color="#fdeeea"/><stop offset=".6" stop-color="#f4cfc6"/><stop offset="1" stop-color="#e3a99c"/></radialGradient>
      <radialGradient id="cb-bg-sun" cx=".7" cy=".2" r="1"><stop offset="0" stop-color="#fff2cf"/><stop offset=".6" stop-color="#f6d48a"/><stop offset="1" stop-color="#e3ac4f"/></radialGradient>
      <radialGradient id="cb-bg-cream" cx=".7" cy=".2" r="1"><stop offset="0" stop-color="#fffaf1"/><stop offset=".6" stop-color="#f3e7d2"/><stop offset="1" stop-color="#e2cfae"/></radialGradient>
      <radialGradient id="cb-bg-green" cx=".7" cy=".2" r="1"><stop offset="0" stop-color="#2f7259"/><stop offset=".6" stop-color="#174a3a"/><stop offset="1" stop-color="#0a2a20"/></radialGradient>
      <radialGradient id="cb-bg-red" cx=".7" cy=".2" r="1"><stop offset="0" stop-color="#d4574a"/><stop offset=".6" stop-color="#a7342a"/><stop offset="1" stop-color="#6d1c16"/></radialGradient>
      <radialGradient id="cb-bg-terra" cx=".7" cy=".2" r="1"><stop offset="0" stop-color="#e59a77"/><stop offset=".6" stop-color="#c46a4b"/><stop offset="1" stop-color="#8c3d27"/></radialGradient>
      <radialGradient id="cb-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <radialGradient id="cb-flame" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe7a3" stop-opacity=".9"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
      <filter id="cb-blur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>
      <filter id="cb-soft" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity=".22"/></filter>

      <pattern id="cb-waxA" width="28" height="28" patternUnits="userSpaceOnUse">
        <rect width="28" height="28" fill="#b3312a"/>
        <circle cx="14" cy="14" r="8" fill="#e7b23c"/><circle cx="14" cy="14" r="4.5" fill="#1a5c3e"/><circle cx="14" cy="14" r="1.8" fill="#f6e7c7"/>
        <path d="M0 0l5 0-5 5zM28 0v5l-5-5zM0 28v-5l5 5zM28 28h-5l5-5z" fill="#1a5c3e"/>
        <circle cx="0" cy="14" r="2" fill="#f6e7c7"/><circle cx="28" cy="14" r="2" fill="#f6e7c7"/><circle cx="14" cy="0" r="2" fill="#f6e7c7"/><circle cx="14" cy="28" r="2" fill="#f6e7c7"/>
      </pattern>
      <pattern id="cb-waxB" width="24" height="24" patternUnits="userSpaceOnUse">
        <rect width="24" height="24" fill="#0f3b2e"/>
        <path d="M12 2l10 10-10 10L2 12z" fill="none" stroke="#d8b86a" stroke-width="1.6"/>
        <path d="M12 7l5 5-5 5-5-5z" fill="#c4563a"/><circle cx="12" cy="12" r="1.6" fill="#f2dfae"/>
      </pattern>
      <pattern id="cb-waxC" width="22" height="22" patternUnits="userSpaceOnUse">
        <rect width="22" height="22" fill="#e9b53e"/>
        <ellipse cx="11" cy="11" rx="4" ry="8" fill="#b3312a" transform="rotate(45 11 11)"/>
        <ellipse cx="11" cy="11" rx="1.8" ry="5" fill="#1a5c3e" transform="rotate(45 11 11)"/>
        <circle cx="0" cy="0" r="3" fill="#1a5c3e"/><circle cx="22" cy="0" r="3" fill="#1a5c3e"/><circle cx="0" cy="22" r="3" fill="#1a5c3e"/><circle cx="22" cy="22" r="3" fill="#1a5c3e"/>
      </pattern>
      <pattern id="cb-waxD" width="30" height="30" patternUnits="userSpaceOnUse">
        <rect width="30" height="30" fill="#1d3d6b"/>
        <circle cx="15" cy="15" r="10" fill="none" stroke="#e7b23c" stroke-width="3"/><circle cx="15" cy="15" r="4" fill="#d9573c"/>
        <circle cx="0" cy="0" r="5" fill="#d9573c"/><circle cx="30" cy="0" r="5" fill="#d9573c"/><circle cx="0" cy="30" r="5" fill="#d9573c"/><circle cx="30" cy="30" r="5" fill="#d9573c"/>
      </pattern>
      <pattern id="cb-weave" width="12" height="12" patternUnits="userSpaceOnUse">
        <rect width="12" height="12" fill="#c99a5e"/>
        <path d="M0 3h6M6 9h6" stroke="#a87638" stroke-width="3"/><path d="M3 0v6M9 6v6" stroke="#e1bb84" stroke-width="2"/>
      </pattern>
      <pattern id="cb-pine" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="12" height="12" fill="#e5a730"/><path d="M0 0h12v12" fill="none" stroke="#9a6416" stroke-width="1.6"/><circle cx="6" cy="6" r="1.4" fill="#7a4c10"/>
      </pattern>

      <symbol id="cb-emblem" viewBox="0 0 60 60">
        <path d="M30 4C37 13 37 24 30 31 23 24 23 13 30 4Z"/>
        <path d="M29 31C21 30 13 22 11 11 21 12 28 21 29 31Z"/>
        <path d="M31 31C39 30 47 22 49 11 39 12 32 21 31 31Z"/>
        <path d="M29 37C21 40 11 38 5 29 15 26 24 30 29 37Z"/>
        <path d="M31 37C39 40 49 38 55 29 45 26 36 30 31 37Z"/>
        <path d="M28.6 30h2.8v24h-2.8z"/>
        <path d="M30 54c-4-5-9-6-13-4 4 3 9 4 13 4zm0 0c4-5 9-6 13-4-4 3-9 4-13 4z"/>
      </symbol>
    </defs>
  </svg>`;

  const r = (n) => Math.round(n * 10) / 10;
  const scaled = (x, b, s, body) => (s && s !== 1 ? `<g transform="translate(${x} ${b}) scale(${s}) translate(${-x} ${-b})">${body}</g>` : body);
  const txt = (x, y, s, o = {}) =>
    `<text x="${x}" y="${y}" text-anchor="middle" font-family="${o.font || "Cormorant Garamond, Georgia, serif"}" font-size="${o.size || 8}" font-weight="${o.weight || 600}" letter-spacing="${o.ls || 0}" fill="${o.fill || "#0f3b2e"}"${o.style ? ` font-style="${o.style}"` : ""}>${s}</text>`;
  const emblem = (x, y, size, fill = GOLD) => `<use href="#cb-emblem" x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}" fill="${fill}"/>`;

  // ---------- Objets ----------
  const ITEMS = {
    jar(x, b, o = {}) {
      const w = o.w || 64, h = o.h || 48;
      return `<rect x="${x - w / 2}" y="${b - h}" width="${w}" height="${h}" rx="9" fill="${o.body || "#f6eddc"}" stroke="rgba(0,0,0,.08)"/>
        <rect x="${x - w / 2 + 6}" y="${b - h + 7}" width="6" height="${h - 14}" rx="3" fill="#fff" opacity=".45"/>
        <rect x="${x - w / 2}" y="${b - h * 0.68}" width="${w}" height="${h * 0.42}" fill="${o.label || "#0f3b2e"}"/>
        ${txt(x, b - h * 0.68 + h * 0.27, o.text || "KARITÉ", { size: 7.5, fill: o.ink || "#e7cf94", ls: 1.2, font: "Manrope, sans-serif", weight: 700 })}
        <rect x="${x - w / 2 - 3}" y="${b - h - 15}" width="${w + 6}" height="16" rx="4" fill="${o.lid || GOLD}"/>
        <rect x="${x - w / 2 - 3}" y="${b - h - 15}" width="${w + 6}" height="4" rx="2" fill="#fff" opacity=".25"/>`;
    },
    bottle(x, b, o = {}) {
      const w = o.w || 40, h = o.h || 128, bodyH = h * 0.6, nw = w * 0.36, sh = h * 0.14, top = b - h, capH = h * 0.13;
      const d = `M${x - w / 2},${b} V${b - bodyH} C${x - w / 2},${b - bodyH - sh * 0.8} ${x - nw / 2},${b - bodyH - sh * 0.5} ${x - nw / 2},${b - bodyH - sh} V${top + capH} H${x + nw / 2} V${b - bodyH - sh} C${x + nw / 2},${b - bodyH - sh * 0.5} ${x + w / 2},${b - bodyH - sh * 0.8} ${x + w / 2},${b - bodyH} V${b} Z`;
      return `<path d="${d}" fill="${o.fill || "url(#cb-amber)"}"/>
        <path d="M${x - w / 2 + 7},${b - bodyH + 2} V${b - 8}" stroke="#fff" stroke-opacity=".4" stroke-width="3.5" stroke-linecap="round"/>
        <rect x="${x - nw / 2 - 2}" y="${top}" width="${nw + 4}" height="${capH + 1}" rx="2" fill="${o.cap || GOLD}"/>
        <rect x="${x - w / 2 + 4}" y="${b - bodyH * 0.8}" width="${w - 8}" height="${bodyH * 0.42}" rx="2" fill="${o.label || "#f7f1e6"}"/>
        <rect x="${x - w / 2 + 7}" y="${b - bodyH * 0.8 + 3}" width="${w - 14}" height="1" fill="#b8964f"/>
        ${txt(x, b - bodyH * 0.8 + bodyH * 0.25, o.text || "HUILE", { size: 6.5, ls: 0.8, font: "Manrope, sans-serif", weight: 700, fill: o.ink || "#0f3b2e" })}`;
    },
    perfume(x, b, o = {}) {
      const w = o.w || 52, h = o.h || 58;
      return `<rect x="${x - w / 2}" y="${b - h}" width="${w}" height="${h}" rx="12" fill="${o.fill || "url(#cb-rosebottle)"}"/>
        <rect x="${x - w / 2 + 7}" y="${b - h + 8}" width="7" height="${h - 16}" rx="3.5" fill="#fff" opacity=".45"/>
        <rect x="${x - 7}" y="${b - h - 9}" width="14" height="10" fill="#e9d2a0"/>
        <rect x="${x - 15}" y="${b - h - 30}" width="30" height="22" rx="5" fill="${o.cap || GOLD}"/>
        ${txt(x, b - h * 0.45, o.text || "Ylang", { size: 10, style: "italic", fill: "#7a2c3a", weight: 500 })}`;
    },
    tea(x, b, o = {}) {
      const w = o.w || 54, h = o.h || 108;
      return `<rect x="${x - w / 2}" y="${b - h}" width="${w}" height="${h}" rx="2" fill="${o.fill || "#e7b23c"}"/>
        <rect x="${x - w / 2}" y="${b - h}" width="${w}" height="10" fill="#000" opacity=".12"/>
        <ellipse cx="${x}" cy="${b - h * 0.55}" rx="${w * 0.38}" ry="${h * 0.2}" fill="#f7f1e6"/>
        <path d="M${x - 8},${b - h * 0.62} C${x - 2},${b - h * 0.74} ${x + 10},${b - h * 0.7} ${x + 10},${b - h * 0.66} C${x + 4},${b - h * 0.6} ${x - 4},${b - h * 0.6} ${x - 8},${b - h * 0.62}Z" fill="#2f7a4f"/>
        ${txt(x, b - h * 0.47, o.text || "Kinkéliba", { size: 9, style: "italic", weight: 600 })}`;
    },
    pouch(x, b, o = {}) {
      const w = o.w || 62, h = o.h || 100;
      let zig = `M${x - w / 2},${b - h + 8}`;
      for (let i = 0; i <= 8; i++) zig += ` L${r(x - w / 2 + (w / 8) * i)},${b - h + (i % 2 ? 0 : 8)}`;
      let nuts = "";
      for (let i = 0; i < 5; i++) {
        const nx = x - 16 + (i % 3) * 14 + (i > 2 ? 7 : 0), ny = b - h * 0.52 + (i > 2 ? 12 : 0);
        nuts += `<path d="M${nx - 6},${ny} C${nx - 6},${ny - 9} ${nx + 6},${ny - 9} ${nx + 6},${ny - 2} C${nx + 2},${ny - 5} ${nx - 2},${ny - 3} ${nx - 1},${ny + 3} C${nx - 4},${ny + 4} ${nx - 6},${ny + 2} ${nx - 6},${ny}Z" fill="${o.nut || "#e5c38c"}" stroke="#b88a4a" stroke-width=".8"/>`;
      }
      return `<path d="${zig} L${x + w / 2},${b} L${x - w / 2},${b} Z" fill="${o.fill || "#c89a62"}"/>
        <rect x="${x - w / 2}" y="${b - h + 8}" width="${w}" height="6" fill="#000" opacity=".1"/>
        <rect x="${x - w / 2 + 9}" y="${b - h * 0.68}" width="${w - 18}" height="${h * 0.32}" rx="6" fill="#f6e6c8"/>${nuts}
        ${txt(x, b - h * 0.22, o.text || "CAJOU", { size: 7, ls: 1.4, font: "Manrope, sans-serif", weight: 700, fill: "#3b2a16" })}`;
    },
    pineapple(x, b, o = {}) {
      const ry = 44, cy = b - ry;
      let leaves = "";
      [[-30, 54], [-14, 66], [0, 74], [14, 66], [30, 54], [-22, 44], [22, 44]].forEach(([dx, len]) => {
        const tx = x + dx, ty = cy - ry - len + 10;
        leaves += `<path d="M${x - 5},${cy - ry + 6} Q${x + dx * 0.3},${cy - ry - len * 0.4} ${tx},${ty} Q${x + dx * 0.4 + 6},${cy - ry - len * 0.3} ${x + 5},${cy - ry + 6}Z" fill="${dx % 2 ? "#2f7a4f" : "#1d5e3f"}"/>`;
      });
      return `${leaves}<ellipse cx="${x}" cy="${cy}" rx="29" ry="${ry}" fill="url(#cb-pine)"/>
        <ellipse cx="${x - 10}" cy="${cy - 10}" rx="7" ry="22" fill="#fff" opacity=".18"/>`;
    },
    candle(x, b, o = {}) {
      const w = o.w || 50, h = o.h || 58;
      return `<circle cx="${x}" cy="${b - h - 12}" r="30" fill="url(#cb-flame)"/>
        <rect x="${x - w / 2}" y="${b - h}" width="${w}" height="${h}" rx="5" fill="${o.fill || "#f3e3c4"}"/>
        <rect x="${x - w / 2}" y="${b - h}" width="${w}" height="${h}" rx="5" fill="url(#cb-glass)"/>
        <rect x="${x - w / 2}" y="${b - h * 0.55}" width="${w}" height="${h * 0.3}" fill="${o.band || "#b6553a"}"/>
        ${txt(x, b - h * 0.36, o.text || "ANANAS", { size: 6.5, ls: 1, font: "Manrope, sans-serif", weight: 700, fill: "#f7f1e6" })}
        <path d="M${x},${b - h - 2} v-6" stroke="#3a2a1a" stroke-width="1.5"/>
        <path d="M${x},${b - h - 26} C${x + 7},${b - h - 16} ${x + 5},${b - h - 7} ${x},${b - h - 6} C${x - 5},${b - h - 7} ${x - 7},${b - h - 16} ${x},${b - h - 26}Z" fill="#f6b73c"/>
        <path d="M${x},${b - h - 18} C${x + 3},${b - h - 13} ${x + 2},${b - h - 9} ${x},${b - h - 9} C${x - 2},${b - h - 9} ${x - 3},${b - h - 13} ${x},${b - h - 18}Z" fill="#fff4cf"/>`;
    },
    soap(x, b, o = {}) {
      const w = o.w || 66;
      const bar = (y, f) => `<rect x="${x - w / 2}" y="${y}" width="${w}" height="24" rx="3" fill="${f}"/>
        <path d="M${x - 8},${y} v24 M${x + 8},${y} v24" stroke="#7b5a2e" stroke-width="1.2"/>`;
      return bar(b - 24, o.fill || "#d6b583") + bar(b - 50, o.fill2 || "#3a3530") +
        `<rect x="${x - 18}" y="${b - 18}" width="36" height="12" fill="#f7f1e6"/>${txt(x, b - 9.5, o.text || "SAVON NOIR", { size: 5.5, ls: 0.6, font: "Manrope, sans-serif", weight: 700 })}`;
    },
    tenture(x, b, o = {}) {
      const w = o.w || 100, h = o.h || 124, t = b - h;
      return `<rect x="${x - w / 2}" y="${t}" width="${w}" height="${h}" fill="${o.border || "#e7b23c"}" filter="url(#cb-soft)"/>
        <rect x="${x - w / 2 + 6}" y="${t + 6}" width="${w - 12}" height="${h - 12}" fill="${o.fill || "#1c2a4a"}"/>
        <circle cx="${x + w * 0.18}" cy="${t + h * 0.22}" r="${w * 0.1}" fill="#e7b23c"/>
        <path d="M${x - w * 0.3},${t + h * 0.45} c${w * 0.1},-${h * 0.16} ${w * 0.3},-${h * 0.16} ${w * 0.36},-${h * 0.04} l${w * 0.12},-${h * 0.06} -${w * 0.04},${h * 0.1} c-${w * 0.06},${h * 0.1} -${w * 0.3},${h * 0.1} -${w * 0.44},0z" fill="#c4372e"/>
        <path d="M${x - w * 0.28},${t + h * 0.7} q${w * 0.2},-${h * 0.1} ${w * 0.4},0 l${w * 0.14},-${h * 0.06} v${h * 0.12} l-${w * 0.14},-${h * 0.06} q-${w * 0.2},${h * 0.1} -${w * 0.4},0z" fill="#2f8a5a"/>
        <path d="M${x + w * 0.22},${t + h * 0.56} l${w * 0.06},${h * 0.1} -${w * 0.12},0z" fill="#f7f1e6"/>
        <path d="M${x - w * 0.3},${t + h * 0.18} a${w * 0.07},${w * 0.07} 0 1 0 ${w * 0.1},${h * 0.07} a${w * 0.05},${w * 0.05} 0 1 1 -${w * 0.1},-${h * 0.07}z" fill="#f7f1e6"/>`;
    },
    basket(x, b, o = {}) {
      return `<path d="M${x - 44},${b - 72} C${x - 44},${b - 130} ${x + 44},${b - 130} ${x + 44},${b - 72}" fill="none" stroke="#a87638" stroke-width="6"/>
        <ellipse cx="${x}" cy="${b - 70}" rx="46" ry="11" fill="url(#cb-waxC)"/>
        <path d="M${x - 50},${b - 72} L${x + 50},${b - 72} L${x + 40},${b} L${x - 40},${b} Z" fill="url(#cb-weave)"/>
        <rect x="${x - 50}" y="${b - 76}" width="100" height="8" rx="4" fill="#a87638"/>`;
    },
    cup(x, b, o = {}) {
      return `<path d="M${x + 22},${b - 34} c14,0 14,20 0,20" fill="none" stroke="${o.fill || "#b6553a"}" stroke-width="5"/>
        <path d="M${x - 26},${b - 44} h52 l-5,44 h-42 z" fill="${o.fill || "#b6553a"}"/>
        <path d="M${x - 26},${b - 44} h52 l-1,8 h-50 z" fill="#f7f1e6" opacity=".85"/>
        <path d="M${x - 18},${b - 24} h36" stroke="#e7b23c" stroke-width="2.5"/>`;
    },
    book(x, b, o = {}) {
      const w = o.w || 58, h = o.h || 84;
      return `<rect x="${x - w / 2}" y="${b - h}" width="${w}" height="${h}" rx="2" fill="url(#cb-waxD)"/>
        <rect x="${x - w / 2}" y="${b - h}" width="7" height="${h}" fill="#000" opacity=".25"/>
        <rect x="${x - w / 2 + 14}" y="${b - h * 0.62}" width="${w - 24}" height="18" fill="#f7f1e6"/>
        ${txt(x + 4, b - h * 0.62 + 12, "Carnet", { size: 9, style: "italic" })}`;
    },
    choco(x, b, o = {}) {
      const w = o.w || 46, h = o.h || 96;
      return `<rect x="${x - w / 2}" y="${b - h}" width="${w}" height="${h}" rx="2" fill="#2b2a4a"/>
        <rect x="${x - w / 2}" y="${b - h * 0.6}" width="${w}" height="${h * 0.22}" fill="${GOLD}"/>
        ${txt(x, b - h * 0.6 + h * 0.14, "CHOCOLAT", { size: 5.5, ls: 0.8, font: "Manrope, sans-serif", weight: 700, fill: "#2b2a4a" })}`;
    },
    flowers(x, b, o = {}) {
      const stem = `<path d="M${x},${b} C${x - 4},${b - 40} ${x - 14},${b - 70} ${x - 22},${b - 96} M${x},${b} C${x + 4},${b - 50} ${x + 18},${b - 80} ${x + 20},${b - 112}" stroke="#2f7a4f" stroke-width="3" fill="none"/>
        <path d="M${x - 4},${b - 40} c-14,-6 -22,-2 -26,6 c10,2 20,0 26,-6z M${x + 6},${b - 60} c14,-8 22,-4 26,4 c-10,3 -20,1 -26,-4z" fill="#2f7a4f"/>`;
      const bloom = (cx, cy, s) => {
        let p = "";
        for (let i = 0; i < 5; i++) {
          const a = (i * 72 * Math.PI) / 180;
          p += `<ellipse cx="${r(cx + Math.cos(a) * 10 * s)}" cy="${r(cy + Math.sin(a) * 10 * s)}" rx="${11 * s}" ry="${8 * s}" transform="rotate(${i * 72} ${r(cx + Math.cos(a) * 10 * s)} ${r(cy + Math.sin(a) * 10 * s)})" fill="${o.fill || "#d23b4b"}"/>`;
        }
        return p + `<circle cx="${cx}" cy="${cy}" r="${5 * s}" fill="#7a1525"/><path d="M${cx},${cy} l${10 * s},-${10 * s}" stroke="#f3c94a" stroke-width="${1.6 * s}"/>`;
      };
      return stem + bloom(x - 22, b - 100, 1) + bloom(x + 20, b - 118, 1.15);
    },
    cake(x, b) {
      let candles = "";
      [-18, 0, 18].forEach((dx, i) => {
        candles += `<rect x="${x + dx - 2.5}" y="${b - 132}" width="5" height="22" fill="${["#b6553a", "#e7b23c", "#2f7a4f"][i]}"/>
          <path d="M${x + dx},${b - 146} c4,5 3,9 0,10 c-3,-1 -4,-5 0,-10z" fill="#f6b73c"/><circle cx="${x + dx}" cy="${b - 140}" r="10" fill="url(#cb-flame)"/>`;
      });
      return `<ellipse cx="${x}" cy="${b}" rx="74" ry="9" fill="${GOLD}"/>
        <rect x="${x - 62}" y="${b - 58}" width="124" height="56" rx="6" fill="#f7efe1"/>
        <rect x="${x - 62}" y="${b - 36}" width="124" height="12" fill="url(#cb-waxA)"/>
        <rect x="${x - 44}" y="${b - 108}" width="88" height="50" rx="6" fill="#fbf4e8"/>
        <path d="M${x - 44},${b - 102} q11,14 22,0 q11,14 22,0 q11,14 22,0 q11,14 22,0" fill="none" stroke="#e7b23c" stroke-width="4"/>
        <ellipse cx="${x}" cy="${b - 108}" rx="44" ry="6" fill="#fff"/>${candles}`;
    },
    gift(x, b, o = {}) {
      const w = o.w || 92, h = o.h || 78;
      return `<rect x="${x - w / 2}" y="${b - h}" width="${w}" height="${h}" fill="${o.fill || "#0f3b2e"}"/>
        <rect x="${x - w / 2 - 5}" y="${b - h - 18}" width="${w + 10}" height="20" fill="${o.fill || "#0f3b2e"}"/>
        <rect x="${x - 8}" y="${b - h - 18}" width="16" height="${h + 18}" fill="${o.ribbon || GOLD}"/>
        <path d="M${x},${b - h - 18} c-30,-30 -40,0 -6,0z M${x},${b - h - 18} c30,-30 40,0 6,0z" fill="${o.ribbon || GOLD}"/>`;
    },
    ball(x, b, o = {}) {
      const R = o.r || 16;
      return `<path d="M${x},${b - 2 * R - 6} v-${o.string || 0}" stroke="#c9a65c" stroke-width="1"/>
        <circle cx="${x}" cy="${b - R}" r="${R}" fill="${o.fill || "#b3312a"}"/>
        <circle cx="${x - R * 0.35}" cy="${b - R * 1.35}" r="${R * 0.28}" fill="#fff" opacity=".45"/>
        <rect x="${x - 5}" y="${b - 2 * R - 6}" width="10" height="7" rx="1.5" fill="${GOLD}"/>`;
    },
    bracelet(x, b) {
      return `<ellipse cx="${x}" cy="${b}" rx="30" ry="11" fill="none" stroke="${GOLD}" stroke-width="7"/>
        <ellipse cx="${x + 10}" cy="${b + 4}" rx="28" ry="10" fill="none" stroke="${GOLD}" stroke-width="4"/>`;
    },
    bowtie(x, b) {
      return `<path d="M${x},${b - 14} L${x - 38},${b - 32} L${x - 38},${b + 4} Z M${x},${b - 14} L${x + 38},${b - 32} L${x + 38},${b + 4} Z" fill="url(#cb-waxA)" stroke="#7d1f18" stroke-width="1"/>
        <rect x="${x - 8}" y="${b - 23}" width="16" height="18" rx="3" fill="#b3312a"/>`;
    },
    card(x, b, o = {}) {
      return `<g transform="rotate(${o.rot ?? 8} ${x} ${b})" filter="url(#cb-soft)">
        <rect x="${x - 40}" y="${b - 56}" width="80" height="56" fill="#fbf6ec"/>
        ${txt(x, b - 36, o.l1 || "Un peu de Bénin", { size: 10, font: "Parisienne, cursive", weight: 400 })}
        ${txt(x, b - 23, o.l2 || "dans votre quotidien", { size: 10, font: "Parisienne, cursive", weight: 400 })}
        <path d="M${x},${b - 8} c-4,-5 -9,-2 -5,2 l5,4 5,-4 c4,-4 -1,-7 -5,-2z" fill="none" stroke="#0f3b2e" stroke-width="1"/>
      </g>`;
    },
  };

  const drawItems = (list = [], k = 1) => list.map(([type, x, o = {}]) => {
    const b = o.b ?? 342;
    return ITEMS[type] ? scaled(x, b, (o.s || 1) * k, ITEMS[type](x, b, o)) : "";
  }).join("");

  function frame(theme, inner, label) {
    const t = THEMES[theme] || THEMES.peach;
    return `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMax slice" role="img" aria-label="${label || ""}" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="500" fill="url(#${t.bg})"/>
      <circle cx="310" cy="90" r="170" fill="url(#cb-glow)"/>
      <rect y="438" width="400" height="62" fill="${t.table}"/><rect y="438" width="400" height="2" fill="#fff" opacity=".18"/>
      ${inner}</svg>`;
  }

  // Coffret ouvert : couvercle, tissu wax, objets, façade dorée.
  function coffret(spec = {}) {
    const box = spec.box === "wood" ? "url(#cb-wood)" : spec.box === "kraft" ? "#c89a62" : "url(#cb-box)";
    const wax = spec.wax || "url(#cb-waxA)";
    const inner = `
      <ellipse cx="200" cy="462" rx="172" ry="14" fill="#000" opacity=".28" filter="url(#cb-blur)"/>
      <polygon points="92,128 318,108 334,318 76,326" fill="${box}"/>
      <polygon points="102,140 309,121 323,308 86,315" fill="none" stroke="${GOLD}" stroke-width="1.5"/>
      <g transform="rotate(-4 205 210)">${emblem(205, 186, 50)}
        ${txt(205, 240, "Cotonou Box", { size: 24, fill: GOLD, weight: 500 })}
        ${txt(205, 254, "Le Bénin en cadeau", { size: 9, fill: GOLD, weight: 500, style: "italic" })}</g>
      <polygon points="58,318 342,318 352,334 48,334" fill="#071f17"/>
      ${drawItems(spec.items, 1.32)}
      <path d="M48,334 C70,320 92,338 116,326 C140,316 160,336 186,326 C210,317 232,336 258,325 C282,316 306,334 330,324 C340,321 348,326 352,330 L352,346 L48,346Z" fill="${wax}"/>
      ${spec.card ? ITEMS.card(spec.card[0], spec.card[1], spec.card[2] || {}) : ""}
      <rect x="48" y="334" width="304" height="122" fill="${box}"/>
      <rect x="48" y="334" width="304" height="2" fill="${GOLD}"/>
      <rect x="60" y="346" width="280" height="98" fill="none" stroke="${GOLD}" stroke-width=".9"/>
      ${emblem(200, 374, 30)}
      ${txt(200, 418, "Cotonou Box", { size: 22, fill: GOLD, weight: 500 })}
      ${txt(200, 432, "LE BÉNIN EN CADEAU", { size: 6.5, fill: GOLD, ls: 2, font: "Manrope, sans-serif" })}
      <path d="M48,330 C36,356 42,384 30,412 C48,410 60,396 70,380 L72,334Z" fill="${wax}"/>
      <path d="M48,330 C36,356 42,384 30,412" fill="none" stroke="#000" stroke-opacity=".15"/>
      ${drawItems(spec.front)}`;
    return frame(spec.theme, inner, spec.label);
  }

  // Nature morte : objets posés sur une table.
  function still(spec = {}) {
    const inner = `<ellipse cx="200" cy="448" rx="160" ry="12" fill="#000" opacity=".22" filter="url(#cb-blur)"/>
      ${spec.cloth ? `<path d="M30,440 C90,426 150,452 220,436 C290,422 340,446 380,438 L392,470 C330,480 260,462 200,476 C130,490 70,468 20,476Z" fill="${spec.cloth}"/>` : ""}
      ${drawItems((spec.items || []).map(([t, x, o = {}]) => [t, x, { b: 444, ...o }]), 1.55)}`;
    return frame(spec.theme, inner, spec.label);
  }

  // Calendrier de l'Avent : 24 fenêtres en tissus wax.
  function advent(spec = {}) {
    const fills = ["url(#cb-waxA)", "#0f3b2e", "url(#cb-waxC)", "#b3312a", "url(#cb-waxB)", "#e7b23c", "url(#cb-waxD)", "#1a5c3e"];
    const order = [7, 14, 3, 21, 10, 1, 18, 5, 24, 12, 9, 16, 2, 20, 11, 6, 23, 15, 4, 19, 8, 13, 22, 17];
    let doors = "";
    order.forEach((n, i) => {
      const c = i % 4, row = Math.floor(i / 4), x = 86 + c * 54, y = 150 + row * 46;
      doors += `<rect x="${x}" y="${y}" width="50" height="42" fill="${fills[(i * 3 + row) % fills.length]}"/>
        <circle cx="${x + 25}" cy="${y + 21}" r="12" fill="#fbf6ec" opacity=".93"/>
        ${txt(x + 25, y + 26.5, n, { size: 14, weight: 600 })}`;
    });
    const inner = `<ellipse cx="200" cy="462" rx="150" ry="14" fill="#000" opacity=".28" filter="url(#cb-blur)"/>
      <polygon points="326,70 350,86 350,456 326,456" fill="#082219"/>
      <rect x="74" y="70" width="252" height="386" fill="url(#cb-box)"/>
      <rect x="80" y="76" width="240" height="374" fill="none" stroke="${GOLD}" stroke-width="1"/>
      ${emblem(200, 98, 22)}
      ${txt(200, 128, "24 jours au Bénin", { size: 22, fill: GOLD, weight: 500, style: "italic" })}
      ${doors}
      ${txt(200, 438, "COTONOU BOX · CALENDRIER DE L’AVENT", { size: 6.5, fill: GOLD, ls: 1.6, font: "Manrope, sans-serif" })}
      ${drawItems([["ball", 64, { b: 456, r: 15, fill: "#b3312a" }], ["ball", 346, { b: 456, r: 13, fill: "#c9a65c" }], ["ball", 372, { b: 456, r: 10, fill: "#1a5c3e" }]])}`;
    return frame(spec.theme || "red", inner, spec.label || "Calendrier de l’Avent Cotonou Box");
  }

  // Paysage : coucher de soleil sur la lagune de Cotonou.
  let uid = 0;
  function palm(x, y, h, lean, color) {
    const tx = x + lean, ty = y - h;
    let fr = `<path d="M${x},${y} Q${x + lean * 0.2},${y - h * 0.6} ${tx},${ty}" stroke="${color}" stroke-width="${h * 0.045}" fill="none" stroke-linecap="round"/>`;
    [-170, -140, -110, -70, -40, -10, 20, 160].forEach((deg) => {
      const a = (deg * Math.PI) / 180, len = h * 0.42;
      const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * 0.75 + len * 0.35;
      const mx = (tx + ex) / 2, my = (ty + ey) / 2 - len * 0.22;
      fr += `<path d="M${r(tx)},${r(ty)} Q${r(mx)},${r(my - 10)} ${r(ex)},${r(ey)} Q${r(mx)},${r(my + 8)} ${r(tx)},${r(ty)}Z" fill="${color}"/>`;
    });
    return fr;
  }
  function landscape(spec = {}) {
    const id = `cbl${++uid}`;
    const sunX = spec.sunX ?? 560;
    let city = "", city2 = "";
    const heights = [60, 90, 70, 140, 80, 110, 60, 180, 95, 70, 120, 85, 60, 100, 75, 130, 65, 90, 55, 80];
    heights.forEach((h, i) => {
      const x = 40 + i * 46;
      city += `<rect x="${x}" y="${640 - h}" width="${30 + (i % 3) * 8}" height="${h}"/>`;
      if (i % 2) city2 += `<rect x="${x + 18}" y="${640 - h * 0.45}" width="40" height="${h * 0.45}"/>`;
    });
    let refl = "";
    for (let i = 0; i < 9; i++) refl += `<rect x="${sunX - 90 + (i % 3) * 18 - i * 3}" y="${652 + i * 22}" width="${180 - i * 14}" height="3.5" rx="2" fill="#ffe2a8" opacity="${0.8 - i * 0.07}"/>`;
    return `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e2c8"/><stop offset=".45" stop-color="#f4c597"/><stop offset=".72" stop-color="#ef9f76"/><stop offset="1" stop-color="#e3866a"/></linearGradient>
        <linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eaa47e"/><stop offset=".5" stop-color="#b57a6e"/><stop offset="1" stop-color="#4e4250"/></linearGradient>
        <radialGradient id="${id}g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff0c4" stop-opacity=".95"/><stop offset=".35" stop-color="#ffd59a" stop-opacity=".5"/><stop offset="1" stop-color="#ffd59a" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#${id}s)"/>
      <circle cx="${sunX}" cy="600" r="380" fill="url(#${id}g)"/>
      <circle cx="${sunX}" cy="606" r="62" fill="#fde6ae"/>
      <path d="M180 220 q60 -18 120 0 q60 -16 110 4 M980 160 q50 -14 100 0 q40 -10 90 6" stroke="#fbe7d2" stroke-width="10" stroke-linecap="round" opacity=".6" fill="none"/>
      <g fill="#a86a63" opacity=".5">${city}</g>
      <rect x="415" y="420" width="16" height="220" fill="#a86a63" opacity=".5"/><rect x="405" y="410" width="36" height="14" fill="#a86a63" opacity=".5"/>
      <g fill="#8b5552" opacity=".45">${city2}</g>
      <rect y="638" width="1600" height="262" fill="url(#${id}w)"/>
      ${refl}
      <g fill="#33231f">
        <path d="M760 742 q60 18 140 0 l-12 12 q-58 12 -116 0z"/>
        <circle cx="818" cy="690" r="7"/><path d="M812 698 h12 l3 40 h-18z"/>
        <path d="M826 704 L880 652" stroke="#33231f" stroke-width="3"/>
      </g>
      <path d="M1030 330 l12 8 12 -8 M1080 300 l9 6 9 -6 M990 300 l8 5 8 -5" stroke="#6b3f3b" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M1180 900 C1230 800 1350 760 1600 740 V900Z" fill="#1d3a2e"/>
      <g>${palm(1330, 800, 330, -60, "#1d3a2e")}${palm(1470, 790, 400, 40, "#173126")}${palm(1250, 830, 220, -30, "#24463a")}</g>
    </svg>`;
  }

  window.CBArt = {
    defs: DEFS,
    coffret,
    still,
    advent,
    landscape,
    emblem: (size = 40) => `<svg viewBox="0 0 60 60" width="${size}" height="${size}" aria-hidden="true"><use href="#cb-emblem" fill="currentColor"/></svg>`,
  };
})();
