---
layout: post
title: コマンドラインでURLの存在チェック
date: 2015-06-16
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
