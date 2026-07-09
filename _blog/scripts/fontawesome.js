'use strict';

// Minimal self-hosted FontAwesome CSS — contains ONLY what the templates actually use.
// - Base rendering rules (.fa, .fas, .fab, ::before content var)
// - @font-face for solid (woff2 only, font-display:swap)
// - @font-face for brands (woff2 only, font-display:swap)
// - 15 icon-specific --fa custom-property definitions
// All utility classes (size modifiers, pull, border, stack, animations, etc.) are omitted.

const BASE_RULES =
    '.fa{font-family:var(--fa-style-family,"Font Awesome 6 Free");font-weight:var(--fa-style,900)}' +
    '.fa,.fa-brands,.fa-regular,.fa-solid,.fab,.far,.fas{' +
        '-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;' +
        'display:inline-block;font-style:normal;font-variant:normal;line-height:1;text-rendering:auto}' +
    '.fa-brands:before,.fa-regular:before,.fa-solid:before,.fa:before,.fab:before,.far:before,.fas:before{content:var(--fa)}' +
    '.fa-classic,.fa-regular,.fa-solid,.far,.fas{font-family:"Font Awesome 6 Free"}' +
    '.fa-brands,.fab{font-family:"Font Awesome 6 Brands"}';

const FONT_FACES =
    '@font-face{font-family:"Font Awesome 6 Free";font-style:normal;font-weight:900;' +
    'font-display:swap;src:url("/webfonts/fa-solid-900.woff2") format("woff2")}' +
    '@font-face{font-family:"Font Awesome 6 Brands";font-style:normal;font-weight:400;' +
    'font-display:swap;src:url("/webfonts/fa-brands-400.woff2") format("woff2")}';

// Only the icons actually used in templates and JS files.
// Unicode codepoints from FontAwesome 6.7.2.
const ICON_DEFS = [
    ['.fa-angle-down',    '\\f107'],
    ['.fa-angle-right',   '\\f105'],
    ['.fa-chevron-left',  '\\f053'],
    ['.fa-chevron-right', '\\f054'],
    ['.fa-chevron-up',    '\\f077'],
    ['.fa-copy',          '\\f0c5'],
    ['.fa-list-ul',       '\\f0ca'],
    ['.fa-map-marker-alt','\\f3c5'],
    ['.fa-moon',          '\\f186'],
    ['.fa-sun',           '\\f185'],
    ['.fa-rss',           '\\f09e'],
    ['.fa-search',        '\\f002'],
    ['.fa-github',        '\\f09b'],
    ['.fa-x-twitter',     '\\e61b'],
    ['.fa-twitter',       '\\f099'],
    ['.fa-patreon',       '\\f3d9'],
].map(([cls, cp]) => `${cls}:before{--fa:"${cp}"}`).join('');

function buildFaCss() {
    return BASE_RULES + FONT_FACES + ICON_DEFS;
}

let _faCssCache = null;
function getFaCss() {
    if (!_faCssCache) _faCssCache = buildFaCss();
    return _faCssCache;
}

// Generator: keep the standalone file for SW pre-cache and direct URL access.
hexo.extend.generator.register('fontawesome', function() {
    return { path: 'css/fontawesome-free.min.css', data: getFaCss() };
});

// Helper: used by head.jsx to inline FA CSS directly in <style>, eliminating
// a separate HTTP request and ensuring icons render on first paint.
hexo.extend.helper.register('fontawesome_css', function() {
    return getFaCss();
});
