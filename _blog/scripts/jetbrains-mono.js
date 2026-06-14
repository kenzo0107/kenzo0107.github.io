'use strict';
const fs = require('fs');
const path = require('path');

// Self-host JetBrains Mono (Latin subset, weights 400 + 600).
// Eliminates one @font-face from Google Fonts CSS and enables direct woff2 preload.
hexo.extend.generator.register('jetbrains-mono', function() {
    const base = path.join(__dirname, '../node_modules/@fontsource/jetbrains-mono/files');
    return [
        {
            path: 'fonts/jetbrains-mono-400.woff2',
            data: fs.readFileSync(path.join(base, 'jetbrains-mono-latin-400-normal.woff2')),
        },
        {
            path: 'fonts/jetbrains-mono-600.woff2',
            data: fs.readFileSync(path.join(base, 'jetbrains-mono-latin-600-normal.woff2')),
        },
    ];
});
