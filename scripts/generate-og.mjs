/**
 * Regenerates the social-share (Open Graph / Twitter) cover image.
 *
 *   node scripts/generate-og.mjs
 *
 * Output: public/auth/og-cover.png  (1200 x 630)
 *
 * The design leans on Vrutta's motto — "word of mouth moves in a circle" — with
 * an abstract orbital motif rather than a networking/handshake cliché. Edit the
 * COPY / geometry below and re-run.
 */
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const W = 1200;
const H = 630;

// Brand palette (default theme + logo mark colors)
const INK = '#15151f';
const ACCENT = '#7c3aed';
const MUTED = '#6b7280';
const BG = '#faf9f7';
const RING = '#e7e1f3';
const DOTS = ['#7c3aed', '#367bcd', '#18ade2', '#0dbdb5', '#07c896', '#fbbd23', '#f4845f', '#ff334b'];

const COPY = {
  l1: "Word of mouth doesn't travel",
  l2: 'in a straight line.',
  l3: 'It moves in a circle.',
  foot: 'vrutta.net',
};

// ── orbital motif ──────────────────────────────────────────────────────────────
const cx = 915;
const cy = 320;
const rOuter = 236;
const dots = DOTS.map((fill, i) => {
  const a = (-90 + (i * 360) / DOTS.length) * (Math.PI / 180);
  const x = cx + rOuter * Math.cos(a);
  const y = cy + rOuter * Math.sin(a);
  const r = i === 0 ? 13 : 8;
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${fill}" />`;
}).join('');

const canvas = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="30%" cy="28%" r="75%">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="${BG}"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- abstract circular motion: concentric rings + travelling marks -->
  <g fill="none" stroke="${RING}">
    <circle cx="${cx}" cy="${cy}" r="${rOuter}" stroke-width="2.5"/>
    <circle cx="${cx}" cy="${cy}" r="${rOuter - 58}" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy}" r="${rOuter - 116}" stroke-width="2"/>
  </g>
  <path d="M ${cx + rOuter} ${cy} A ${rOuter} ${rOuter} 0 0 1 ${(cx - rOuter * 0.5).toFixed(1)} ${(cy + rOuter * 0.866).toFixed(1)}"
        fill="none" stroke="${ACCENT}" stroke-width="3.5" stroke-linecap="round" opacity="0.6"/>
  ${dots}
  <circle cx="${cx}" cy="${cy}" r="4" fill="${MUTED}"/>

  <!-- motto -->
  <g font-family="Georgia, 'Times New Roman', 'Noto Serif', serif" fill="${INK}">
    <text x="96" y="278" font-size="58" font-weight="700" letter-spacing="-1">${COPY.l1}</text>
    <text x="96" y="348" font-size="58" font-weight="700" letter-spacing="-1">${COPY.l2}</text>
    <text x="96" y="430" font-size="62" font-weight="700" font-style="italic" letter-spacing="-1" fill="${ACCENT}">${COPY.l3}</text>
  </g>
  <text x="98" y="520" font-family="Arial, 'Helvetica Neue', sans-serif" font-size="22"
        font-weight="700" letter-spacing="3" fill="${MUTED}">${COPY.foot.toUpperCase()}</text>
</svg>`;

// ── logo (rendered from the source SVG, composited on top) ─────────────────────
const logoTargetWidth = 360;
const logoPng = await sharp(readFileSync(resolve(root, 'public/auth/logo-full.svg')))
  .resize({ width: logoTargetWidth })
  .png()
  .toBuffer();

const out = resolve(root, 'public/auth/og-cover.png');
await sharp(Buffer.from(canvas))
  .composite([{ input: logoPng, top: 84, left: 96 }])
  .png()
  .toFile(out);

// Note: public/auth/thumbnail.png is a separate, faint auth-page background
// texture — it is intentionally left untouched.
console.log('wrote', out);
