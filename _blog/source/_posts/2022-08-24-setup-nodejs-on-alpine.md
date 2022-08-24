---
title: マルチステージビルドで alpine イメージに nodejs をセットアップする
date: 2022-08-24
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

php の alpine ベースイメージに nodejs をセットアップする場合、
`apk add nodejs` でインストールも可能ですが、
マルチステージビルドで node の alpine イメージから node を動作させるのに必要なファイルをコピーすることで実現可能なので設定がシンプルです。

```
FROM node:16.15.1-alpine AS node

FROM php:8.0.19-fpm-alpine AS main

# node イメージから nodejs セットアップに必要なファイルをコピー
COPY --from=node /usr/lib /usr/lib
COPY --from=node /usr/local/share /usr/local/share
COPY --from=node /usr/local/lib /usr/local/lib
COPY --from=node /usr/local/include /usr/local/include
COPY --from=node /usr/local/bin /usr/local/bin
```

以上
参考になれば幸いです。
