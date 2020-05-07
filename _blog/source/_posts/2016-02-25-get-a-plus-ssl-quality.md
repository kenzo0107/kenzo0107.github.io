---
layout: post
title: 無料SSL証明書発行しセキュリティでA+を取る！ 〜Apache編〜
date: 2016-02-25
tags:
- SSL
- Apache
---

## 概要

ベリトランスモジュールバージョンアップに際して
SHA256で発行したSSL証明書が必須となりました。

テスト環境でベリトランスモジュールバージョンアップ試験を行う際に
SSL証明書導入する必要が生じました。

本番環境と同じ有料SSLを導入するまでとはいかずとも
近しい状況を構築する必要があったので無料SSL証明書を発行し導入しました。

上記の手順をまとめましたので以下に記載します。

## 環境

AWS Marketplace:  CentOS 6 (x86_64) - with Updates HVM を利用しています。

- CentOS release 6.7 (Final)
- Apache 2.4.12


## 手順

### CSR生成

事前準備として、SSLインストール対象サーバで
CSRを生成しておきます。

SHA256 対応のCSR生成方法について以下ご参考ください。

{% linkPreview http://kenzo0107.hatenablog.com/entry/2015/03/01/010130 _blank %}


### StartComに登録

#### ヘッダーメニューの Sign-up クリック

[StartSSL](https://startssl.com/)

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160224/20160224185554.png" width="100%">
</div>

#### 必要事項登録し「send verification code」ボタンクリック

登録E-mail宛に verification codeが送付されます。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160224/20160224185554.png" width="100%">
</div>

#### こんな感じのメールが来ます。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160224/20160224190645.png" width="100%">
</div>

#### verfication codeを入力し登録完了

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160224/20160224190947.png" width="100%">
</div>




### SSL発行手続き

#### 無料版選択

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160224/20160224191318.png" width="100%">
</div>

#### SSLのWeb Server 用を選択

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160225/20160225103836.png" width="100%">
</div>

#### Domain Validation

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160225/20160225103958.png" width="100%">
</div>

#### SSLインストール対象サーバのドメイン入力

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160225/20160225104510.png" width="100%">
</div>

#### メール送信による認証

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160225/20160225105201.png" width="100%">
</div>

<b>startSSL側で指定するメールアドレスで受信可能な状態にする</b>必要があります。

ec2インスタンスのメール受信設定は以下記事が参考になりました。ありがとうございます。

[AWS上のpostfixでメールを受信してみる](https://github.com/mechamogera/MyTips/wiki/AWS%E4%B8%8A%E3%81%AEpostfix%E3%81%A7%E3%83%A1%E3%83%BC%E3%83%AB%E3%82%92%E5%8F%97%E4%BF%A1%E3%81%97%E3%81%A6%E3%81%BF%E3%82%8B)

> 上記記事中の注意点として
> インスタンス作成直後に `yum update` 分にはいいですが
> 時にAWSで `yum update` をするとkernel panicを起こすことがあります。
> pythonをyumでなくソースから独自に入れ直したり、色々してたせいか...
>
> 原因は追い切れていませんが、経年運用したインスタンスについては yum update は控えたいと思います。

##### うまく受信設定できない場合

- /var/log/maillog を 常に tailしてログ確認。

- 受信可能なメールアドレスが既にあれば aliases で向け先変える。
postmaster@(domain) → root@(domain)

- メールボックスで Permission denied で
受信メールを保存できない場合は以下強引にメールディレクトリを変更する。

```
/etc/postfix/main.cf

- home_mailbox = Maildir/
+ home_mailbox = ../home/ec2-user/Maildir/
```

#### SSL証明書 注文へ進む

メール受信による認証がクリア後、SSL証明書注文へ進みます。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160225/20160225114419.png" width="100%">
</div>

#### 認証情報作成

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160225/20160225114811.png" width="100%">
</div>

情報入力後、 (domain).zip がダウンロードされる。
※ 今回は WebServer が Apache なので ApacheServer を参照します。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160225/20160225115225.png" width="100%">
</div>

解凍した zipファイルの ApacheServer 内の以下2ファイルを任意のディレクトリにアップしましょう。

- 1_root_bundle.crt
- 2_(domain).crt

今回アップ先ディレクトリは server.key 等のあるパス (/etc/httpd/conf/ssl.csr/) にします。


#### ssl.conf設定

SSL証明書のインストールとは
Apacheの設定ファイルとして指定ディレクティブで読み込ませる
ことです。

主な設定は以下です。

| *Item*                  | *Value*                                   | *Explain*                         |
| ----------------------- | ----------------------------------------- |
| SSLCertificateChainFile | /etc/httpd/conf/ssl.csr/1_root_bundle.crt | 中間証明書                        |
| SSLCertificateFile      | /etc/httpd/conf/ssl.csr/2_(domain).crt    | SSLサーバ証明書                   |
| SSLCertificateKeyFile   | /etc/httpd/conf/ssl.csr/server.key        | SSLサーバ証明書とペアになる秘密鍵 |


以下URLで各WebServerとopensslバージョンにより最適な設定方法を示唆いただけます。

[https://ssl-config.mozilla.org/](https://ssl-config.mozilla.org/)

/etc/httpd/conf.d/ssl.conf

```
LoadModule ssl_module modules/mod_ssl.so

Listen 443

AddType application/x-x509-ca-cert .crt
AddType application/x-pkcs7-crl    .crl

SSLPassPhraseDialog  builtin


SSLSessionCache         shmcb:/var/cache/mod_ssl/scache(512000)
SSLSessionCacheTimeout  300


#SSLMutex default
Mutex default ssl-cache

SSLRandomSeed startup file:/dev/urandom  256
SSLRandomSeed connect builtin
#SSLRandomSeed startup file:/dev/random  512
#SSLRandomSeed connect file:/dev/random  512
#SSLRandomSeed connect file:/dev/urandom 512

SSLCryptoDevice builtin

<VirtualHost _default_:443>

  DocumentRoot "/var/www/html"
  ServerName (domain):443

  ErrorLog /var/log/ssl_error_log
  TransferLog /var/log/ssl_access_log
  LogLevel warn

  SSLEngine on
  SSLCertificateFile /etc/httpd/conf/ssl.csr/2_(domain).crt
  SSLCertificateKeyFile /etc/httpd/conf/ssl.csr/server.key
  SSLCertificateChainFile /etc/httpd/conf/ssl.csr/1_root_bundle.crt


  <Files ~ "\.(cgi|shtml|phtml|php3?)$">
    SSLOptions +StdEnvVars
  </Files>
  <Directory "/var/www/cgi-bin">
    SSLOptions +StdEnvVars
  </Directory>


  SetEnvIf User-Agent ".*MSIE.*" \
         nokeepalive ssl-unclean-shutdown \
         downgrade-1.0 force-response-1.0

  CustomLog logs/ssl_request_log \
          "%t %h %{SSL_PROTOCOL}x %{SSL_CIPHER}x \"%r\" %b"

  <Directory "/var/www/html">
    AllowOverride All
    Options -Indexes +FollowSymLinks +Includes +ExecCGI
    Order allow,deny
    Allow from all
  </Directory>

</VirtualHost>

SSLProtocol all -SSLv2 -SSLv3

SSLCipherSuite ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA:ECDHE-ECDSA-DES-CBC3-SHA:ECDHE-RSA-DES-CBC3-SHA:EDH-RSA-DES-CBC3-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:DES-CBC3-SHA:!DSS

SSLHonorCipherOrder on

SSLCompression off
SSLSessionTickets off

```

> パフォーマンスチューニングを一切していません。
> あくまで SSL証明書インストールを対象としていますのでご注意ください。

#### 設定ファイルの構文確認

```
// 構文チェック
# httpd -t

// 構文エラーがない場合は以下のように表示されます。
Syntax OK
```

構文エラーが発生している場合は対象箇所が表示されますのでチェックし直してください。
但し、構文エラーがないからと言ってApache再読み込み時にエラーが発生しないとは限らないので
万が一の為、即元に戻せるようなコマンドを作っておくと良いでしょう。

例えば
ssl.conf を ssl.conf.bk にリネームして Apacheの設定ファイルとして見ないようにさせるなど。

#### Apache 設定ファイル再読み込み

```
# service httpd reload
Reloading httpd:             [  OK  ]
```

#### ブラウザからアクセス

Chromeでアクセスしました。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160225/20160225122555.png" width="100%">
</div>

- 認証の詳細な情報

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160225/20160225123052.png" width="100%">
</div>




#### セキュリティチェック

以下サイトで診断できます。
[QUALYS SSL LABS](https://www.ssllabs.com/ssltest/index.html)

「A」が取れました！

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160225/20160225130720.png" width="100%">
</div>


ちなみに
常に https通信で問題ないサイトであれば以下のように設定すると

```
<VirtualHost *:443>
  ...
  Header always set Strict-Transport-Security "max-age=15768000"
  ...
</VirtualHost>
```

「A+」取得できました！

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160225/20160225131401.png" width="100%">
</div>

常時httpsはセキュアではありますがサイトの仕様次第なところもあるので状況によりけりです。

以上
