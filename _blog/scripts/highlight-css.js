'use strict';
const fs = require('fs');
const path = require('path');

// Copy highlight.js github-dark theme from node_modules to public/css/.
// Self-hosting eliminates the jsdelivr CDN request and allows SW caching.

let _hlCssCache = null;
function getHlCss() {
    if (!_hlCssCache) {
        const src = path.join(__dirname, '../node_modules/highlight.js/styles/github-dark.min.css');
        _hlCssCache = fs.readFileSync(src, 'utf8');
    }
    return _hlCssCache;
}

hexo.extend.generator.register('highlight-css', function() {
    return { path: 'css/highlight-dark.min.css', data: getHlCss() };
});

// Helper: inline highlight CSS into pages with code blocks, eliminating the async load.
hexo.extend.helper.register('highlight_dark_css', function() {
    return getHlCss();
});
