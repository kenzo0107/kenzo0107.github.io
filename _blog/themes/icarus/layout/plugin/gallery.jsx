const { Component, Fragment } = require('inferno');
const { cacheComponent } = require('hexo-component-inferno/lib/util/cache');

class Gallery extends Component {
    render() {
        const { head, hasImages, lightGallery, justifiedGallery } = this.props;

        if (!hasImages) {
            return null;
        }

        if (head) {
            const onloadIds = justifiedGallery ? `['lg-css','jg-css']` : `['lg-css']`;
            const onloadScript = `(function(){${onloadIds}.forEach(function(id){var l=document.getElementById(id);if(l)l.onload=function(){this.rel='stylesheet';};});})();`;
            // Expose JS URL for lazy loading in main.js; CSS is preloaded in background (non-blocking)
            const lgCfgScript = `window._lgCfg={jsUrl:${JSON.stringify(lightGallery.jsUrl)}};`;
            return <Fragment>
                <link rel="preload" href={lightGallery.cssUrl} as="style" id="lg-css" />
                {justifiedGallery ? <link rel="preload" href={justifiedGallery.cssUrl} as="style" id="jg-css" /> : null}
                {justifiedGallery ? <link rel="preload" href={justifiedGallery.jsUrl} as="script" /> : null}
                <script dangerouslySetInnerHTML={{ __html: onloadScript }}></script>
                <script dangerouslySetInnerHTML={{ __html: lgCfgScript }}></script>
                <noscript>
                    <link rel="stylesheet" href={lightGallery.cssUrl} />
                    {justifiedGallery ? <link rel="stylesheet" href={justifiedGallery.cssUrl} /> : null}
                </noscript>
            </Fragment>;
        }

        // lightGallery JS is loaded lazily on first image click (see main.js); only emit justifiedGallery JS if needed
        return <Fragment>
            {justifiedGallery ? <script src={justifiedGallery.jsUrl} defer></script> : null}
        </Fragment>;
    }
}

Gallery.Cacheable = cacheComponent(Gallery, 'plugin.gallery.async', props => {
    const { head, helper, page } = props;
    const content = (page && page.content) || '';
    const hasImages = content.includes('<img');
    const hasJustifiedGallery = content.includes('justified-gallery');
    return {
        head,
        hasImages,
        lightGallery: {
            jsUrl: helper.url_for('/js/lightgallery.min.js'),
            cssUrl: helper.url_for('/css/lightgallery-bundle.min.css')
        },
        justifiedGallery: hasJustifiedGallery ? {
            jsUrl: helper.cdn('justifiedGallery', '3.8.1', 'dist/js/jquery.justifiedGallery.min.js'),
            cssUrl: helper.cdn('justifiedGallery', '3.8.1', 'dist/css/justifiedGallery.min.css')
        } : null
    };
});

module.exports = Gallery;
