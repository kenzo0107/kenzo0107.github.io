---
title: Setting Up Node.js on an Alpine Image with a Multi-Stage Build
date: 2022-08-24
lang: en
translation_id: setup-nodejs-on-alpine
permalink: en/2022/08/24/setup-nodejs-on-alpine/
cover: /img/cover/2022-08-24-setup-nodejs-on-alpine.svg
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

When setting up Node.js on a PHP Alpine base image,
you can install it with `apk add nodejs`,
but you can also achieve it by copying the files needed to run Node from the Node Alpine image using a multi-stage build, which keeps the configuration simple.

<!-- more -->

```
FROM node:16.15.1-alpine AS node

FROM php:8.0.19-fpm-alpine AS main

# Copy the files required to set up Node.js from the node image
COPY --from=node /usr/lib /usr/lib
COPY --from=node /usr/local/share /usr/local/share
COPY --from=node /usr/local/lib /usr/local/lib
COPY --from=node /usr/local/include /usr/local/include
COPY --from=node /usr/local/bin /usr/local/bin
```

That's all.
I hope this is helpful.
