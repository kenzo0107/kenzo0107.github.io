const { Component, Fragment } = require('inferno');
const { cacheComponent } = require('hexo-component-inferno/lib/util/cache');
const classname = require('hexo-component-inferno/lib/util/classname');

function isSameLink(a, b) {
    function santize(url) {
        let paths = url.replace(/(^\w+:|^)\/\//, '').split('#')[0].split('/').filter(p => p.trim() !== '');
        if (paths.length > 0 && paths[paths.length - 1].trim() === 'index.html') {
            paths = paths.slice(0, paths.length - 1);
        }
        return paths.join('/');
    }
    return santize(a) === santize(b);
}

// 言語コード → 表示ラベル
const LANGUAGE_LABELS = {
    ja: 'Original',
    en: 'English'
};

class Navbar extends Component {
    render() {
        const {
            logo,
            logoUrl,
            siteUrl,
            siteTitle,
            menu,
            links,
            categories,
            categoriesTitle,
            translations,
            showToc,
            tocTitle,
            showSearch,
            searchTitle
        } = this.props;

        let navbarLogo = '';
        if (logo) {
            if (logo.text) {
                navbarLogo = logo.text;
            } else {
                navbarLogo = <img src={logoUrl} alt={siteTitle} height="28" />;
            }
        } else {
            navbarLogo = siteTitle;
        }

        const hasCategories = Array.isArray(categories) && categories.length > 0;

        return <nav class="navbar navbar-main">
            <div class="container navbar-container">
                <div class="navbar-brand justify-content-center">
                    <a class="navbar-item navbar-logo" href={siteUrl}>
                        {navbarLogo}
                    </a>
                    {/* 言語ピルトグル（スマホ: ハンバーガーの外に常時表示） */}
                    <div class="navbar-item lang-toggle is-hidden-desktop">
                        <div class="lang-toggle-pill">
                            {translations.map(t => <a class={classname({ 'lang-toggle-option': true, 'is-active': t.active })} href={t.url}>{t.label}</a>)}
                        </div>
                    </div>
                    {/* スマホ常時表示: ダーク/ライト切り替え + 検索 */}
                    <a class="navbar-item theme-toggle is-hidden-desktop" title="Toggle dark mode" href="javascript:;" aria-label="Toggle dark mode">
                        <i class="fas fa-moon theme-toggle-dark"></i>
                        <i class="fas fa-sun theme-toggle-light"></i>
                    </a>
                    {showSearch ? <a class="navbar-item search is-hidden-desktop" title={searchTitle} href="javascript:;">
                        <i class="fas fa-search"></i>
                    </a> : null}
                    {/* スマホ用ハンバーガーボタン */}
                    <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false" data-target="navbar-menu">
                        <span aria-hidden="true"></span>
                        <span aria-hidden="true"></span>
                        <span aria-hidden="true"></span>
                    </a>
                </div>
                <div id="navbar-menu" class="navbar-menu">
                    <div class="navbar-start">
                        {/* Categories ドロップダウン（PC: ホバー表示 / スマホ: ハンバーガー内で展開） */}
                        {hasCategories ? <div class="navbar-item has-dropdown is-hoverable navbar-categories">
                            <a class="navbar-link" href="javascript:;">{categoriesTitle}</a>
                            <div class="navbar-dropdown">
                                {categories.map(category => <a class="navbar-item" href={category.url}>
                                    <span>{category.name}</span>
                                    <span class="navbar-category-count">{category.count}</span>
                                </a>)}
                            </div>
                        </div> : null}
                        {Object.keys(menu).map(name => {
                            const item = menu[name];
                            return <a class={classname({ 'navbar-item': true, 'is-active': item.active })} href={item.url}>{name}</a>;
                        })}
                    </div>
                    <div class="navbar-end">
                        {Object.keys(links).length ? <Fragment>
                            {Object.keys(links).map(name => {
                                const link = links[name];
                                return <a class="navbar-item" target="_blank" rel="noopener" title={name} href={link.url}>
                                    {link.icon ? <i class={link.icon}></i> : name}
                                </a>;
                            })}
                        </Fragment> : null}
                        {/* 言語ピルトグル（デスクトップのみ; スマホは navbar-brand に表示） */}
                        {Array.isArray(translations) && translations.length > 1 ? <div class="navbar-item lang-toggle is-hidden-touch">
                            <div class="lang-toggle-pill">
                                {translations.map(t => <a class={classname({ 'lang-toggle-option': true, 'is-active': t.active })} href={t.url}>{t.label}</a>)}
                            </div>
                        </div> : null}
                        {/* ダーク / ライト切り替えトグル（デスクトップ; スマホは navbar-brand に表示） */}
                        <a class="navbar-item theme-toggle is-hidden-touch" title="Toggle dark mode" href="javascript:;" aria-label="Toggle dark mode">
                            <i class="fas fa-moon theme-toggle-dark"></i>
                            <i class="fas fa-sun theme-toggle-light"></i>
                        </a>
                        {showToc ? <a class="navbar-item is-hidden-tablet catalogue" title={tocTitle} href="javascript:;">
                            <i class="fas fa-list-ul"></i>
                        </a> : null}
                        {showSearch ? <a class="navbar-item search is-hidden-touch" title={searchTitle} href="javascript:;">
                            <i class="fas fa-search"></i>
                        </a> : null}
                    </div>
                </div>
            </div>
        </nav>;
    }
}

module.exports = cacheComponent(Navbar, 'common.navbar', props => {
    const { site, config, helper, page } = props;
    const { url_for, _p, __ } = helper;
    const { logo, title, navbar, widgets, search } = config;

    const hasTocWidget = Array.isArray(widgets) && widgets.find(widget => widget.type === 'toc');
    const showToc = (config.toc === true || page.toc) && hasTocWidget && ['page', 'post'].includes(page.layout);

    const pageUrl = typeof page.path !== 'undefined' ? url_for(page.path) : '';

    const menu = {};
    if (navbar && navbar.menu) {
        Object.keys(navbar.menu).forEach(name => {
            const url = url_for(navbar.menu[name]);
            const active = isSameLink(url, pageUrl);
            menu[name] = { url, active };
        });
    }

    const links = {};
    if (navbar && navbar.links) {
        Object.keys(navbar.links).forEach(name => {
            const link = navbar.links[name];
            links[name] = {
                url: url_for(typeof link === 'string' ? link : link.url),
                icon: link.icon
            };
        });
    }

    // site.categories から投稿数の多い順にカテゴリ一覧を生成（ヘッダーのドロップダウン用）
    // 翻訳記事(lang: en)は日本語サイトの集計から除外する
    const categories = [];
    if (site && site.categories && site.categories.length) {
        site.categories.toArray()
            .map(category => ({
                name: category.name,
                url: url_for(category.path),
                count: category.posts.filter(post => post.lang !== 'en').length
            }))
            .filter(category => category.count > 0)
            .sort((a, b) => b.count - a.count)
            .forEach(category => categories.push(category));
    }

    // 翻訳リンク（front-matter の translation_id が一致する記事 / ページを言語別に収集）
    const translations = [];
    if (page.translation_id && site) {
        const collect = collection => {
            if (collection && typeof collection.forEach === 'function') {
                collection.forEach(item => {
                    if (item.translation_id === page.translation_id && item.path) {
                        const lang = item.lang || item.language || 'ja';
                        translations.push({
                            lang,
                            url: url_for(item.path),
                            label: LANGUAGE_LABELS[lang] || lang,
                            active: url_for(item.path) === pageUrl
                        });
                    }
                });
            }
        };
        collect(site.posts);
        collect(site.pages);
        // 言語順を固定（ja → en の順）
        const order = Object.keys(LANGUAGE_LABELS);
        translations.sort((a, b) => order.indexOf(a.lang) - order.indexOf(b.lang));
    } else if (page.listLang) {
        // 記事一覧ページ（/ と /en/）のピルトグル
        translations.push({ lang: 'ja', url: url_for('/'), label: LANGUAGE_LABELS.ja, active: page.listLang === 'ja' });
        translations.push({ lang: 'en', url: url_for('/en/'), label: LANGUAGE_LABELS.en, active: page.listLang === 'en' });
    }

    // 翻訳が存在しないページでも常にトグルを表示（/ と /en/ へのリンク）
    if (translations.length === 0) {
        const pageLang = page.lang || 'ja';
        translations.push({ lang: 'ja', url: url_for('/'), label: LANGUAGE_LABELS.ja, active: pageLang !== 'en' });
        translations.push({ lang: 'en', url: url_for('/en/'), label: LANGUAGE_LABELS.en, active: pageLang === 'en' });
    }

    return {
        logo,
        logoUrl: url_for(logo),
        siteUrl: url_for('/'),
        siteTitle: title,
        menu,
        links,
        categories,
        categoriesTitle: _p('common.category', Infinity),
        translations,
        showToc,
        tocTitle: _p('widget.catalogue', Infinity),
        showSearch: search && search.type,
        searchTitle: __('search.search')
    };
});
