const { Component, Fragment } = require('inferno');
const { toMomentLocale } = require('hexo/dist/plugins/helper/date');
const Plugins = require('./plugins');

module.exports = class extends Component {
    render() {
        const { site, config, helper, page } = this.props;
        const { url_for, cdn } = helper;
        const { article } = config;
        const language = toMomentLocale(page.lang || page.language || config.language || 'en');

        let fold = 'unfolded';
        let clipboard = true;
        if (article && article.highlight) {
            if (typeof article.highlight.clipboard !== 'undefined') {
                clipboard = !!article.highlight.clipboard;
            }
            if (typeof article.highlight.fold === 'string') {
                fold = article.highlight.fold;
            }
        }

        const embeddedConfig = `var IcarusThemeSettings = {
            article: {
                highlight: {
                    clipboard: ${clipboard},
                    fold: '${fold}'
                }
            }
        };`;

        const hasMermaid = config.mermaid && config.mermaid.enable
            && page && page.content && page.content.includes('class="mermaid"');

        const needsLocale = language !== 'en';

        return <Fragment>
            <script src={cdn('jquery', '3.3.1', 'dist/jquery.slim.min.js')}></script>
            <script src={cdn('moment', '2.22.2', 'min/moment.min.js')}></script>
            {needsLocale && <script src={`https://cdn.jsdelivr.net/npm/moment@2.22.2/locale/${language}.js`}></script>}
            {clipboard && <script src={cdn('clipboard', '2.0.4', 'dist/clipboard.min.js')} defer></script>}
            <script dangerouslySetInnerHTML={{ __html: `moment.locale("${language}");` }}></script>
            <script dangerouslySetInnerHTML={{ __html: embeddedConfig }}></script>
            <script data-pjax src={url_for('/js/column.js')} defer></script>
            <Plugins site={site} config={config} page={page} helper={helper} head={false} />
            <script data-pjax src={url_for('/js/main.js')} defer></script>
            {hasMermaid ? <script src={`https://cdn.jsdelivr.net/npm/mermaid@${config.mermaid.version}/dist/mermaid.min.js`} defer></script> : null}
        </Fragment>;
    }
};
