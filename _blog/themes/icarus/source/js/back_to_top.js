(function() {
    const button = document.getElementById('back-to-top');
    const footer = document.querySelector('footer.footer');
    const mainColumn = document.querySelector('.column-main');
    const leftSidebar = document.querySelector('.column-left');
    const rightSidebar = document.querySelector('.column-right');

    if (!button || !mainColumn) return;

    let lastScrollTop = 0;
    const rightMargin = 20;
    const bottomMargin = 20;
    let lastState = null;

    const base = { classname: 'card has-text-centered', left: '', width: 64, bottom: bottomMargin };
    const state = {
        base,
        'desktop-hidden': Object.assign({}, base, { classname: base.classname + ' rise-up' }),
    };
    state['desktop-visible'] = Object.assign({}, state['desktop-hidden'], {
        classname: state['desktop-hidden'].classname + ' fade-in'
    });
    state['desktop-dock'] = Object.assign({}, state['desktop-visible'], {
        classname: state['desktop-visible'].classname + ' fade-in is-rounded',
        width: 40
    });
    state['mobile-hidden'] = Object.assign({}, base, {
        classname: base.classname + ' fade-in',
        right: rightMargin
    });
    state['mobile-visible'] = Object.assign({}, state['mobile-hidden'], {
        classname: state['mobile-hidden'].classname + ' rise-up'
    });

    function isStateEquals(prev, next) {
        const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
        for (const k of keys) {
            if (prev[k] !== next[k]) return false;
        }
        return true;
    }

    function applyState(nextState) {
        if (lastState !== null && isStateEquals(lastState, nextState)) return;
        button.className = nextState.classname;
        for (const prop in nextState) {
            if (prop === 'classname') continue;
            const val = nextState[prop];
            button.style[prop] = val === '' ? '' : val + 'px';
        }
        lastState = nextState;
    }

    function outerSize(el, dim, includeMargin) {
        const size = dim === 'width' ? el.offsetWidth : el.offsetHeight;
        if (!includeMargin) return size;
        const s = getComputedStyle(el);
        return dim === 'width'
            ? size + parseInt(s.marginLeft) + parseInt(s.marginRight)
            : size + parseInt(s.marginTop) + parseInt(s.marginBottom);
    }

    function getRightSidebarBottom() {
        if (!rightSidebar) return 0;
        return Math.max(0, ...Array.from(rightSidebar.querySelectorAll('.widget')).map(w => {
            const rect = w.getBoundingClientRect();
            return rect.top + window.scrollY + rect.height;
        }));
    }

    function isDesktop() { return window.innerWidth >= 1078; }
    function isTablet() { return window.innerWidth >= 768 && !isDesktop(); }

    function update() {
        if (isDesktop() || (isTablet() && !leftSidebar && rightSidebar)) {
            const colRect = mainColumn.getBoundingClientRect();
            const buttonW = outerSize(button, 'width', true);
            const buttonH = outerSize(button, 'height', true);
            const maxLeft = window.innerWidth - buttonW - rightMargin;
            const footerTop = footer ? footer.getBoundingClientRect().top + window.scrollY : Infinity;
            const maxBottom = footerTop + (buttonH / 2) + bottomMargin;
            const scrollBottom = window.scrollY + window.innerHeight;

            let nextState;
            if (window.scrollY === 0 || scrollBottom < getRightSidebarBottom() + buttonH) {
                nextState = state['desktop-hidden'];
            } else if (scrollBottom < maxBottom) {
                nextState = state['desktop-visible'];
            } else {
                nextState = Object.assign({}, state['desktop-dock'], { bottom: scrollBottom - maxBottom + bottomMargin });
            }
            nextState = Object.assign({}, nextState, { left: Math.min(colRect.right, maxLeft) });
            applyState(nextState);
        } else {
            const isScrollUp = window.scrollY < lastScrollTop && window.scrollY > 0;
            applyState(isScrollUp ? state['mobile-visible'] : state['mobile-hidden']);
            lastScrollTop = window.scrollY;
        }
    }

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, { passive: true });

    button.addEventListener('click', () => {
        window.scroll({ top: 0, behavior: 'smooth' });
    });
}());
