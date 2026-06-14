'use strict';
const fs = require('fs');
const path = require('path');

// Copy highlight.js github-dark theme from node_modules to public/css/.
// Self-hosting eliminates the jsdelivr CDN request and allows SW caching.
hexo.extend.generator.register('highlight-css', function() {
    const src = path.join(__dirname, '../node_modules/highlight.js/styles/github-dark.min.css');
    const css = fs.readFileSync(src, 'utf8');
    return { path: 'css/highlight-dark.min.css', data: css };
});
