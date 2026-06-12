---
layout: post
title: Fixing the Issue of Mail Not Being Delivered to Outlook
date: 2015-12-22
lang: en
translation_id: cannot-get-mail-in-outlook
permalink: en/2015/12/22/cannot-get-mail-in-outlook/
cover: /img/cover/2015-12-22-cannot-get-mail-in-outlook.svg
tags:
- Outlook
- Email
---

## Overview

I was sending mail from EC2 without going through SES,
and the following error occurred.

- Error details


>Dec 18 17:24:11 ip-xxx-xx-xx-xx postfix/smtp[4827]: 380D2A27ED: to=<hogehoge@xxxxxxx.com>, relay=xxxxxxx-com.mail.protection.outlook.com[xxx.xx.xx.xxx]:25, delay=6.1, delays=0.01/0/0.88/5.2, dsn=5.7.1, status=bounced (host xxxxxxx-com.mail.protection.outlook.com[xxx.xx.xx.xxx] said: 550 5.7.1 Service unavailable; Client host [yy.yy.yy.yyy] blocked using FBLW15; To request removal from this list please forward this message to delist@messaging.microsoft.com (in reply to RCPT TO command))


## In short

Mail addressed to `hogehoge@xxxxxxx.com` is being treated as blacklisted by Outlook and rejected ( `status=bounced` ).
If you want to be removed from the blacklist, send a delisting request to `delist@messaging.microsoft.com`.


## A bit more detail

As shown in
`relay=xxxxxxx-com.mail.protection.outlook.com[xxx.xx.xx.xxx]:25`,
the recipient is Microsoft's mail service, Outlook.

Because the host of the sending server IP `yy.yy.yy.yyy` is treated as blacklisted under the `FBLW15` criteria,
the service cannot be used = the mail is not accepted.

- FBLW15 ... Microsoft's own blacklist


## Response

- To:

```
delist@messaging.microsoft.com
```

- Subject:

```
Please Remove My IP yy.yy.yy.yyy from your BlockList.
```

- Body
```
Please remove this IP yy.yy.yy.yyy from your BlockList.

Thanks.
Kenzo Tanaka.
```


## A few minutes later, a reply arrived from Microsoft Customer Support

- Email content

```
Hello ,

Thank you for your delisting request SRX1318598611ID. Your ticket was received on (Dec 21 2015 08:14 AM UTC) and will be responded to within 24 hours.

Our team will investigate the address that you have requested to be removed from our blocklist. If for any reason we are not able to remove your address, one of our technical support representatives will respond to you with additional information.

Regards,
Technical Support
```

- Japanese translation

```
こんにちは

ブラックリスト申請の削除依頼を受け取りました。24時間以内に回答します。

削除要請頂いたアドレスをについて調査します。
何らかの理由で削除依頼を引き受けられない場合は、
当社の技術サポートから追加情報をお届け致します。

以上宜しくお願い致します。
テクニカルサポート
```


## Waiting 24 hours

The mail arrived!

```
Hello,

Thank you for contacting Microsoft Online Services Technical Support.  This email is in reference to ticket number, 1318598611 which was opened in regards to your delisting request for yy.yy.yy.yyy

The IP address you submitted has been reviewed and removed from our block lists.  Please note that there may be a 1-2 hour delay before this change propagates through our entire system.

We apologize for any inconvenience this may have caused you.  As long as our spam filtering systems do not mark a majority of email from the IP address as spam-like, your messages will be allowed to flow as normal through our network.  However, should we detect an increase in spam-like activity, the IP address may be re-added to our block list.

Should you have any further questions or concerns, please feel free to respond to this email.

Thank you again for contacting Microsoft Online Services technical support and giving us the opportunity to serve you.
```

- Japanese translation

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

The Japanese translation is a bit... aggressive, so please bear with it.
If you have a better translation, I'd love to hear it.


Since I was told I had been removed from the blacklist,
I sent mail again 4-5 hours after receiving the message from Microsoft Technical Service
and confirmed there were no problems.


## Checking IP address / DNS blacklists

I think it's a good idea to test on the following sites.
If you've been registered by some mistake, it means you're being
treated as spam mail.

- http://www.spamhaus.org/lookup/
- http://mxtoolbox.com/blacklists.aspx
