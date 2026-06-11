/* global hexo */
'use strict';

// Hexo 7 で組み込みの gist タグが廃止されたため、ローカルタグプラグインとして再実装する。
// 使い方: {% gist user/gist_id [filename] %}
hexo.extend.tag.register('gist', (args) => {
  const [id, file] = args;
  const src = `//gist.github.com/${id}.js${file ? `?file=${file}` : ''}`;
  return `<script src="${src}"></script>`;
});
