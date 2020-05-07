---
layout: post
title: SSL証明書有効期限をチェックして結果をSlackに通知
date: 2016-08-26
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160826/20160826150248.png
tags:
- SSL
---

## 概要

```
SSL証明書の有効期限切れでサイトにアクセスができなくなってしまった。
```

なんてことが発生しない様にする為に実装しました。

## Shell スクリプト

- DOMAIN_LIST で設定した複数ドメインについて有効期限を確認します。

{% gist kenzo0107/35fcc7df045d98aa9bd781daf6345320 %}

※実際には Jenins で実行しており
　ビルドパラメータでドメイン追加を簡単にしています。

- 毎月第一月曜日に棚卸ししています。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160826/20160826150547.png" width="100%">
</div>

## Zabbix でも監視

Qiita に記事がありました。

[ZabbixでSSL証明書有効期限を監視する](http://qiita.com/skouno/items/a98bc384b4734a6e20a7)


1週間を切ったら電話通知も設定できますし
対策は何にせよしておくと気持ちが落ち着きます。

以上です。
