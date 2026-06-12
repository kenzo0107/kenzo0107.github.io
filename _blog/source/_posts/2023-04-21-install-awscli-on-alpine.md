---
title: alpine イメージに awscli をインストールする
date: 2023-04-21
lang: ja
translation_id: install-awscli-on-alpine
cover: /img/cover/2023-04-21-install-awscli-on-alpine.svg
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

alpine イメージで awscli をインストールする際の備忘録です。

```
RUN apk add --no-cache \
        python3 \
        py3-pip \
    && pip3 install --upgrade pip \
    && pip3 install --no-cache-dir \
        awscli \
    && rm -rf /var/cache/apk/*
```
