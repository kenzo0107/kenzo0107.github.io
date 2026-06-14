const { Component } = require('inferno');
const { cacheComponent } = require('hexo-component-inferno/lib/util/cache');

/**
 * AddThis share buttons — lazy-loaded via IntersectionObserver.
 * The script is only fetched when the share div scrolls into view,
 * avoiding an unnecessary connection to s7.addthis.com on initial load.
 */
class AddThis extends Component {
    render() {
        const { installUrl } = this.props;
        if (!installUrl) {
            return <div class="notification is-danger">
                You need to set <code>install_url</code> to use AddThis.
            </div>;
        }

        const lazyScript = `(function(){var el=document.querySelector('.addthis_inline_share_toolbox[data-addthis-lazy]');if(!el)return;var io=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){io.disconnect();var s=document.createElement('script');s.src='${installUrl}';s.defer=true;document.head.appendChild(s);el.removeAttribute('data-addthis-lazy')}})},{rootMargin:'200px'});io.observe(el)})();`;

        return <div>
            <div class="addthis_inline_share_toolbox" data-addthis-lazy="1"></div>
            <script dangerouslySetInnerHTML={{ __html: lazyScript }}></script>
        </div>;
    }
}

AddThis.Cacheable = cacheComponent(AddThis, 'share.addthis.lazy', props => {
    const { share } = props;
    return {
        installUrl: share.install_url
    };
});

module.exports = AddThis;
