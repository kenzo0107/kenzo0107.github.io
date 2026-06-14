'use strict';
const fs = require('fs');
const path = require('path');

// Copy pace.min.js from node_modules to public/js/.
// Self-hosting eliminates the jsdelivr CDN request and allows SW caching.
hexo.extend.generator.register('pace-js', function() {
    const src = path.join(__dirname, '../node_modules/pace-js/pace.min.js');
    const js = fs.readFileSync(src, 'utf8');
    return { path: 'js/pace.min.js', data: js };
});
