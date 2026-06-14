/* eslint-disable node/no-unsupported-features/node-builtins */
(function(config) {
    function timeAgo(dateStr) {
        const diff = (Date.now() - new Date(dateStr)) / 1000;
        const locale = document.documentElement.lang || 'en';
        const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
        if (diff < 60) return rtf.format(-Math.round(diff), 'second');
        if (diff < 3600) return rtf.format(-Math.round(diff / 60), 'minute');
        if (diff < 86400) return rtf.format(-Math.round(diff / 3600), 'hour');
        if (diff < 2592000) return rtf.format(-Math.round(diff / 86400), 'day');
        if (diff < 31536000) return rtf.format(-Math.round(diff / 2592000), 'month');
        return rtf.format(-Math.round(diff / 31536000), 'year');
    }

    document.querySelectorAll('.article img:not(.not-gallery-item)').forEach(img => {
        if (!img.getAttribute('loading')) img.setAttribute('loading', 'lazy');
        if (!img.getAttribute('decoding')) img.setAttribute('decoding', 'async');
        if (!img.closest('a')) {
            const a = document.createElement('a');
            a.className = 'gallery-item';
            a.href = img.src;
            img.parentNode.insertBefore(a, img);
            a.appendChild(img);
            if (img.alt) {
                const caption = document.createElement('p');
                caption.className = 'has-text-centered is-size-6 caption';
                caption.textContent = img.alt;
                a.insertAdjacentElement('afterend', caption);
            }
        }
    });

    if (typeof lightGallery === 'function') {
        document.querySelectorAll('.article').forEach(el => lightGallery(el, { selector: '.gallery-item' }));
    }

    document.querySelectorAll('.article-meta time').forEach(el => {
        el.textContent = timeAgo(el.getAttribute('datetime'));
    });

    document.querySelectorAll('.article > .content > table').forEach(table => {
        if (table.scrollWidth > table.parentElement.clientWidth) {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-overflow';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
    });

    function adjustNavbar() {
        const start = document.querySelector('.navbar-main .navbar-start');
        const end = document.querySelector('.navbar-main .navbar-end');
        const menu = document.querySelector('.navbar-main .navbar-menu');
        if (!start || !end || !menu) return;
        menu.classList.toggle('justify-content-start', document.documentElement.offsetWidth < start.offsetWidth + end.offsetWidth);
    }
    adjustNavbar();
    window.addEventListener('resize', adjustNavbar);

    function syncNavbarHeight() {
        const navbar = document.querySelector('.navbar-main');
        if (navbar) {
            document.documentElement.style.setProperty('--navbar-h', navbar.offsetHeight + 'px');
        }
    }
    syncNavbarHeight();
    window.addEventListener('resize', syncNavbarHeight);

    function toggleFold(codeBlock, isFolded) {
        const toggle = codeBlock.querySelector('.fold i');
        codeBlock.classList.toggle('folded', isFolded);
        if (toggle) {
            toggle.classList.toggle('fa-angle-right', isFolded);
            toggle.classList.toggle('fa-angle-down', !isFolded);
        }
    }

    function createFoldButton(fold) {
        return '<span class="fold">' + (fold === 'unfolded' ? '<i class="fas fa-angle-down"></i>' : '<i class="fas fa-angle-right"></i>') + '</span>';
    }

    document.querySelectorAll('figure.highlight table').forEach(table => {
        const wrapper = document.createElement('div');
        wrapper.className = 'highlight-body';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
    });

    if (typeof config !== 'undefined' && config.article && config.article.highlight) {
        const clipboard = config.article.highlight.clipboard;
        const fold = config.article.highlight.fold.trim();

        document.querySelectorAll('figure.highlight').forEach(figure => figure.classList.add('hljs'));
        document.querySelectorAll('figure.highlight .code .line span').forEach(span => {
            Array.from(span.classList).forEach(cls => {
                span.classList.add('hljs-' + cls);
                span.classList.remove(cls);
            });
        });

        document.querySelectorAll('figure.highlight').forEach(figure => {
            const figcaption = figure.querySelector('figcaption');
            if (figcaption) {
                figcaption.classList.add('level', 'is-mobile');
                figcaption.insertAdjacentHTML('beforeend', '<div class="level-left"></div><div class="level-right"></div>');
                const levelLeft = figcaption.querySelector('.level-left');
                const levelRight = figcaption.querySelector('.level-right');
                const span = figcaption.querySelector('span');
                const a = figcaption.querySelector('a');
                if (span && levelLeft) levelLeft.appendChild(span);
                if (a && levelRight) levelRight.appendChild(a);
            } else if (clipboard || fold) {
                figure.insertAdjacentHTML('afterbegin', '<figcaption class="level is-mobile"><div class="level-left"></div><div class="level-right"></div></figcaption>');
            }
        });

        if (clipboard && navigator.clipboard) {
            document.querySelectorAll('figure.highlight').forEach(figure => {
                const levelRight = figure.querySelector('figcaption .level-right');
                if (!levelRight) return;
                const btn = document.createElement('a');
                btn.href = 'javascript:;';
                btn.className = 'copy';
                btn.title = 'Copy';
                const icon = document.createElement('i');
                icon.className = 'fas fa-copy';
                btn.appendChild(icon);
                btn.addEventListener('click', function() {
                    const code = figure.querySelector('.code');
                    if (code) navigator.clipboard.writeText(code.innerText).catch(function() {});
                });
                levelRight.appendChild(btn);
            });
        }

        if (fold) {
            document.querySelectorAll('figure.highlight').forEach(figure => {
                figure.classList.add('foldable');
                const figcaption = figure.querySelector('figcaption');
                const span = figcaption && figcaption.querySelector('span');
                if (span && span.innerText.indexOf('>folded') > -1) {
                    span.innerText = span.innerText.replace('>folded', '');
                    const levelLeft = figcaption.querySelector('.level-left');
                    if (levelLeft) levelLeft.insertAdjacentHTML('afterbegin', createFoldButton('folded'));
                    toggleFold(figure, true);
                    return;
                }
                const levelLeft = figure.querySelector('figcaption .level-left');
                if (levelLeft) levelLeft.insertAdjacentHTML('afterbegin', createFoldButton(fold));
                toggleFold(figure, fold === 'folded');
            });

            document.querySelectorAll('figure.highlight figcaption .level-left').forEach(el => {
                el.addEventListener('click', function() {
                    const figure = this.closest('figure.highlight');
                    if (figure) toggleFold(figure, !figure.classList.contains('folded'));
                });
            });
        }
    }

    const toc = document.getElementById('toc');
    if (toc) {
        const mask = document.createElement('div');
        mask.id = 'toc-mask';
        document.body.appendChild(mask);
        function toggleToc() {
            toc.classList.toggle('is-active');
            mask.classList.toggle('is-active');
            document.querySelectorAll('.catalogue').forEach(el => el.classList.toggle('is-toc-open'));
        }
        toc.addEventListener('click', toggleToc);
        mask.addEventListener('click', toggleToc);
        document.querySelectorAll('.catalogue').forEach(el => el.addEventListener('click', toggleToc));
    }

    const catBurger = document.getElementById('cat-burger');
    const catPanel = document.getElementById('cat-panel');
    if (catBurger && catPanel) {
        catBurger.addEventListener('click', function(e) {
            e.stopPropagation();
            catBurger.classList.toggle('is-active');
            catPanel.classList.toggle('is-active');
            catBurger.setAttribute('aria-expanded', catBurger.classList.contains('is-active'));
            document.querySelectorAll('.navbar-main').forEach(el =>
                el.classList.toggle('cat-panel-open', catPanel.classList.contains('is-active')));
        });
        document.addEventListener('click', function(e) {
            if (!e.target.closest('#cat-burger, #cat-panel')) {
                catBurger.classList.remove('is-active');
                catPanel.classList.remove('is-active');
                catBurger.setAttribute('aria-expanded', 'false');
                document.querySelectorAll('.navbar-main').forEach(el => el.classList.remove('cat-panel-open'));
            }
        });
    }

    document.querySelectorAll('.theme-toggle').forEach(el => el.addEventListener('click', function() {
        const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
    }));

    var savedLang;
    try { savedLang = localStorage.getItem('preferred-lang'); } catch (e) { /* ignore */ }

    function updateCategoryLinks(lang) {
        document.querySelectorAll('#cat-panel .navbar-cat-panel-item, .category-bar-item').forEach(el => {
            if (!el.getAttribute('data-ja-url')) {
                el.setAttribute('data-ja-url', el.getAttribute('href'));
            }
            const jaUrl = el.getAttribute('data-ja-url');
            const enUrl = el.getAttribute('data-en-url');
            el.setAttribute('href', lang === 'en' && enUrl ? enUrl : jaUrl);
        });
    }

    document.addEventListener('click', function(e) {
        const option = e.target.closest('.lang-toggle-option');
        if (!option) return;
        const lang = option.getAttribute('data-lang') || option.textContent.trim().toLowerCase();
        try { localStorage.setItem('preferred-lang', lang); } catch (e) { /* ignore */ }
        updateCategoryLinks(lang);
    });

    if (savedLang) {
        document.querySelectorAll('.lang-toggle-pill[data-lang-inferred] .lang-toggle-option').forEach(option => {
            const lang = option.getAttribute('data-lang') || option.textContent.trim().toLowerCase();
            option.classList.toggle('is-active', lang === savedLang);
        });
        updateCategoryLinks(savedLang);
    }
}(window.IcarusThemeSettings));
