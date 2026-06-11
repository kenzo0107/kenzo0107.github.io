const { Component, Fragment } = require('inferno');
const Paginator = require('hexo-component-inferno/lib/view/misc/paginator');

module.exports = class extends Component {
    render() {
        const { config, page, helper } = this.props;
        const { __, url_for, date, date_xml } = helper;

        return <Fragment>
            <div class="columns is-multiline article-cards">
                {page.posts.map(post => {
                    const cover = post.cover || post.thumbnail;
                    const coverUrl = cover ? url_for(cover) : null;
                    const link = url_for(post.link || post.path);
                    return <div class="column is-half-tablet is-one-third-desktop">
                        <div class="card article-card">
                            <a href={link} class="card-image-link" aria-label={post.title}>
                                <div class="card-image">
                                    {coverUrl
                                        ? <figure class="image article-card-cover">
                                            <img class="fill" src={coverUrl} alt={post.title || coverUrl} />
                                        </figure>
                                        : <figure class="image article-card-cover article-card-noimage">
                                            <span class="article-card-noimage-text has-ratio">{post.title}</span>
                                        </figure>}
                                </div>
                            </a>
                            <div class="card-content">
                                <div class="article-card-meta is-size-7 is-uppercase">
                                    {post.date ? <time class="article-card-date" dateTime={date_xml(post.date)}>{date(post.date)}</time> : null}
                                    {post.categories && post.categories.length ? <span class="article-card-category">
                                        {post.categories.map(c => <a class="link-muted" href={url_for(c.path)}>{c.name}</a>)}
                                    </span> : null}
                                </div>
                                <p class="article-card-title">
                                    <a class="link-muted" href={link}>{post.title}</a>
                                </p>
                            </div>
                        </div>
                    </div>;
                })}
            </div>
            {page.total > 1 ? <Paginator
                current={page.current}
                total={page.total}
                baseUrl={page.base}
                path={config.pagination_dir}
                urlFor={url_for}
                prevTitle={__('common.prev')}
                nextTitle={__('common.next')} /> : null}
        </Fragment>;
    }
};
