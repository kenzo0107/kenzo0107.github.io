---
layout: post
title: コマンドラインでURLの存在チェック
date: 2015-06-16
lang: ja
translation_id: check-whether-the-url-exists
cover: /img/cover/2015-06-16-check-whether-the-url-exists.svg
---

以下コマンドをMacローカルでterminalから実行

```
curl -v <URL>  2>&1 1>/dev/null | awk '{if($2~"HTTP") print}'
```

## OK Pattern.

```
< HTTP/1.1 200 OK
```

## NG Pattern

```
< HTTP/1.1 404 Not Found
```
