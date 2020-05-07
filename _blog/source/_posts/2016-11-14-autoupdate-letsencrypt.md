---
layout: post
title: Let's encrypt SSL 証明書自動更新
date: 2016-11-14
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161114/20161114141731.png
tags:
- SSL
- Let's encrypt
---

## 概要
Let's encrypt SSL は開発環境で本番環境と同等に
https 通信プロトコルを利用したい為に利用しています。

バーチャルホストで複数ドメインを利用している場合等でも
マルチドメイン SSL 証明書が取得でき便利です。

オレオレSSL証明書ではブラウザによっては
「このページは保護されていません」
と表示されるケースがあり
非エンジニアの方によっては不信感が募ることもあります。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161114/20161114141627.png" width="100%">
</div>

## β版

β版時代の Let's Encrypt SSL証明書管理スクリプトです。
今回作成したSSL自動更新スクリプトはこちらではありません。

{% linkPreview https://github.com/digint/letsencrypt.sh _blank %}

### SSL自動更新スクリプト

今回作成した Let's Encrypt 自動更新(Apache)スクリプトです。
更新判定しSlack通知します。

有効期限が 30 日を切った場合に SSL証明書を更新し httpd を再起動します。

{% gist kenzo0107/94f073a4f94769b5bed18ed9c655bf02 %}

### cron設定

- 毎月第一土曜日 AM6:00 設定

開発環境なら土曜日に実行気づいて最低でも日曜日には治せる為。
現運用ではこれは功を奏してます。

```
00 6 1-7 * * 6 root /root/letsencrypt.sh/refresh_cert.sh
```

### Slack通知

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161114/20161114141352.png" width="100%">
</div>


## 強制更新したい場合

2016年5月07日より `certbot-auto` に名称変更され
certbot-auto による自動更新を以下スクリプトになります。

本番環境以外でクライアント様への確認用等でなければ
こちらを利用しても良いかと思います。

`--force-renewal` をオプション指定することで強制的に更新します。

{% gist kenzo0107/913795f417c2ef666b6114e6c3f82ddc %}

## そもそも通知いらないという場合

こちらも `certbot-auto`

- cron で直接コマンド設定
- 毎月第一土曜日実行
- 一応ログには残しておく

```
00 6 1-7 * * 6 root /root/certbot/certbot-auto renew --force-renewal && service httpd graceful > /root/certbot/renewal.log
```

以上です。
