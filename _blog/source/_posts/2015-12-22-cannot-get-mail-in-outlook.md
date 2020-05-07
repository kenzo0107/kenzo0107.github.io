---
layout: post
title: Outlook にメールが届かない件対応
date: 2015-12-22
tags:
- Outlook
- Email
---

## 概要

EC2を利用してますがSESかまさずに
メール送信をしていた時に
以下のようなエラーが発生しました。

- エラー内容


>Dec 18 17:24:11 ip-xxx-xx-xx-xx postfix/smtp[4827]: 380D2A27ED: to=<hogehoge@xxxxxxx.com>, relay=xxxxxxx-com.mail.protection.outlook.com[xxx.xx.xx.xxx]:25, delay=6.1, delays=0.01/0/0.88/5.2, dsn=5.7.1, status=bounced (host xxxxxxx-com.mail.protection.outlook.com[xxx.xx.xx.xxx] said: 550 5.7.1 Service unavailable; Client host [yy.yy.yy.yyy] blocked using FBLW15; To request removal from this list please forward this message to delist@messaging.microsoft.com (in reply to RCPT TO command))


## 要約すると

`hogehoge@xxxxxxx.com` 宛のメールが Outlook でブラックリスト扱いされて弾かれています ( `status=bounced` )。
もしブラックリストから削除したい場合は、 `delist@messaging.microsoft.com` 宛に解除申請してください。


## もうちょっと細かく

`relay=xxxxxxx-com.mail.protection.outlook.com[xxx.xx.xx.xxx]:25`
とある通り
MicroSoftがメールツールサービス Outlook が受信相手です。

送信元サーバIP `yy.yy.yy.yyy` のホストは `FBLW15` 基準でブラックリスト扱いされているので
サービスは利用できない = メールは受け取らない
というものです。

- FBLW15 ... MicroSoft独自のブラックリスト


## 対応


- 宛先:

```
delist@messaging.microsoft.com
```

- タイトル:

```
Please Remove My IP yy.yy.yy.yyy from your BlockList.
```

- 内容
```
Please remove this IP yy.yy.yy.yyy from your BlockList.

Thanks.
Kenzo Tanaka.
```


## 数分後に Microsoft Customer Support から返信が着た

- メール内容

```
Hello ,

Thank you for your delisting request SRX1318598611ID. Your ticket was received on (Dec 21 2015 08:14 AM UTC) and will be responded to within 24 hours.

Our team will investigate the address that you have requested to be removed from our blocklist. If for any reason we are not able to remove your address, one of our technical support representatives will respond to you with additional information.

Regards,
Technical Support
```

- 和訳すると

```
こんにちは

ブラックリスト申請の削除依頼を受け取りました。24時間以内に回答します。

削除要請頂いたアドレスをについて調査します。
何らかの理由で削除依頼を引き受けられない場合は、
当社の技術サポートから追加情報をお届け致します。

以上宜しくお願い致します。
テクニカルサポート
```


## 24時間待ってみる

メール着た！

```
Hello,

Thank you for contacting Microsoft Online Services Technical Support.  This email is in reference to ticket number, 1318598611 which was opened in regards to your delisting request for yy.yy.yy.yyy

The IP address you submitted has been reviewed and removed from our block lists.  Please note that there may be a 1-2 hour delay before this change propagates through our entire system.

We apologize for any inconvenience this may have caused you.  As long as our spam filtering systems do not mark a majority of email from the IP address as spam-like, your messages will be allowed to flow as normal through our network.  However, should we detect an increase in spam-like activity, the IP address may be re-added to our block list.

Should you have any further questions or concerns, please feel free to respond to this email.

Thank you again for contacting Microsoft Online Services technical support and giving us the opportunity to serve you.
```

- 和訳

```
こんにちは

マイクロソフト・オンライン・サービス テクニカルサポートにお問い合わせいただきありがとうございます。
このメールはチケット番号 1318598611、IPアドレス(yy.yy.yy.yyy) をブラックリストから削除する様申請頂いた件についてです。

あなたが提出されたIPアドレスを見直し、ブロックリストから削除しました。
この変更は私たちの全システムに行き届くには 1〜2時間程掛かる見込みです。

ご不便お掛けしたことをお詫び申し上げます。
スパムフィルタリングシステムがスパムとおぼしきIPアドレスからの多くのE-mailをマークしない限り
あなたのメッセージは当社のネットワークを通じて通常通りに許可されるでしょう。
しかし、スパム行為が増加していることを検知する必要があり、ブロックリストに追加する可能性があります。

その他質問や確認をご希望の際は、こちらのメールにご返信ください。

マイクロソフト・オンライン・サービス テクニカルサポートにご連絡いただき
お力添えできましたこと、誠に感謝致します。
```

やや和訳が...アグレッシブということで受け入れてください。
もっと良い和訳あったら頂きたいです。


以上でブラックリストから解除されたそうなので、
マイクロソフト・テクニカル・サービスからメールが届いてから
4〜5時間後に再度メール送信し問題ないことが確認できました。


## IPアドレス/DNSのブラックリストチェック

以下サイトで試しておくのが良いかと思います。
何かの間違いで登録されていた、というスパムメールとして扱われている
ということになるので。

- http://www.spamhaus.org/lookup/
- http://mxtoolbox.com/blacklists.aspx
