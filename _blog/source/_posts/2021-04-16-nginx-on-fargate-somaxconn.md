---
title: Nginx on Fargate で Resource temporarily unavailable エラーを対応する
tags:
- AWS
date: 2021-04-16
thumbnail: https://i.imgur.com/UvdQW0r.png
---

Nginx を Fargate で起動しているが、検証中にすぐにリクエストが詰まってしまう事象に悩まされました。
その際に調査したことをまとめます。

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

## エラーログレベルを debug に設定

元々 info にしていたが、それらしいログが確認できなかった為、
nginx の設定ファイルでエラーログレベルを debug に設定しログを確認してみます。

```nginx.conf
error_log stderr debug;
```

すると以下ログが確認されました。

```
accept() not ready (11: Resource temporarily unavailable)
```

accept() が一時的なリソース不足で準備できてない、とのこと。

Nginx の通信の仕組み上、 `accept()` が担当している箇所は以下図がわかりやすいです。
![](https://i.imgur.com/PPJozW1.png)

## net.core.somaxconn を調べてみる

net.core.somaxconn は TCP ソケットが受け付けたリクエストを格納する、キューの最大長です。

受け入れ可能なリクエスト数が小さいのでは？という仮説を立てました。

Nginx コンテナに入って以下実行します。

```console
$ sysctl net.core.somaxconn
net.core.somaxconn = 128
```

非常に少ない！

ここの設定を変えたい！

## Dockerfile で変更できるか試してみる

```
RUN sysctl -w net.core.somaxconn=1024
```

エラーになった (TへT)

```
#21 0.370 sysctl: error setting key 'net.core.somaxconn': Read-only file system
```

## Fargate の設定でできないものか？

[【週刊 Ask An Expert #04】AWS Loft Tokyo で受けた質問まとめ #AWSLoft](https://aws.amazon.com/jp/blogs/startup/weekly-aae-04/)

> Q: Fargate で net.core.somaxconn を変更したい
> 現時点では Fargate では変更できないので、タスクを多く起動して頂くことで解決して下さい。

## 結論

現状、Nginx で発生する `Resource temporarily unavailable` の解決は、素直にタスク数を増やすことで対応するしかない！

AWS のコンテナロードマップには issue として上がっている。

いずれ Fargate でも対応される日は近い... はず！

[https://github.com/aws/containers-roadmap/issues/623](https://github.com/aws/containers-roadmap/issues/623)
