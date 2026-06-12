const { Component } = require('inferno');
const Article = require('./common/article');

module.exports = class extends Component {
    render() {
        const { site, config, page, helper } = this.props;

        return <Article site={site} config={config} page={page} helper={helper} index={false} />;
    }
};
