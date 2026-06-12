---
title: 'fix: curl: (48) An unknown option was passed in to libcurl'
date: 2023-04-14
category: Infrastructure
lang: en
translation_id: curl-not-match-libcurl-on-alpine
permalink: en/2023/04/14/curl-not-match-libcurl-on-alpine/
cover: /img/cover/2023-04-14-curl-not-match-libcurl-on-alpine.svg
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

When using an alpine image as the base, `RUN curl` failed and the following error was output.

```
curl: (48) An unknown option was passed in to libcurl
```

<!-- more -->

The cause was a version mismatch between curl and libcurl,
and it was resolved by installing curl-dev.

Reference: https://stackoverflow.com/questions/11678085/curl-48-an-unknown-option-was-passed-in-to-libcurl/41651363#41651363

### Dockerfile

```
FROM alpine

# Added the following
RUN apk add --update --no-cache curl-dev
```

That's all.
I hope this helps.
