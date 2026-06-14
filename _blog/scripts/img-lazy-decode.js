'use strict';

/**
 * post_render フィルタで記事内の全 <img> に loading="lazy" decoding="async" を付与。
 * hexo-renderer-marked の lazyload オプションが設定していない画像（link preview 等）をカバー。
 */
hexo.extend.filter.register('after_render:html', function(str) {
    return str.replace(/<img\b([^>]*?)(\s*\/)?>/gi, (match, attrs) => {
        const addLoading = !/\bloading=/.test(attrs) ? ' loading="lazy"' : '';
        const addDecoding = !/\bdecoding=/.test(attrs) ? ' decoding="async"' : '';
        if (!addLoading && !addDecoding) return match;
        return `<img${attrs}${addLoading}${addDecoding}>`;
    });
});
