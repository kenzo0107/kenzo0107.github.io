---
layout: post
title: 2016年5月現在、SSL評価Fを取らない為に
date: 2016-06-27
tags:
  - SSL
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160627/20160627140744.png
---

それは、ある日 [QUALYS SSL LABS](https://www.ssllabs.com/ssltest/index.html) で SSL チェックしたとき

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160627/20160627140744.png" width="100%">
</div>

F になってる...

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160627/20160627141207.jpg" width="100%">
</div>

常に A+ を保っていたのに...

どうやら 2016/5/3 時点で新たに脆弱性が発見されたとのこと。

{% linkPreview https://oss.sios.com/security/general-security-20160504 _blank %}

今回指摘されている `CVE-2016-2107` :

> AES-NI CBC MAC チェックで MITM 攻撃者がパディングオラクル攻撃可能なことがわかりました。この問題は、CVE-2013-0169(Lucky 13 パディング)の修正のために導入された箇所の不具合から発生しました。

上記対応策をまとめました。

## 対応策

- OpenSSL version up

※試験 OS 環境: CentOS7

以下記事では 「OpenSSL のバージョンを 1.0.2h/1.0.1t にあげてください。」とありますが、

[general-security-20160504](https://oss.sios.com/security/general-security-20160504)

段階的に試した所
以下コマンドで openssl のバージョンアップをした所
エラーが消え B となりました。

事前に Nginx を 1.11.1 にアップデートした為でしょうか汗

```
# yum upgrade openssl -y

# openssl version
OpenSSL 1.0.1e-fips 11 Feb 2013
```

- ssl_ciphers の設定変更

config generator で 生成される ssl_ciphers ディレクティブをそのまま設定すると評価が B 止まりでした。

[https://ssl-config.mozilla.org/](https://ssl-config.mozilla.org/)

諸々含めたくない暗号化法があるようです。

```
ssl_ciphers 'ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA:ECDHE-ECDSA-DES-CBC3-SHA:ECDHE-RSA-DES-CBC3-SHA:EDH-RSA-DES-CBC3-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:DES-CBC3-SHA:!DSS';
```

_以下最終的に設定した ssl_ciphers_ すると A+ に戻りました。

```
ssl_ciphers 'ECDH !aNULL !eNULL !SSLv2 !SSLv3';
```

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160627/20160627143218.png" width="100%">
</div>

OpenSSL の脆弱性はチェックし続けていかねば

## 補足

HTTP Strict Transport Security を 有効化 (常時 SSL) にしないと
A+ は取れません。

常時 SSL はパフォーマンスにも影響するので
せめて A まで取る、という指針を決めてから着手してください。
