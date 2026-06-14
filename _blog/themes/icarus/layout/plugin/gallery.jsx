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
            return <Fragment>
                <link rel="preload" href={lightGallery.cssUrl} as="style" id="lg-css" />
                {justifiedGallery ? <link rel="preload" href={justifiedGallery.cssUrl} as="style" id="jg-css" /> : null}
                <script dangerouslySetInnerHTML={{ __html: onloadScript }}></script>
                <noscript>
                    <link rel="stylesheet" href={lightGallery.cssUrl} />
                    {justifiedGallery ? <link rel="stylesheet" href={justifiedGallery.cssUrl} /> : null}
                </noscript>
            </Fragment>;
        }

        // main.js already initializes lightGallery and justifiedGallery — only emit JS files
        return <Fragment>
            <script src={lightGallery.jsUrl} defer></script>
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
            jsUrl: helper.cdn('lightgallery', '1.10.0', 'dist/js/lightgallery.min.js'),
            cssUrl: helper.cdn('lightgallery', '1.10.0', 'dist/css/lightgallery.min.css')
        },
        justifiedGallery: hasJustifiedGallery ? {
            jsUrl: helper.cdn('justifiedGallery', '3.8.1', 'dist/js/jquery.justifiedGallery.min.js'),
            cssUrl: helper.cdn('justifiedGallery', '3.8.1', 'dist/css/justifiedGallery.min.css')
        } : null
    };
});

module.exports = Gallery;
