---
title: Backlog でコメント追加時に 「お知らせしたいユーザ」に Slack DM する
category: Go
tags:
- Go
date: 2020-02-25
comments: true
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20200227/20200227215819.png
---

Backlog でコメント追加時に 「お知らせしたいユーザ」に Slack DM する AWS Serverless Application Model with Golang プロジェクト作りました♪

<!-- more -->

使い方は、 Git プロジェクトを見ていただければ！

[kenzo0107/backlog-to-slack-dm](https://github.com/kenzo0107/backlog-to-slack-dm)

もしよくわからんぞ！という時は連絡ください♪


### 構築するに辺り、検討した点

#### 世の中には backlog API 関連の SDK などあるか？

[griffin-stewie/go-backlog](https://github.com/griffin-stewie/go-backlog) が諸々揃っていて良さそうだったので使ってみました。

利用したい箇所としては、以下です。
* コメント追加時のイベント情報を受ける `type Activity struct`
* ↑で受け取れる通知したいユーザの ID から Email アドレスを取得する API 実行

但し、このライブラリでは、[Activity には通知したい情報を含む Notifications がコメントアウトとなっていた](https://github.com/griffin-stewie/go-backlog/blob/master/models.go#L242)ので、直ちに利用できず、

急を要していたこともあり、 fork して [kenzo0107/go-backlog](https://github.com/kenzo0107/go-backlog) で対応しました。

単純にコメントアウトを外して使える様にしただけでは、 json.Unmarshal 実行時にエラーとなっており、他のパラメータも幾分か対応する必要がありました。


#### Backlog からのアクセス制御はどうする？

Backlog からのアクセス制御はBasic 認証について言及があったので Basic 認証にしました。

> IP アドレスの変更に影響されない方法であれば、 Webhook の URL に BASIC 認証をつけていただくことで、IP アドレスに依存しない認証できます。

[Webhook 送信サーバーの IP アドレスを教えてください](https://support-ja.backlog.com/hc/ja/articles/360035645534-Webhook-%E3%82%B5%E3%83%BC%E3%83%90%E3%81%AE%E6%83%85%E5%A0%B1)

IP レンジは予告なく変更される可能性があり、作成者以外ではなかなか気付きにくいかもしれません。
その為、 Backlog Webhook に設定する URL は、 `https://<user>:<password>@......` と Basic 認証の情報を埋め込む様にしました。

これを API Gateway + Lambda Authorizer (Request Type) で認証させる様にしました。


#### Backlog API 実行時に許可する ip はどうするか？

Backlog API を実行する Lambda を Nat Gateway をルーティングした Private Subnet に置くことで、出口 IP を固定する様にし、その IP を Backlog 側で許可 IP として設定しました。


### 注意点

#### Backlog Webhook 各プロジェクト毎に設定する必要があり

全プロジェクト一括して設定ということができませんでした。 2020-02-27 現在

各プロジェクト管理者に秘密情報として通知する様に対応をしました。



## まとめ

まだテストを書き切れてないところはありますが、問題なく動作していることを確認しています。

Backlog を取り入れている方へ、何かしら参考になれば幸いです。

以上です。
