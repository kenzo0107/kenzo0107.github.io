const { Component } = require('inferno');
const { cacheComponent } = require('hexo-component-inferno/lib/util/cache');

class CategoryBar extends Component {
    render() {
        const { categories } = this.props;
        if (!Array.isArray(categories) || categories.length === 0) return null;

        return <div class="category-bar is-hidden-touch">
            <div class="container">
                <div class="category-bar-inner">
                    {categories.map(category => (
                        <a class="category-bar-item" href={category.url}>
                            {category.name}
                        </a>
                    ))}
                </div>
            </div>
        </div>;
    }
}

module.exports = cacheComponent(CategoryBar, 'common.category_bar', props => {
    const { site, helper } = props;
    const { url_for } = helper;

    const categories = [];
    if (site && site.categories && site.categories.length) {
        const seen = new Set();
        site.categories.toArray()
            .map(category => ({
                name: category.name,
                url: url_for(category.path),
                count: category.posts.filter(post => post.lang !== 'en').length
            }))
            .filter(category => category.count > 0)
            .sort((a, b) => b.count - a.count)
            .filter(category => {
                if (seen.has(category.name)) return false;
                seen.add(category.name);
                return true;
            })
            .forEach(category => categories.push(category));
    }

    return { categories };
});
