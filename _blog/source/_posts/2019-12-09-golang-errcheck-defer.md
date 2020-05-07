---
layout: post
title: Golang errcheck による defer 警告対応
date: 2019-12-09
tags:
- Go
---

## 概要

このようなコードを書いていると errcheck を実行した場合、 `defer f.Close()` と指摘されてしまいます。

```go
    f, err := os.Open(fpath)
    if err != nil {
        log.Println(err)
        return hoge, err
    }

    defer f.Close()
```

f.Close() は返り値が error であり、その error の返り値をハンドリングしていない、という警告です。

<!-- more -->

## 対応

その為、以下のように修正することで回避

```go
    f, err := os.Open(fpath)
    if err != nil {
        log.Println(err)
        return hoge, err
    }

    defer func() {
        err = f.Close()
        if err != nil {
            log.Fatalln(err)
        }
    }()
```

## 参考

随分前に既に掲題について話をしていた

[ignore defer calls #55](https://github.com/kisielk/errcheck/issues/55)
