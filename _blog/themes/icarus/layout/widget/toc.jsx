const { cacheComponent } = require('hexo-component-inferno/lib/util/cache');
const Toc = require('hexo-component-inferno/lib/view/widget/toc');

// hexo-toc プラグインは見出しの内容を <span id="slug"> で包み、<hN> 自身の id を削除する。
// Icarus 目次ウィジェット（hexo-util tocObj）は <hN> の id を読むため、このままでは
// 目次リンクがすべて href="#" になりクリックしてもスクロールしない。
// 描画前にコンテンツ上の <hN><span id="X"> を <hN id="X"><span> に正規化し、
// tocObj が正しいアンカー (#X) を生成できるようにする。
// 本文側の id は <hN> へ移るだけでアンカー位置は変わらないため、スクロール先として機能する。
function hoistHeadingIds(content) {
    if (typeof content !== 'string' || content.indexOf('<span id=') === -1) {
        return content;
    }
    return content.replace(
        /<(h[1-6])((?:\s[^>]*)?)>\s*<span id="([^"]+)"\s*>/gi,
        (match, tag, attrs, id) => (/ id=/i.test(attrs) ? match : `<${tag}${attrs} id="${id}"><span>`)
    );
}

module.exports = cacheComponent(Toc, 'widget.toc', props => {
    const { config, page, widget, helper } = props;
    const { layout, content, encrypt, origin } = page;
    const { index, collapsed = true, depth = 3 } = widget;
    if (config.toc !== true || (layout !== 'page' && layout !== 'post')) {
        return null;
    }
    return {
        title: helper._p('widget.catalogue', Infinity),
        collapsed: collapsed !== false,
        maxDepth: depth | 0,
        showIndex: index !== false,
        content: hoistHeadingIds(encrypt ? origin : content),
        jsUrl: helper.url_for('/js/toc.js')
    };
});
