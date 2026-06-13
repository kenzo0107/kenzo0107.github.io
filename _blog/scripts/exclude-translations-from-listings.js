/* global hexo */
'use strict';

// 翻訳記事（front-matter の lang: en）を、日本語サイトの
//   - トップ記事一覧 (index)
//   - Atom フィード (feed)
//   - カテゴリ / タグ一覧 (category / tag)
//   - 検索インデックス (insight / content.json)
// から除外する。個別ページ (/en/...) はコアの 'post' ジェネレータが
// site.posts から直接生成するため、この除外の影響を受けない。
//
// 各ジェネレータの上書きは before_generate フィルタ内で行う。
// プラグイン／テーマのジェネレータ登録より確実に後で再登録され、
// 同名登録は上書きされる（hexo の generator store は name キー）ため、
// 読み込み順に依存せず確実に優先される。

const indexGenerator = require('hexo-generator-index/lib/generator');
const feedGenerator = require('hexo-generator-feed/lib/generator');
const pagination = require('hexo-pagination');
const util = require('hexo-util');

function toArray(value) {
    return Array.isArray(value) ? value : [value];
}

function isTranslation(post) {
    return !!post && post.lang === 'en';
}

// locals.posts を非翻訳記事のみに差し替えた locals を返す
function withFilteredPosts(locals) {
    return Object.assign({}, locals, {
        posts: locals.posts.filter(post => !isTranslation(post))
    });
}

