---
layout: post
title: Datadog NTP 監視でアラート鳴りまくり対応
date: 2018-07-30
tags:
- Datadog
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180730/20180730133759.jpg
---

## 概要

サーバ時刻の監視を Datadog で実施する際、標準時刻の参照先が異なることで
不要なアラートが発生する事象がありました。

Datadog はデフォルトで  `pool.ntp.org` を参照しています。

AWS EC2 に設定した Chrony ではデフォルトで `ntp.nict.jp` を参照する様にしていた為、ある日突然アラートがなりまくる事象がありました。

この対策として、
 Datadog と Chrony の参照先を統一して管理する様に設定しました。

<!-- more -->

## タイムサーバホストを統一する

今回は、AWS を利用しており、 AWS にも NTP サーバがある為、そちらを参照することとしました。

[AWS Time Sync Service](https://aws.amazon.com/jp/blogs/news/keeping-time-with-amazon-time-sync-service/) のホストは `169.254.169.123` です。

`169.254.169.123` のリンクローカル IP アドレスを介してアクセス可能な為、プライベートサブネットからでもアクセス可能です。
ip アドレスという辺りがある日変更されたとかあると辛いので怖いですが、今の所、そういうことはないです。

* /etc/datadog-agent/conf.d/ntp.d/conf.yaml
```yml
init_config:

instances:
  - offset_threshold: 60
    host: 169.254.169.123 # 追加
```

* /etc/chrony/chrony.conf
```yml
# server ntp.nict.jp minpoll 4 maxpoll 4  # コメントアウト
server 169.254.169.123 prefer iburst # 追加
```

上記設定後、リスタート

```sh
$ sudo systemctl restart chrony
$ sudo systemctl restart datadog-agent
```

上記によりアラート解消されました。

## 参照

* [Amazon Time Sync Service で時間を維持する](https://aws.amazon.com/jp/blogs/news/keeping-time-with-amazon-time-sync-service/)
* [どうやったらpool.ntp.orgを利用出来るのでしょうか?](https://www.pool.ntp.org/ja/use.html)
