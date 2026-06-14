'use strict';
const fs = require('fs');
const path = require('path');

// Copy mermaid.min.js from node_modules to public/js/.
// Self-hosting eliminates the jsdelivr CDN request on mermaid diagram pages
// and allows SW cache-first after the first visit.
hexo.extend.generator.register('mermaid-js', function() {
    const src = path.join(__dirname, '../node_modules/mermaid/dist/mermaid.min.js');
    const js = fs.readFileSync(src, 'utf8');
    return { path: 'js/mermaid.min.js', data: js };
});
