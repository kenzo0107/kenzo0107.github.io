---
layout: post
title: Addressing defer Warnings from Golang errcheck
date: 2019-12-09
lang: en
translation_id: golang-errcheck-defer
permalink: en/2019/12/09/golang-errcheck-defer/
cover: /img/cover/2019-12-09-golang-errcheck-defer.svg
category: Go
tags:
  - Go
---

## Overview

When you write code like the following and run `errcheck`, it flags `defer f.Close()`.

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

The warning says that `f.Close()` returns an `error`, and that `error` return value is not being checked.

<!-- more -->

## Solution

To work around this, you can fix it as follows.

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

However, in the case above, a `panic` occurs when an `error` happens.

If you use `log.Println` instead, the `error` does get logged, but you cannot handle subsequent processing based on that `error`.

So I tried fixing it further as shown below.

```go
func hoge() (err error) {
    ...
	f, err := os.Open(filepath.Clean(fpath))
    if err != nil {
        return err
    }

    defer func() {
        if er := f.Close(); er != nil {
            err = er
        }
    }()
    ...
}
```

With the following steps, you can return the `error` from `f.Close()` as the return value of `hoge()`.

- Specify a named return value `err error` in the return values of the `hoge()` function
- Store the `error` returned by `f.Close()` into `err` inside the deferred `func(){}`

[Go Playground](https://play.golang.org/p/cV03BwnnPd1)

## References

This topic had already been discussed quite a while ago.

[ignore defer calls #55](https://github.com/kisielk/errcheck/issues/55)
