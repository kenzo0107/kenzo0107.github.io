---
layout: post
title: Checking Whether a URL Exists from the Command Line
date: 2015-06-16
lang: en
translation_id: check-whether-the-url-exists
permalink: en/2015/06/16/check-whether-the-url-exists/
cover: /img/cover/2015-06-16-check-whether-the-url-exists.svg
---

Run the following command from a terminal on your local Mac:

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
