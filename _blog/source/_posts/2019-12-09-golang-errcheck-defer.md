---
layout: post
title: Golang errcheck による defer 警告対応
date: 2019-12-09
tags:
- Go
---

## 概要

このようなコードを書いていると `errcheck` を実行した場合、 `defer f.Close()` と指摘されてしまいます。

```go
func hoge() error {
    ...
    f, err := os.Open(fpath)
    if err != nil {
        return err
    }

    defer f.Close()
    ...
}
```

`f.Close()` は返り値が `error` であり、その `error` の返り値をチェックしていない、という警告です。

<!-- more -->

## 対応

その為、以下のように修正することで回避

```go
func hoge() error {
    ...
    f, err := os.Open(fpath)
    if err != nil {
        return err
    }

    defer func() {
        err = f.Close()
        if err != nil {
            log.Fatalln(err)
        }
    }()
    ...
}
```

但し、上記の場合だと `error` 発生した時に `panic` が発生します。

`log.Println` すると `error` がログ出力こそされますが、その `error` によって後続の処理をハンドリングすることができません。

その為、さらに以下の様に修正してみました。

```go
func hoge() (err error) {
    ...
	f, err := os.Open(filepath.Clean(fpath))
    if err != nil {
        return err
    }

    defer func() {
        err = f.Close()
    }()
    ...
}
```

以下対応手順で `f.Close()` の `error` を `hoge()` の戻り値として返すことができます。

* `hoge()` 関数の戻り値で `err error` と変数名を指定する
* `defer` している `func(){}` 内で `f.Close()` の戻り値 `error` を `err` に格納する

[Go Playground](https://play.golang.org/p/cV03BwnnPd1)

## 参考

随分前に既に掲題について話をしていた

[ignore defer calls #55](https://github.com/kisielk/errcheck/issues/55)
