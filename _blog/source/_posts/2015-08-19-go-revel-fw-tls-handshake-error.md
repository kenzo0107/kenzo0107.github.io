---
layout: post
title: "Golang Revelフレームワークエラー 「server.go:1775: http: TLS handshake error from 127.0.0.1:36799: tls: first record does not look like a TLS handshake」対応"
date: 2015-08-19
tags:
- Go
---

## 結論

[prod]モード以外で `http.ssl = true` とし起動すると発生するエラーでした。
その為、[prod]以外では `http.ssl = false` として起動することとしました。

## 概要

テスト環境で `app.conf` にて`[test]モード`を追加し
そこでオレオレSSL証明書作成してhttpsリンクの動作確認をしようとしてました。

ですが、起動こそするものの一向にアクセスできず汗

devモードではアクセス出来るのでその差分を見たところ、上記の結論に至りました。


## エラー内容

revel 起動しurlにアクセスすると以下のようなTLSハンドシェイクができずアクセスできない状況になる。

```
$ revel run myapp test

...
...

INFO  2015/08/19 14:48:38 harness.go:165: Listening on :9000
2015/08/19 14:48:40 server.go:1775: http: TLS handshake error from 127.0.0.1:36799: tls: first record does not look like a TLS handshake
```
