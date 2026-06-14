'use strict';

// Minimal progress-bar replacement for pace.js (~350B vs 13KB).
// Creates .pace / .pace-progress elements matching the CSS already inlined by
// progressbar.jsx, then slides the bar from 0→100% via translate3d.
const PACE_JS =
    '(function(){' +
    'var p=document.createElement("div");' +
    'p.className="pace";' +
    'var b=document.createElement("div");' +
    'b.className="pace-progress";' +
    'b.style.transition="transform .15s linear";' +
    'p.appendChild(b);' +
    'document.documentElement.appendChild(p);' +
    'var pct=0;' +
    'function go(n){b.style.transform="translate3d("+n+"%,0,0)";}' +
    'var t=setInterval(function(){' +
        'pct+=Math.max(1,(90-pct)*.15);' +
        'if(pct>90)pct=90;' +
        'go(pct);' +
    '},100);' +
    'window.addEventListener("load",function(){' +
        'clearInterval(t);' +
        'go(100);' +
        'setTimeout(function(){p.className="pace pace-inactive";},200);' +
    '});' +
    '})();';

hexo.extend.generator.register('pace-js', function() {
    return { path: 'js/pace.min.js', data: PACE_JS };
});
