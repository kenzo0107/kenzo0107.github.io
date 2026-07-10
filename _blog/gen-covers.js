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
  ['google cloud', 217], ['gcp', 217], ['bigquery', 217],
];

function hashHue(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

// キーワードは単語境界で一致させる（例: "go" が "google" の部分文字列としてヒットしないように）
function matchTopic(meta) {
  const hay = (meta.category + ' ' + meta.tags.join(' ') + ' ' + meta.title).toLowerCase();
  for (const [kw, hue] of TOPIC_HUES) {
    const re = new RegExp(`(?:^|[^a-z0-9])${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[^a-z0-9]|$)`);
    if (re.test(hay)) return { kw, hue };
  }
  return null;
}

function pickHue(meta) {
  const t = matchTopic(meta);
  if (t) return t.hue;
  const seed = meta.category || meta.tags[0] || meta.title;
  return hashHue(seed);
}

// 見栄えの良い表記へ整える表示名マップ（キーは小文字キーワード）
const DISPLAY = {
  aws: 'AWS', lambda: 'Lambda', ec2: 'EC2', ecs: 'ECS', fargate: 'Fargate', s3: 'S3',
  rds: 'RDS', aurora: 'Aurora', dynamodb: 'DynamoDB', cloudwatch: 'CloudWatch', vpc: 'VPC',
  terraform: 'Terraform', datadog: 'Datadog', prometheus: 'Prometheus', kibana: 'Kibana',
  elasticsearch: 'Elasticsearch', fluentd: 'Fluentd', go: 'Go', golang: 'Go', python: 'Python',
  ruby: 'Ruby', php: 'PHP', node: 'Node.js', docker: 'Docker', kubernetes: 'Kubernetes',
  gke: 'GKE', nginx: 'Nginx', mysql: 'MySQL', postgresql: 'PostgreSQL', redis: 'Redis',
  raspberrypi: 'Raspberry Pi', raspberry: 'Raspberry Pi', iot: 'IoT', slack: 'Slack',
  git: 'Git', github: 'GitHub', ssl: 'SSL', ssh: 'SSH', mac: 'macOS', macosx: 'macOS',
  centos: 'CentOS', ansible: 'Ansible', jenkins: 'Jenkins',
  'google cloud': 'Google Cloud', gcp: 'Google Cloud', bigquery: 'BigQuery',
};

// カバーの主役テキスト。タイトルは使わず、トピック/技術名・カテゴリを表示する。
function headline(meta) {
  const t = matchTopic(meta);
  if (t) return DISPLAY[t.kw] || t.kw.toUpperCase();
  if (meta.category) return meta.category;
  if (meta.tags[0]) return meta.tags[0];
  return 'Tech Note';
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
const FONT = "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP','Yu Gothic','Meiryo',system-ui,sans-serif";
const BRAND = 'KENZO0107.GITHUB.IO';

// テキスト幅の概算（フォントサイズに対する単位幅の合計）
function textWidth(s, fontSize) {
  return [...s].reduce((a, ch) => a + charWidth(ch), 0) * fontSize;
}

// maxPx に収まるフォントサイズを返す（max/min でクランプ）
function fitFont(s, maxPx, max, min) {
  const units = [...s].reduce((a, ch) => a + charWidth(ch), 0) || 1;
  return Math.max(min, Math.min(max, Math.floor(maxPx / units)));
}

function buildSvg(meta) {
  const hue = pickHue(meta);
  const c1 = `hsl(${hue}, 62%, 46%)`;
  const c2 = `hsl(${(hue + 38) % 360}, 64%, 30%)`;
  const PAD = 72;
  const maxW = W - PAD * 2;

  // 主役テキスト（タイトルではなくトピック/カテゴリ）
  const head = headline(meta);
  const headSize = fitFont(head, maxW, 132, 46);

  // タグ pill（最大4件、主役と重複するものは除く）
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const headNorm = norm(head);
  const pillFont = 26;
  const pills = [];
  let px = PAD;
  for (const tag of meta.tags) {
    if (norm(tag) === headNorm) continue;
    const tw = textWidth(tag, pillFont);
    const pw = Math.round(tw + 36);
    if (px + pw > W - PAD) break;
    pills.push({ tag, x: px, w: pw });
    px += pw + 14;
    if (pills.length >= 4) break;
  }
  const pillH = 44;
  const pillY = H - PAD - pillH + 8;
  const pillSvg = pills.map(p =>
    `<rect x="${p.x}" y="${pillY}" width="${p.w}" height="${pillH}" rx="${pillH / 2}" fill="#ffffff" opacity="0.16"/>` +
    `<text x="${p.x + p.w / 2}" y="${pillY + pillH / 2 + pillFont * 0.36}" text-anchor="middle" font-family="${FONT}" font-size="${pillFont}" font-weight="600" fill="#ffffff">${esc(p.tag)}</text>`
  ).join('\n  ');

  // 主役テキストの縦位置（中央やや上）
  const headY = pills.length ? H * 0.5 + headSize * 0.32 : H * 0.55 + headSize * 0.32;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(head)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
    <pattern id="dots" width="34" height="34" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="3" fill="#ffffff" opacity="0.10"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="${W - 320}" y="${H - 230}" width="320" height="230" fill="url(#dots)"/>
  <circle cx="${W - 140}" cy="120" r="240" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.14"/>
  <circle cx="${W - 140}" cy="120" r="150" fill="#ffffff" opacity="0.05"/>
  <rect x="${PAD}" y="64" width="46" height="6" rx="3" fill="#ffffff" opacity="0.9"/>
  <text x="${PAD}" y="108" font-family="${FONT}" font-size="26" font-weight="700" letter-spacing="3" fill="#ffffff" opacity="0.85">${BRAND}</text>
  <text x="${PAD}" y="${Math.round(headY)}" font-family="${FONT}" font-size="${headSize}" font-weight="800" fill="#ffffff">${esc(head)}</text>
  ${pillSvg}
</svg>
`;
}

// ---- main ---------------------------------------------------------------
const files = fs.readdirSync(POSTS).filter(f => f.endsWith('.md'));
let made = 0, regenerated = 0, skipped = 0;
for (const f of files) {
  const full = path.join(POSTS, f);
  const text = fs.readFileSync(full, 'utf8');
  const parts = splitFrontMatter(text);
  if (!parts) { skipped++; continue; }
  const meta = parseMeta(parts.fm);
  if (!meta.title) { skipped++; continue; }
  const base = f.replace(/\.md$/, '');
  const svgRel = `/img/cover/${base}.svg`;
  // SVG は常に再生成する（デザイン更新を既存記事へも反映するため）
  fs.writeFileSync(path.join(IMG_DIR, `${base}.svg`), buildSvg(meta));
  if (/^cover:/m.test(parts.fm)) { regenerated++; continue; } // cover 行は既にある
  // insert cover after date line (or after title if no date)
  const fmLines = parts.fm.split('\n');
  let idx = fmLines.findIndex(l => /^date:/.test(l));
  if (idx === -1) idx = fmLines.findIndex(l => /^title:/.test(l));
  fmLines.splice(idx + 1, 0, `cover: ${svgRel}`);
  fs.writeFileSync(full, fmLines.join('\n') + parts.body);
  made++;
}
console.log(`cover added: ${made}, svg regenerated: ${regenerated}, skipped: ${skipped}`);
