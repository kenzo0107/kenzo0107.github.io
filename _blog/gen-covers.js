#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const POSTS = path.join(__dirname, 'source', '_posts');
const IMG_DIR = path.join(__dirname, 'source', 'img', 'cover');
fs.mkdirSync(IMG_DIR, { recursive: true });

// ---- front matter helpers ----------------------------------------------
function splitFrontMatter(text) {
  if (!text.startsWith('---')) return null;
  const end = text.indexOf('\n---', 3);
  if (end === -1) return null;
  const fmEnd = text.indexOf('\n', end + 1);
  return { fm: text.slice(0, fmEnd + 1), body: text.slice(fmEnd + 1) };
}

function unquote(v) {
  v = v.trim();
  if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
    return v.slice(1, -1).replace(/''/g, "'");
  }
  return v;
}

function parseMeta(fm) {
  const lines = fm.split('\n');
  const meta = { title: '', category: '', tags: [] };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m;
    if ((m = line.match(/^title:\s*(.+)$/))) meta.title = unquote(m[1]);
    else if ((m = line.match(/^category:\s*(.+)$/))) meta.category = unquote(m[1]);
    else if ((m = line.match(/^categories:\s*(.+)$/))) meta.category = unquote(m[1]).replace(/^[\[]|[\]]$/g, '').split(',')[0].trim();
    else if (/^tags:\s*$/.test(line)) {
      for (let j = i + 1; j < lines.length && /^\s*-\s+/.test(lines[j]); j++) {
        meta.tags.push(unquote(lines[j].replace(/^\s*-\s+/, '')));
      }
    } else if ((m = line.match(/^tags:\s*\[(.*)\]\s*$/))) {
      meta.tags = m[1].split(',').map(s => unquote(s)).filter(Boolean);
    }
  }
  return meta;
}

// ---- topic & color ------------------------------------------------------
// keyword -> hue (HSL). first match wins; checked against title+tags+category.
const TOPIC_HUES = [
  ['aws', 28], ['lambda', 28], ['ec2', 28], ['ecs', 28], ['fargate', 28], ['s3', 28], ['rds', 28], ['aurora', 28], ['dynamodb', 28], ['cloudwatch', 28], ['vpc', 28],
  ['terraform', 264], ['datadog', 282], ['prometheus', 14], ['kibana', 200], ['elasticsearch', 52], ['fluentd', 130],
  ['go', 198], ['golang', 198], ['python', 211], ['ruby', 348], ['php', 240], ['node', 122],
  ['docker', 205], ['kubernetes', 214], ['gke', 214], ['nginx', 110], ['mysql', 30], ['postgresql', 210], ['redis', 358],
  ['raspberrypi', 340], ['raspberry', 340], ['iot', 340], ['slack', 300], ['git', 18], ['github', 222],
  ['ssl', 162], ['ssh', 162], ['mac', 220], ['macosx', 220], ['centos', 250], ['ansible', 0], ['jenkins', 6],
];

