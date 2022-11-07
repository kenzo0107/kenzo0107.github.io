---
layout: post
title: Rails (gem 'sendgrid-ruby') × SendGrid の Event Notification で API Key ごとの独自メタ情報を設定する
date: 2019-03-13
tags:
  - SendGrid
  - Ruby
  - Rails
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190313/20190313234822.png
---

## SendGrid の Event Notification の使い所

SendGrid には Event Notification という Webhook を設定することでメールの送信状態をイベント情報として取得することができます。

メールを SendGrid が受信した、送信先に届いた、等の情報です。

[SendGrid - メールが届いているか確認する](https://sendgrid.kke.co.jp/docs/Tutorials/C_Manage_Events/using_activity.html)

例えば、未達だったメールの情報を取得したい場合等に、この Webhook を利用し、イベント情報を保存することで調査や集計が可能です。

AWS API Gateway + Lambda で構築したエンドポイントに投げ、S3 に保存し、送信失敗件数を Athena で検索集計する、ということができます。

## 何か問題でも？

<!-- more -->

SendGrid は 1 アカウントで複数のプロジェクト毎の API Key を発行することができます。

ですが、 イベント情報にはどの API Key を利用してメール送信したか、の記録がありません。

複数の API Key がある場合に、どのプロジェクトのどの環境で送信したのか、調査や集計ができません。

これを解決する手段として、メール送信時にメタ情報を登録する方法があります。

Rails 5.2 で試してみました。

## まずはセットアップ

- Gemfile

```ruby
gem 'sendgrid-ruby'
```

- config/initializers/sendgrid.rb

```ruby
sendgrid_api_key = Rails.application.credentials.dig(Rails.env.to_sym, :sendgrid_api_key)
ActionMailer::Base.add_delivery_method :sendgrid, Mail::SendGrid, api_key: sendgrid_api_key
```

api_key は credentials に設定し、そこから取得。
※ RAILS_ENV=development でお試し可なので直に設定でも可。そこは自己責任で

- lib/mail/send_grid.rb

```ruby
# frozen_string_literal: true

class Mail::SendGrid
  def initialize(settings)
    @settings = settings
  end

  def deliver!(mail)
    sg_mail = SendGrid::Mail.new
    sg_mail.from = SendGrid::Email.new(email: mail.from.first)
    sg_mail.subject = mail.subject
    personalization = SendGrid::Personalization.new
    personalization.add_to(SendGrid::Email.new(email: mail.to.first))
    personalization.subject = mail.subject
    sg_mail.add_personalization(personalization)
    sg_mail.add_content(SendGrid::Content.new(type: 'text/plain', value: mail.body.raw_source))

    // ここでカテゴリー情報として登録
    sg_mail.add_category(SendGrid::Category.new(name: "#{Rails.env}-#{Settings.project_name}"))

    sg = SendGrid::API.new(api_key: @settings[:api_key])
    response = sg.client.mail._('send').post(request_body: sg_mail.to_json)
    Rails.logger.info response.status_code
  end
end
```

`#{Rails.env}-#{Settings.project_name}` の部分は適宜変更してください。

## メール送信してみる

`rails c` して

```ruby
ActionMailer::Base.mail(to: "nakayama.kinnikunn@hogehoge.jp", from: "info@&lt;sender authentication で認証したドメイン&gt;", subject: "メールタイトル", body: "すいません、テスト送信です").deliver_now
```

すると、Event Notification では以下の様なイベント情報が取得できます。

```ruby
{"email":"nakayama.kinnikunn@hogehoge.jp","timestamp":1551964210,"ip":"12.345.67.89","sg_event_id":"xxxxxxxxxxxxxxxx","sg_message_id":"xxxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyy","category":["staging-kenkoboys"],"useragent":"Mozilla/5.0 (Windows NT 5.1; rv:11.0) Gecko Firefox/11.0 (via ggpht.com GoogleImageProxy)","event":"open"}
```

注目すべきは `category":["staging-kenkoboys"]` です。

add_category したカテゴリ情報が取得でき、これで どの API Key のイベント情報であるかの紐付けができます。

以上
参考になれば幸いです。
