const { Component, Fragment } = require('inferno');
const Plugins = require('./plugins');

module.exports = class extends Component {
    render() {
        const { site, config, helper, page } = this.props;
        const { url_for } = helper;
        const { article } = config;

        let clipboard = true;
        if (article && article.highlight && typeof article.highlight.clipboard !== 'undefined') {
            clipboard = !!article.highlight.clipboard;
        }

        const hasMermaid = config.mermaid && config.mermaid.enable
            && page && page.content && page.content.includes('class="mermaid"');
        const hasCodeBlocks = !!(page.content && page.content.includes('<figure class="highlight'));

        return <Fragment>
            <script data-pjax src={url_for('/js/column.js')} defer></script>
            <Plugins site={site} config={config} page={page} helper={helper} head={false} />
            <script data-pjax src={url_for('/js/main.js')} defer></script>
            {hasMermaid ? <script src={`https://cdn.jsdelivr.net/npm/mermaid@${config.mermaid.version}/dist/mermaid.min.js`} defer></script> : null}
        </Fragment>;
    }
};
