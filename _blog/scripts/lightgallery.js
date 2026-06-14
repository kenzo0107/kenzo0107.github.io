'use strict';
const fs = require('fs');
const path = require('path');

// Copy lightgallery files from node_modules to public/.
// Self-hosting eliminates CDN requests and allows SW caching.
hexo.extend.generator.register('lightgallery', function() {
    const base = path.join(__dirname, '../node_modules/lightgallery');
    const js = fs.readFileSync(path.join(base, 'lightgallery.min.js'), 'utf8');
    const css = fs.readFileSync(path.join(base, 'css/lightgallery-bundle.min.css'), 'utf8');
    return [
        { path: 'js/lightgallery.min.js', data: js },
        { path: 'css/lightgallery-bundle.min.css', data: css },
    ];
});
