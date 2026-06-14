'use strict';
const fs = require('fs');
const path = require('path');

// Self-host FontAwesome Free (solid + brands only).
// CSS is generated from all.min.css with unused @font-face blocks and TTF fallbacks stripped.
// woff2 font files are pre-subsetted (solid: 11 icons, brands: 4 icons) and live in
// themes/icarus/source/webfonts/ — Hexo copies them to public/ automatically.
hexo.extend.generator.register('fontawesome', function() {
    const base = path.join(__dirname, '../node_modules/@fortawesome/fontawesome-free');

    let css = fs.readFileSync(path.join(base, 'css/all.min.css'), 'utf8');

    // Remove TTF fallback lines (format("truetype")); keep only woff2.
    css = css.replace(/,url\([^)]+\.ttf\) format\("truetype"\)/g, '');

    // Remove unused @font-face blocks: fa-regular, fa-v4compatibility.
    css = css.replace(/@font-face\{[^}]*fa-regular[^}]*\}/g, '');
    css = css.replace(/@font-face\{[^}]*fa-v4compat[^}]*\}/g, '');

    return { path: 'css/fontawesome-free.min.css', data: css };
});