function hashHue(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

function matchTopic(meta) {
  const hay = (meta.category + ' ' + meta.tags.join(' ') + ' ' + meta.title).toLowerCase();
  for (const [kw, hue] of TOPIC_HUES) {
    if (hay.includes(kw)) return { kw, hue };
  }
  return null;
}

function pickHue(meta) {
  const t = matchTopic(meta);
  if (t) return t.hue;
  const seed = meta.category || meta.tags[0] || meta.title;
  return hashHue(seed);
}

function label(meta) {
  const lab = meta.category || meta.tags[0] || (matchTopic(meta) && matchTopic(meta).kw) || 'BLOG';
  return lab.toUpperCase();
}

// ---- title wrapping (CJK aware) ----------------------------------------
function charWidth(ch) {
  const c = ch.codePointAt(0);
  // CJK / full-width ranges -> 1 unit, others -> 0.55 unit
  if (c >= 0x1100 && (
    c <= 0x115f || (c >= 0x2e80 && c <= 0xa4cf) ||
    (c >= 0xac00 && c <= 0xd7a3) || (c >= 0xf900 && c <= 0xfaff) ||
    (c >= 0xff00 && c <= 0xff60) || (c >= 0xffe0 && c <= 0xffe6) ||
    (c >= 0x3000 && c <= 0x303f))) return 1;
  return 0.55;
}

function wrap(title, maxUnits, maxLines) {
  const words = title.split(/(\s+)/); // keep spaces as tokens for latin
  const lines = [];
  let cur = '', curW = 0;
  const pushChar = (ch) => {
    const w = charWidth(ch);
    if (curW + w > maxUnits && cur !== '') { lines.push(cur); cur = ''; curW = 0; }
    cur += ch; curW += w;
  };
  for (const token of words) {
    // try to keep latin words intact if they fit on a line
    const tw = [...token].reduce((a, ch) => a + charWidth(ch), 0);
    if (/^\s+$/.test(token)) { if (cur) pushChar(' '); continue; }
    if (tw <= maxUnits && /^[\x00-\x7f]+$/.test(token)) {
      if (curW + tw > maxUnits && cur !== '') { lines.push(cur); cur = ''; curW = 0; }
      cur += token; curW += tw;
    } else {
      for (const ch of token) pushChar(ch);
    }
    if (lines.length >= maxLines) break;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length > maxLines) lines.length = maxLines;
  // ellipsis if truncated
  return lines.map(s => s.trim());
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---- SVG builder --------------------------------------------------------
const W = 1200, H = 500;
function buildSvg(meta) {
  const hue = pickHue(meta);
  const c1 = `hsl(${hue}, 62%, 46%)`;
  const c2 = `hsl(${(hue + 38) % 360}, 64%, 30%)`;
  const lab = esc(label(meta));
  const maxLines = 4;
  let lines = wrap(meta.title, 16, maxLines);
  const truncated = wrap(meta.title, 16, maxLines + 1).length > maxLines;
  if (truncated) {
    let last = lines[lines.length - 1];
    while ([...last].reduce((a, ch) => a + charWidth(ch), 0) > 15 && last.length) last = last.slice(0, -1);
    lines[lines.length - 1] = last + '…';
  }
  const fontSize = lines.length >= 4 ? 54 : lines.length === 3 ? 60 : 64;
  const lineH = fontSize * 1.22;
  const blockH = lines.length * lineH;
  let y = (H - blockH) / 2 + fontSize * 0.82 + 16; // nudge below label
  const tspans = lines.map((ln, i) =>
    `<tspan x="72" y="${Math.round(y + i * lineH)}">${esc(ln)}</tspan>`).join('');
  const font = "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP','Yu Gothic','Meiryo',system-ui,sans-serif";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(meta.title)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <circle cx="${W - 120}" cy="90" r="220" fill="#ffffff" opacity="0.06"/>
  <circle cx="${W - 260}" cy="${H - 40}" r="160" fill="#000000" opacity="0.06"/>
  <rect x="72" y="46" width="46" height="6" rx="3" fill="#ffffff" opacity="0.9"/>
  <text x="72" y="92" font-family="${font}" font-size="30" font-weight="700" letter-spacing="3" fill="#ffffff" opacity="0.92">${lab}</text>
  <text font-family="${font}" font-size="${fontSize}" font-weight="800" fill="#ffffff">${tspans}</text>
</svg>
`;
}

// ---- main ---------------------------------------------------------------
const files = fs.readdirSync(POSTS).filter(f => f.endsWith('.md'));
let made = 0, skipped = 0;
for (const f of files) {
  const full = path.join(POSTS, f);
  const text = fs.readFileSync(full, 'utf8');
  const parts = splitFrontMatter(text);
  if (!parts) { skipped++; continue; }
  if (/^cover:/m.test(parts.fm)) continue; // already has cover
  const meta = parseMeta(parts.fm);
  if (!meta.title) { skipped++; continue; }
  const base = f.replace(/\.md$/, '');
  const svgRel = `/img/cover/${base}.svg`;
  fs.writeFileSync(path.join(IMG_DIR, `${base}.svg`), buildSvg(meta));
  // insert cover after date line (or after title if no date)
  const fmLines = parts.fm.split('\n');
  let idx = fmLines.findIndex(l => /^date:/.test(l));
  if (idx === -1) idx = fmLines.findIndex(l => /^title:/.test(l));
  fmLines.splice(idx + 1, 0, `cover: ${svgRel}`);
  fs.writeFileSync(full, fmLines.join('\n') + parts.body);
  made++;
}
console.log(`generated: ${made} svg + cover, skipped: ${skipped}`);
