---
layout: post
title: CentOS7用 Revel(Golang)フレームワークの起動スクリプト 書いてみた。
date: 2016-02-03
category: Go
tags:
  - Go
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160203/20160203221206.png
---

## 起動スクリプト作成

まず成果物から

```
# vim /usr/lib/systemd/system/revel.service
```

```
[Unit]
Description=RevelBuildScript
After=nginx.service mysqld.service

[Service]
Type=simple
ExecStart=/bin/bash /var/golang/run.sh

[Install]
WantedBy=multi-user.target
```

※After ... 上記では nginx と mysqld 起動後に revel を起動させるという設定です。

※ExecStart ... `/bin/bash /var/golang/run.sh` については
以前の記事でローカルビルドによる
デプロイ方法を採用しているというお話をしましたが
その際に作成される `run.sh` のパスを指しています。

{% linkPreview https://kenzo0107.hatenablog.com/entry/2015/08/21/013757 _blank %}

#### 起動設定

```
# systemctl enable revel.service
```

#### 起動

```
# systemctl start revel.service
```

#### 停止

```
# systemctl start revel.service
```

以上です。

## 導入経緯

AWS での運用をしていると検証環境は
検証時のみに利用し余計なコストは掛けたくないものです。

なので、しょっ中、起動・停止を繰り返します。

Revel フレームワークは起動スクリプトが標準装備されていない為
インスタンス起動時に手動で起動する手間が発生していました。

その為、デザインの修正でもシステムさんお願いします〜というような依頼があり
相互に手間が発生していたのでその解決として作成しました。

現在は Slack 経由で hubot から Jenkins ジョブを実行させ
Revel の乗ってる AWS インスタンスの起動・停止できるようにしています。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160203/20160203220906.png" width="100%">
</div>

ip も ElasticIP は使用せず、No-IP を利用して Public IP が変更されても
同ドメインでアクセスできるようにしています。

こちらもインスタンス起動時にドメイン管理している No-ip へ Public IP を通知し
動的にドメインと IP を紐付けるようにしています。

{% linkPreview http://kenzo0107.hatenablog.com/entry/2016/02/04/101002 _blank %}

[http://www.noip.com/](http://www.noip.com/)

極力費用を抑えた、AWS における検証環境構築の参考にもしていただければと思います。

以上です。

※ 検証環境 はローカル開発環境と異なり、あくまで本番デプロイ前の検証用という認識です。