hexo.extend.filter.register('before_generate', function () {
    // --- トップ記事一覧 (日本語) ---
    hexo.extend.generator.register('index', function (locals) {
        const pages = indexGenerator.call(this, withFilteredPosts(locals));
        return pages.map(page => Object.assign({}, page, {
            data: Object.assign({}, page.data, { listLang: 'ja' })
        }));
    });

    // --- 英語記事一覧 (/en/) ---
    hexo.extend.generator.register('en-index', function (locals) {
        const config = this.config;
        const perPage = config.index_generator != null && config.index_generator.per_page != null
            ? config.index_generator.per_page
            : config.per_page;
        const orderBy = (config.index_generator && config.index_generator.order_by) || '-date';
        const paginationDir = config.pagination_dir || 'page';
        const enPosts = locals.posts.filter(post => post.lang === 'en').sort(orderBy);
        if (!enPosts.length) return [];
        return pagination('en', enPosts, {
            perPage,
            layout: ['index', 'archive'],
            format: paginationDir + '/%d/',
            data: { listLang: 'en' }
        });
    });

    // --- Atom / RSS フィード ---
    // feed プラグインはジェネレータを 'feed' ではなく type 名（atom / rss2）で登録し、
    // シグネチャは (locals, type, path)。同名・同シグネチャで上書きする。
    const feedConfig = hexo.config.feed || {};
    const feedTypes = toArray(feedConfig.type);
    const feedPaths = toArray(feedConfig.path);
    feedTypes.forEach((feedType, i) => {
        if (!feedType) return;
        const feedPath = feedPaths[i];
        hexo.extend.generator.register(feedType, function (locals) {
            return feedGenerator.call(this, withFilteredPosts(locals), feedType, feedPath);
        });
    });

    // --- カテゴリページ（カテゴリごとに翻訳記事を除外）---
    hexo.extend.generator.register('category', function (locals) {
        const config = this.config;
        const perPage = config.category_generator.per_page;
        const paginationDir = config.pagination_dir || 'page';
        const orderBy = config.category_generator.order_by || '-date';

        return locals.categories.reduce((result, category) => {
            const jaPosts = category.posts.filter(post => !isTranslation(post)).sort(orderBy);
            if (!jaPosts.length) return result;
            const hasEnPosts = category.posts.some(post => isTranslation(post));
            const data = {
                category: category.name,
                parents: [],
                listLang: 'ja',
                jaListUrl: category.path,
                enListUrl: hasEnPosts ? 'en/' + category.path : null
            };
            return result.concat(pagination(category.path, jaPosts, {
                perPage,
                layout: ['category', 'archive', 'index'],
                format: paginationDir + '/%d/',
                data
            }));
        }, []);
    });

    // --- 英語カテゴリページ (/en/categories/xxx/) ---
    hexo.extend.generator.register('en-category', function (locals) {
        const config = this.config;
        const perPage = config.category_generator.per_page;
        const paginationDir = config.pagination_dir || 'page';
        const orderBy = config.category_generator.order_by || '-date';

        return locals.categories.reduce((result, category) => {
            const enPosts = category.posts.filter(post => isTranslation(post)).sort(orderBy);
            if (!enPosts.length) return result;
            return result.concat(pagination('en/' + category.path, enPosts, {
                perPage,
                layout: ['category', 'archive', 'index'],
                format: paginationDir + '/%d/',
                data: {
                    category: category.name,
                    parents: [],
                    listLang: 'en',
                    jaListUrl: category.path,
                    enListUrl: 'en/' + category.path
                }
            }));
        }, []);
    });

    // --- タグページ（タグごとに翻訳記事を除外）---
    hexo.extend.generator.register('tag', function (locals) {
        const config = this.config;
        const perPage = config.tag_generator.per_page;
        const paginationDir = config.pagination_dir || 'page';
        const orderBy = config.tag_generator.order_by || '-date';

        return locals.tags.reduce((result, tag) => {
            const jaPosts = tag.posts.filter(post => !isTranslation(post)).sort(orderBy);
            if (!jaPosts.length) return result;
            const hasEnPosts = tag.posts.some(post => isTranslation(post));
            const data = {
                tag: tag.name,
                listLang: 'ja',
                jaListUrl: tag.path,
                enListUrl: hasEnPosts ? 'en/' + tag.path : null
            };
            return result.concat(pagination(tag.path, jaPosts, {
                perPage,
                layout: ['tag', 'archive', 'index'],
                format: paginationDir + '/%d/',
                data
            }));
        }, []);
    });

    // --- 英語タグページ (/en/tags/xxx/) ---
    hexo.extend.generator.register('en-tag', function (locals) {
        const config = this.config;
        const perPage = config.tag_generator.per_page;
        const paginationDir = config.pagination_dir || 'page';
        const orderBy = config.tag_generator.order_by || '-date';

        return locals.tags.reduce((result, tag) => {
            const enPosts = tag.posts.filter(post => isTranslation(post)).sort(orderBy);
            if (!enPosts.length) return result;
            return result.concat(pagination('en/' + tag.path, enPosts, {
                perPage,
                layout: ['tag', 'archive', 'index'],
                format: paginationDir + '/%d/',
                data: {
                    tag: tag.name,
                    listLang: 'en',
                    jaListUrl: tag.path,
                    enListUrl: 'en/' + tag.path
                }
            }));
        }, []);
    });

    // --- 検索インデックス content.json（翻訳記事を除外）---
    hexo.extend.generator.register('insight', function (locals) {
        const url_for = hexo.extend.helper.get('url_for').bind(this);
        const escape = str => util.escapeHTML(str).trim();
        const minify = str => util.stripHTML(str).trim()
            .replace(/\n/g, ' ').replace(/\s+/g, ' ')
            .replace(/&#x([\da-fA-F]+);/g, (m, hex) => String.fromCharCode(parseInt(hex, 16)))
            .replace(/&#([\d]+);/g, (m, dec) => String.fromCharCode(dec));
        const mapPost = post => ({ title: escape(post.title), text: minify(post.content), link: url_for(post.path) });
        const mapTag = tag => ({ name: escape(tag.name), slug: minify(tag.slug), link: url_for(tag.path) });

        const site = {
            posts: locals.posts.filter(post => !isTranslation(post)).map(mapPost),
            tags: locals.tags.map(mapTag),
            categories: locals.categories.map(mapTag)
        };
        const indexPages = ((this.theme.config || {}).search || {}).index_pages;
        site.pages = indexPages === false ? [] : locals.pages.map(mapPost);
        return { path: '/content.json', data: JSON.stringify(site) };
    });
});
