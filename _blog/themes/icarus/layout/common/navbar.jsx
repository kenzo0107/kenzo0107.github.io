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
    ja: { text: 'JA' },
    en: { text: 'EN' }
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
            translations
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
                <div class="navbar-brand">
                    {/* カテゴリーハンバーガー（ロゴより左、PC・SP共通） */}
                    {hasCategories ? <a role="button" class="navbar-item navbar-cat-burger" id="cat-burger" aria-label="カテゴリー" aria-expanded="false">
                        <span aria-hidden="true"></span>
                        <span aria-hidden="true"></span>
                        <span aria-hidden="true"></span>
                    </a> : null}
                    {/* ロゴ */}
                    <a class="navbar-item navbar-logo" href={siteUrl}>
                        {navbarLogo}
                        <span class="navbar-site-label">TECH Blog</span>
                    </a>
                    {/* SP用右側アイコン群 */}
                    <div class="navbar-brand-right">
                        {/* 言語ピルトグル（スマホ常時表示） */}
                        <div class="navbar-item lang-toggle is-hidden-desktop">
                            <div class="lang-toggle-pill">
                                {translations.map(t => <a class={classname({ 'lang-toggle-option': true, 'is-active': t.active })} href={t.url}>{t.text}</a>)}
                            </div>
                        </div>
                        {/* ダーク/ライト切り替え（スマホ常時表示） */}
                        <a class="navbar-item theme-toggle is-hidden-desktop" title="Toggle dark mode" href="javascript:;" aria-label="Toggle dark mode">
                            <i class="fas fa-moon theme-toggle-dark"></i>
                            <i class="fas fa-sun theme-toggle-light"></i>
                        </a>
                    </div>
                </div>

                {/* カテゴリーパネル（絶対位置・左寄せ・固定幅） */}
                {hasCategories ? <div class="navbar-cat-panel" id="cat-panel">
                    {categories.map(category => (
                        <a class="navbar-cat-panel-item" href={category.url}>
                            <span>{category.name}</span>
                            <span class="navbar-category-count">{category.count}</span>
                        </a>
                    ))}
                </div> : null}

                {/* PC用ナビメニュー */}
                <div id="navbar-menu" class="navbar-menu">
                    <div class="navbar-start">
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
                        {/* 言語ピルトグル（デスクトップのみ） */}
                        {Array.isArray(translations) && translations.length > 1 ? <div class="navbar-item lang-toggle is-hidden-touch">
                            <div class="lang-toggle-pill">
                                {translations.map(t => <a class={classname({ 'lang-toggle-option': true, 'is-active': t.active })} href={t.url}>{t.text}</a>)}
                            </div>
                        </div> : null}
                        {/* ダーク/ライト切り替え（デスクトップのみ） */}
                        <a class="navbar-item theme-toggle is-hidden-touch" title="Toggle dark mode" href="javascript:;" aria-label="Toggle dark mode">
                            <i class="fas fa-moon theme-toggle-dark"></i>
                            <i class="fas fa-sun theme-toggle-light"></i>
                        </a>
                    </div>
                </div>
            </div>
        </nav>;
    }
}

module.exports = cacheComponent(Navbar, 'common.navbar', props => {
    const { site, config, helper, page } = props;
    const { url_for, _p } = helper;
    const { logo, title, navbar } = config;

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

    // site.categories から投稿数の多い順にカテゴリ一覧を生成（翻訳記事除外）
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

    // 翻訳リンク
    const translations = [];
    if (page.translation_id && site) {
        const collect = collection => {
            if (collection && typeof collection.forEach === 'function') {
                collection.forEach(item => {
                    if (item.translation_id === page.translation_id && item.path) {
                        const lang = item.lang || item.language || 'ja';
                        const labelDef = LANGUAGE_LABELS[lang] || { text: lang.toUpperCase() };
                        translations.push({
                            lang,
                            url: url_for(item.path),
                            text: labelDef.text,
                            active: url_for(item.path) === pageUrl
                        });
                    }
                });
            }
        };
        collect(site.posts);
        collect(site.pages);
        const order = Object.keys(LANGUAGE_LABELS);
        translations.sort((a, b) => order.indexOf(a.lang) - order.indexOf(b.lang));
    } else if (page.listLang) {
        translations.push({ lang: 'ja', url: url_for('/'), text: LANGUAGE_LABELS.ja.text, active: page.listLang === 'ja' });
        translations.push({ lang: 'en', url: url_for('/en/'), text: LANGUAGE_LABELS.en.text, active: page.listLang === 'en' });
    }

    if (translations.length === 0) {
        const pageLang = page.lang || 'ja';
        translations.push({ lang: 'ja', url: url_for('/'), text: LANGUAGE_LABELS.ja.text, active: pageLang !== 'en' });
        translations.push({ lang: 'en', url: url_for('/en/'), text: LANGUAGE_LABELS.en.text, active: pageLang === 'en' });
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
        translations
    };
});
