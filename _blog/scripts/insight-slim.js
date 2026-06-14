'use strict';

/**
 * content.json の post/page テキストを先頭 500 文字に制限してファイルサイズを削減する。
 * before_exit フィルタで生成済みファイルを上書きする。
 */

const fs = require('fs');
const path = require('path');

// insight.js renders snippets at maxlen=100, so 100 chars is sufficient for both matching and display
const TEXT_LIMIT = 100;

hexo.extend.filter.register('before_exit', function() {
    const isGenerate = ['g', 'generate'].includes(hexo.env.cmd);
    if (!isGenerate) return;

    const filePath = path.join(hexo.public_dir, 'content.json');
    if (!fs.existsSync(filePath)) return;

    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);

    function trimText(item) {
        if (typeof item.text === 'string') {
            item.text = item.text.slice(0, TEXT_LIMIT);
        }
        return item;
    }

    if (Array.isArray(data.posts)) data.posts = data.posts.map(trimText);
    if (Array.isArray(data.pages)) data.pages = data.pages.map(trimText);

    fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
});
