'use strict';
const fs = require('fs');
const path = require('path');

// Self-host FontAwesome Free (solid + brands only).
// - Strip TTF fallback src lines and unused font-faces (regular, v4compat)
//   so the browser never requests missing font files.
// - Serve fonts at /webfonts/ to match the CSS relative path ../webfonts/.
hexo.extend.generator.register('fontawesome', function() {
    const base = path.join(__dirname, '../node_modules/@fortawesome/fontawesome-free');

    let css = fs.readFileSync(path.join(base, 'css/all.min.css'), 'utf8');

    // Remove TTF fallback lines (format("truetype")); keep only woff2.
    css = css.replace(/,url\([^)]+\.ttf\) format\("truetype"\)/g, '');

    // Remove unused @font-face blocks: fa-regular, fa-v4compatibility.
    css = css.replace(/@font-face\{[^}]*fa-regular[^}]*\}/g, '');
    css = css.replace(/@font-face\{[^}]*fa-v4compat[^}]*\}/g, '');

    return [
        { path: 'css/fontawesome-free.min.css',    data: css },
        { path: 'webfonts/fa-solid-900.woff2',      data: fs.readFileSync(path.join(base, 'webfonts/fa-solid-900.woff2')) },
        { path: 'webfonts/fa-brands-400.woff2',     data: fs.readFileSync(path.join(base, 'webfonts/fa-brands-400.woff2')) },
    ];
});
