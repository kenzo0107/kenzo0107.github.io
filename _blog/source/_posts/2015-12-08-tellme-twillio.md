---
layout: post
title: Twilio で電話通知
date: 2015-12-08
tags:
- Monitoring
- Twilio
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20151208/20151208143258.png
---

## 概要

障害検知をメールやSlackに流しても休日に業務系連絡を見ることは少ない。<br/>
その為、より検知報告に気付きやすくする様、<br/>
電話通知にするべくTwilioを導入する運びとなりました。

まずは利用するまでの簡単な手順をまとめました。<br/>

※コードのサンプルがTwilioのサイト内にあるので導入しやすかったです。


## 手順

### 1. Twilio にアクセス

以下リンクからTwilioにアクセスします。

[http://twilio.kddi-web.com](http://twilio.kddi-web.com)


### 2. 新規登録

名前、E-mail、パスワード(大小半角英数字)と

何にどの言語で利用するかを選択して

「始めましょう」をクリック。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20151208/20151208104015.png" width="100%">
</div>

「始めましょう」という日本語はユーザ目線でなく違和感ありますね。

### 3. アカウント認証

以下２つの認証方法があります。

- 電話番号にSMSに確認コードを送信させる
- 電話番号にTwilioから着信があり確認コードのダイヤルキーを入力する。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20151208/20151208104800.png" width="100%">
</div>

後者はTwilioの音声読み上げロボットから電話がかかって来るので<br/>
どんな感じで通知されるか試してみたい方は是非後者を選択してみてください。<br/>

スムーズなイントネーションではないですが、伝えたい気持ちは誰よりもあります。


### 4. Twilioから電話をかけてみる

アカウント認証確認後、Twilio製品の「プログラマブルVoice」ページTopに遷移しました。
メニューから `ツール` をクリックしツールページに遷移してください。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20151208/20151208110143.png" width="100%">
</div>


#### To指定
音声通話>通話>電話をかける のAPI Explorer にて
`必須` の`To` に 電話番号認証した番号を入力してください。

但し、日本番号（+81）の場合、
 `090********` の番号は<br/>
はじめの `0` を削除し、 `+81` をprefixとして追加し、<br>
`+8190********` となりますので注意してください。<br/>

#### URL指定
`条件` の`Url` にTwilioからの電話を受け取った際、<br/>
電話のキーダイヤルを押下した際の挙動をurl形式で指定可能です。

適当に準備できるUrlがない場合は、<br/>
以下のような適当なUrlで良いです。

`http:/hogehoge.hogehoge.co.jp`

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20151208/20151208110552.png" width="100%">
</div>

#### 通知実行

ページ下部の `リクエストを発行する` ボタンをクリックします。

<span style="color: #d32f2f">※</span> `※料金が発生します` とありますが、Trialは料金を請求されるということはありません。<br/>
<span style="color: #d32f2f">※</span>同アカウントでアップグレードする際は、発信した電話料金も合わせて請求されることになるので、テスト完了後は別途アカウントを取得することを推奨します。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20151208/20151208112301.png" width="100%">
</div>

#### 電話を受け取る

Twilioから電話がかかってきたかと思います。<br/>
キーダイヤルを入力すると、 Urlで指定したプログラムが動作しますが、<br/>
適当に入力したので<br/>
`アプリケーションエラーが発生しました。電話を終了します。`
と通知されるはずです。


実際にプログラムから使用する際は、<br/>
指定したUrlでキー入力を受け取ってその後の挙動を制御する、<br/>
という流れになります。


## 実際に利用した例

担当した業務では、Zabbixからの障害検知をTwilioで担当者に電話報告（エスカレーション）するという仕組みを構築しました。

> 例）以下のような挙動が実現できます。<br/>
> Zabbixで障害検知 <br/>
> ↓<br/>
> Twilio<br/>
> ↓ 電話<br/>
> 対応者 <br/>
> ↓ 対応者が「1」をクリック<br/>
> 指定したUrlのプログラム実行<br/>
> ↓「1」を受け取り、障害対応可能な旨をZabbixへ通知<br/>
> Zabbix (障害対応中)

##### Zabbix & Twilio 参考

[zabbix-twillio](http://begood-technology.github.io/zabbix-twilio/)


上記サイトでのzabbix-twilio連携の手順で進めた場合、<br/>
twilio でキーダイヤル入力後、 以下のようなエラーが発生し、イベント登録ができません。<br/>
`API error -32602: The "user.login" method must be called without the "auth" parameter`

zabbix-twilio.php内の `Zabbix_API`クラスが古い為です。<br/>

[zabbix-twilio.php](https://github.com/begood-technology/zabbix-twilio/blob/master/zabbix-twilio.php)


[PhpZabbixApi](https://github.com/confirm/PhpZabbixApi)

上記をダウンロードし、 `php build.php` で 以下2ファイルを生成し、<br/>
こちらを呼び出し `Zabbix_Api` と `ZabbixApi` とを変更してください。


- ZabbixApi.class.php
- ZabbixApiAbstract.class.php


- /var/www/html/zabbix-twilio/zabbix-twilio.php

```
+ require_once 'ZabbixApi.class.php';
+ use ZabbixApi\ZabbixApi;

-                                       $api = new Zabbix_API ( $ZABBIX_API, $ZABBIX_USER, $ZABBIX_PASS );
+                                       $api = new ZabbixApi ( $ZABBIX_API, $ZABBIX_USER, $ZABBIX_PASS);
```

`ZabbixApi ` は Basic認証を設定している場合にも対処しています。

```
// 例)
$api = new ZabbixApi ( $ZABBIX_API, $ZABBIX_USER, $ZABBIX_PASS, $BASIC_AUTH_USER, $BASIC_AUTH_PASS);
```



#### 検証環境
- Amazon Linux AMI release 2015.09
- Zabbix 2.5 (3.0α)
- PHP 5.6.14
- MySQL 5.5.46

以上
