'use strict';
const fs = require('fs');
const path = require('path');

// Self-host FontAwesome Free with aggressive CSS tree-shaking.
// - Strip all icon class definitions except the ~15 actually used in templates.
// - Strip TTF fallback src lines; keep only woff2.
// - Strip unused @font-face blocks (regular, legacy FA5, v4compat).
// woff2 font files are pre-subsetted (solid: 11 icons, brands: 4 icons) and live in
// themes/icarus/source/webfonts/ — Hexo copies them to public/ automatically.

const ICONS_NEEDED = new Set([
    'fa-angle-down', 'fa-angle-right', 'fa-chevron-left', 'fa-chevron-right', 'fa-chevron-up',
    'fa-copy', 'fa-list-ul', 'fa-map-marker-alt', 'fa-moon', 'fa-sun', 'fa-rss',
    'fa-github', 'fa-x-twitter', 'fa-twitter', 'fa-patreon',
]);

function stripIconClasses(css) {
    // Match single and multi-selector icon rules: .fa-xxx{--fa:"..."}
    return css.replace(/((?:\.fa-[a-z0-9-]+,)*\.fa-[a-z0-9-]+)\{--fa:"[^"]*"\}/g, (match, selectors) => {
        const parts = selectors.split(',');
        const needed = parts.filter(s => ICONS_NEEDED.has(s.slice(1)));
        if (!needed.length) return '';
        const body = match.slice(selectors.length);
        return needed.join(',') + body;
    });
}

hexo.extend.generator.register('fontawesome', function() {
    const base = path.join(__dirname, '../node_modules/@fortawesome/fontawesome-free');
    let css = fs.readFileSync(path.join(base, 'css/all.min.css'), 'utf8');

    // Remove unused icon classes (1900+ definitions → 15)
    css = stripIconClasses(css);

    // Remove TTF fallback lines; keep only woff2
    css = css.replace(/,url\([^)]+\.ttf\) format\("truetype"\)/g, '');

    // Remove unused @font-face blocks
    css = css.replace(/@font-face\{font-family:"Font Awesome 6 Free";font-style:normal;font-weight:400[^}]*\}/g, '');
    css = css.replace(/@font-face\{font-family:"Font Awesome 5[^}]*\}/g, '');
    css = css.replace(/@font-face\{font-family:"FontAwesome"[^}]*\}/g, '');
    css = css.replace(/@font-face\{font-family:"Font Awesome 6 Free";font-style:italic[^}]*\}/g, '');

    return { path: 'css/fontawesome-free.min.css', data: css };
});
