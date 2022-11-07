---
layout: post
title: gosec で警告される os.Open() 対応
date: 2019-12-09
category: Go
tags:
  - Go
---

gosec で警告される os.Open() に対応した話です。

<!-- more -->

gosec で以下のようなコードがあると

```go
os.Open(fname)
```

以下のように警告されます。

```go
G304 (CWE-22): Potential file inclusion via variable (Confidence: HIGH, Severity: MEDIUM)
```

変数でファイルパスを指定するのは、意図しないファイルパスを指定される危険性があります。

## 対応

filepath.Clean() を使用し、よろしくないパスを綺麗に整えるようにします。

```go
os.Open(filepath.Clean(fname))
```

以上
ご参考になれば幸いです。
