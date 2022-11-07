---
title: SendGrid メール送信できるまで & なりすまし対策
tags:
  - SendGrid
date: 2020-10-08
cover: https://i.imgur.com/4NdER1F.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

# 概要

SendGrid ダッシュボードで設定する手続きを運用上のフィードバックを入れつつまとめました。

<!-- more -->

# メール送信設定手続き

## [SubUser 作成](https://sendgrid.kke.co.jp/docs/User_Manual_JP/Settings/Subusers/index.html)

- サブユーザは、メール送信や API の処理を分けて管理ができる。
- Subuser Stats によって、Subuser 毎の集計が SendGrid ダッシュボードで確認できる。
- サブユーザの最大作成数は 15 で、それ以上作成したい場合はサポート問い合わせ必要。

![](https://i.imgur.com/NN7NOIT.png)

<!-- more -->

基本以下設定し、「Create Subuser」ボタンをクリックする。
（他は設定しなくても良い。）

![](https://i.imgur.com/s1j6nLh.png)

### Username

- 環境毎(stg, prd 等)に作成すると Subuser 毎に SendGrid ダッシュボードの Stats の確認ができるなどのメリットがあり、管理しやすいので以下例の様に指定しています。
- 例: `<env>-<service name>`
  - stg-hogehoge
  - prd-hogehoge

### Email

Gmail を利用している場合は、メールアドレスのエイリアスを設定すると送信先が 1 つにまとまり管理しやすいです。

- 例: `sample+<subuser name>@<your domain>`

### I.P. ADDRESSES

チェックを入れる。

10 以上の subuser 間で共通の IP を指定して運用していますが、現状特段問題はない。

各独自ドメイン毎に IP を指定したい所。追加時は 3,700 円/月/1 ドメイン。
到達率がどこまで上がるかは未検証です。

コスト的に問題なければ、ドメイン毎に IP 指定しておくのが良さそう。

参考: [固定 IP アドレスを利用するメリットは何でしょうか？](https://support.sendgrid.kke.co.jp/hc/ja/articles/202688589-%E5%9B%BA%E5%AE%9AIP%E3%82%A2%E3%83%89%E3%83%AC%E3%82%B9%E3%82%92%E5%88%A9%E7%94%A8%E3%81%99%E3%82%8B%E3%83%A1%E3%83%AA%E3%83%83%E3%83%88%E3%81%AF%E4%BD%95%E3%81%A7%E3%81%97%E3%82%87%E3%81%86%E3%81%8B-)

## [Domain Authentication 設定](https://sendgrid.kke.co.jp/docs/User_Manual_JP/Settings/Sender_authentication/How_to_set_up_domain_authentication.html)

### Domain Authentication とは？

- SendGrid がユーザの許可を得てメール送信していることを証明する機能。
- 設定しておかないと「なりすまし」として扱われ、迷惑メールに振り分けられる可能性が高くなる。

### 設定手順

使用している DNS を選択します。
![](https://i.imgur.com/kKjpVre.png)

![](https://i.imgur.com/XIKpTtB.png)

設定項目

- From Domain に メールのドメインパート（送信者のメールアドレスの@以降）を指定する。
- Advanced Settings > Use automated security にチェック（デフォルトでチェック）
  - Use automated security ... SPF/DKIM に関するレコードの制御を SendGrid に任せるかどうかを指定する機能です。
- Assign to a subuser
  - stg, prd で共通のドメインパートを指定する場合は、チェックを外す。
    - stg, prd 各 subuser で Domain Authentication を指定する必要がある。
  - stg, prd で異なるドメインパートを指定する場合は subuser 紐付け。

発行された DNS レコードを DNS に登録する。
![](https://i.imgur.com/TdlBOAQ.png)

AWS なら Route53 にレコードを登録します。

「Verify」をボタンをクリック

- レコード登録しただけでは自動で認証せず、「Verify」ボタンをクリックする必要があるので注意！

## API Key 作成

先ほど作成した Subuser に切り替えます。

![](https://i.imgur.com/6CEjSOJ.png)

「Create API Key」クリック

![](https://i.imgur.com/1Luebo0.png)

どの権限を持った API Key を発行するか決定します。
メールを送信するだけであれば、基本的に `Restricted Access` で Mail Send の Full Access のみあれば良い。

![](https://i.imgur.com/oOBAOml.png)

「Create & View」ボタンクリックで API Key が発行されます。

## Rails で SendGrid を利用しメール送信する設定

gem [sendgrid-actionmailer](https://github.com/eddiezane/sendgrid-actionmailer) をインストールして利用しています。

- Gemfile

development, test では利用しない為、 staging, production のみにしています。こちらは適宜変更してください。

```ruby
group :staging, :production do
  gem 'sendgrid-actionmailer'
end
```

- production.credentials.enc, staging.credentials.enc

  - prd, stg 用にそれぞれ別に発行した API Key を credentials に設定します。

- sconfig/environments/production.rb

```ruby
  config.action_mailer.delivery_method = :sendgrid_actionmailer
  config.action_mailer.sendgrid_actionmailer_settings = {
    api_key: Rails.application.credentials[:sendgrid_api_key]
  }
```

以上でメール送信ができる状態にはなりました。

以降は送信者のドメイン認証によるメールが届かない問題への対応になります。

# なりすまし対策

## [DMARC 設定](https://sendgrid.kke.co.jp/blog/?p=1781)

DMARC (Domain-based Message Authentication, Reporting, and Conformance) は送信ドメイン認証技術の 1 つで、SPF, DKIM 等の送信者ドメイン認証に失敗したメールの振る舞いを送信者が指定できるものです。

![](https://i.imgur.com/z07TUlW.png)

主に以下 3 つの役割があります。

1. メール送信者が認証失敗したメールの取り扱いを指定できる
   - 認証失敗したら迷惑メールボックスに入れる or そもそも受信拒否させることができる。
2. メール送信者が認証結果をメール受信者から受け取れる
   - なりすましたメール送信者を把握できる。
3. 第三者署名（代理署名）を許容しない
   - なりすましと判断されたメールを受信できない様にする。

つまり、DMARC 設定していないと？、第三者がなりすましたメールをユーザは疑いなく受信できてしまい、また、送信者はそのことを知る術がありません。

DMARC 設定として、以下レコードを登録します。

```
_dmarc.example.com    CNAME    v=DMARC1;p=quarantine;rua=mailto:dmarc.rua@example.com
```

| _Item_         | _Value_                  | _Explain_                                                                                       |
| -------------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| v=DMARC1       | プロトコルバージョン     | バージョン 1 のみ存在する為、 DMARC1 を指定する。                                               |
| p=quarantine   | DMARC レコードのポリシー | p=quarantine 指定で迷惑メールに振り分ける。                                                     |
| pct=100        | DMARC を適用する割合     | pct=100 or pct タグを削除しないとなりすまし攻撃に晒される危険性がある為、pct タグを削除しとく。 |
| rua=mailto:... | 集計レポートの報告先 URI | 集計レポートの通知先。事前に通知先をアプリケーション担当者に確認しておく。                      |

### 集計先メールアドレスを外部委託する場合

DMARC レコードの設定ドメイン (example.com) と 集計先の mailto で指定しているドメイン (hogehoge.jp) が異なる場合、

```
_dmarc.example.com    CNAME    v=DMARC1;p=quarantine;rua=mailto:dmarc.rua@hogehoge.jp
```

以下のレコードを集計先ドメイン (hogehoge.jp) で登録し、ドメインの関連性を示す必要があります。

```
example.com._report._dmarc.hogehoge.jp IN TXT "v=DMARC1"
```

### p タグの扱い注意

p=quarantine のみで pct タグは削除が良さそう。

- p=reject

  - `p=reject` にしてしまうと未認証メールは受信サーバは拒否する。

- `p=quarantine` 且つ、 `pct=0~99`
  - pct=100 でない場合は、なりすましの危険性に晒される可能性がある。
    参考: https://www.valimail.com/blog/what-you-need-to-know-about-the-pct-tag-in-dmarc-records/
    > However, this can still leave your domain open to impersonation attacks until you set pct=100 or remove the pct tag entirely.
  - pct はデフォルト 100。pct を削除することでデフォルトの 100 が適用される。

## SPF レコード登録

### SPF の仕組み

SPF（Sender Policy Framework）は、DMARC 同様、送信ドメイン認証技術の 1 つです。

送信者のメールアドレスのドメイン情報のある DNS に SPF レコードを登録し、
受信者が正しい送信元からの配信かをその SPF レコードを元に確認できる仕組みです。

送信者は上記の仕組みで、受信者に「なりすましでないこと」を証明する一連の仕組みを SPF と呼びます。

### SendGrid での SPF レコード設定 指針

SendGrid で独自ドメイン `hogehoge.jp` を SendGrid ドメイン認証しメール送信すると
Gmail のソース等で Return-Path を見ると `em1234.hogehoge.jp` の様にサブドメインが付与されていることがわかります。

From で設定しているドメイン `hogehoge.jp` と エンベロープ From の`em1234.hogehoge.jp` が異なる為、 Sender ID や docomo の独自認証がパスしない場合があります。

その対応として、以下 SPF レコードで以下を登録します。

```
"v=spf1 include:em1234.hogehoge.jp ~all"
```

参考

- [SendGrid - エンベロープ From を変更したいのですが？](https://support.sendgrid.kke.co.jp/hc/ja/articles/360000226322)
- [SendGrid で独自ドメインから docomo 宛に送信するときの注意点](https://techracho.bpsinc.jp/baba/2018_12_16/65691)

## スパムメール扱いされていないかテストする方法

以下、送信元メールアカウントの評価サービスを利用できます。

https://www.mail-tester.com/

![](https://i.imgur.com/IbAz71X.png)

上記の場合、 `test-00a9mdjzu@svr1.mail-tester.com` にメールを送ると、送信者を評価してくれます。

以下結果を元に、対処する項目を定めます。

![](https://i.imgur.com/clKGETd.png)

## まとめ

SendGrid には SPF/DKIM の独自ドメイン化を支援する Domain Authentication 機能等、迷惑メール扱い防止対策があります。

これらを適切に設定しないと迷惑メールに振り分けられたり、そもそもメールが拒否されたりということが起こりえる為、注意が必要です。

以下の送信ドメイン認証の仕組みを把握しつつ設定を進めると、より理解を深めることができました。

- SPF（Sender Policy Framework）
- DKIM (DomainKeys Identified Mail)
- DMARC (Domain-based Message Authentication, Reporting, and Conformance)

さらに到達率を上げる為に、気づいた対策があれば追記して参ります。
また、ご指摘いただけますと幸いです。

以上
ご参考になれば幸いです。
