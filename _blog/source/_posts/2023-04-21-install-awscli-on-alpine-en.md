---
title: Installing awscli on an Alpine image
date: 2023-04-21
category: AWS
lang: en
translation_id: install-awscli-on-alpine
permalink: en/2023/04/21/install-awscli-on-alpine/
cover: /img/cover/2023-04-21-install-awscli-on-alpine.svg
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

A quick memo on how to install awscli on an Alpine image.

```
RUN apk add --no-cache \
        python3 \
        py3-pip \
    && pip3 install --upgrade pip \
    && pip3 install --no-cache-dir \
        awscli \
    && rm -rf /var/cache/apk/*
```
