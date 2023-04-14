---
title: 'fix: curl: (48) An unknown option was passed in to libcurl'
date: 2023-04-14
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

alpine イメージをベースで `RUN curl` が失敗し以下エラーが出力されました。

```
curl: (48) An unknown option was passed in to libcurl
```

<!-- more -->

curl と libcurl のバージョンの不一致が原因で
curl-dev をインストールすることで解決しました。

参考: https://stackoverflow.com/questions/11678085/curl-48-an-unknown-option-was-passed-in-to-libcurl/41651363#41651363

### Dockerfile

```
FROM alpine

# 以下追加した
RUN apk add --update --no-cache curl-dev
```

以上
参考になれば幸いです。
