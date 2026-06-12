---
layout: post
title: Setting Per-API-Key Custom Metadata in SendGrid Event Notification with Rails (gem 'sendgrid-ruby')
date: 2019-03-13
lang: en
translation_id: rails-gem-sendgrid-ruby-x-sendgrid-event-notification-api-key
permalink: en/2019/03/13/rails-gem-sendgrid-ruby-x-sendgrid-event-notification-api-key/
tags:
  - SendGrid
  - Ruby
  - Rails
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20190313/20190313234822.png
---

## When to Use SendGrid's Event Notification

By configuring a Webhook called Event Notification, SendGrid lets you retrieve the delivery status of your emails as event information.

This includes information such as whether SendGrid received an email or whether it was delivered to the recipient.

[SendGrid - Checking Whether an Email Was Delivered](https://sendgrid.kke.co.jp/docs/Tutorials/C_Manage_Events/using_activity.html)

For example, when you want to retrieve information about emails that failed to be delivered, you can use this Webhook and save the event information, which enables investigation and aggregation.

You can send the events to an endpoint built with AWS API Gateway + Lambda, store them in S3, and use Athena to search and aggregate the number of delivery failures.

## So What's the Problem?

<!-- more -->

With a single SendGrid account, you can issue an API Key for each of multiple projects.

However, the event information contains no record of which API Key was used to send the email.

When you have multiple API Keys, you cannot investigate or aggregate which project and which environment the email was sent from.

One way to solve this is to register metadata when sending the email.

I tried it out with Rails 5.2.

## First, the Setup

- Gemfile

```ruby
gem 'sendgrid-ruby'
```

- config/initializers/sendgrid.rb

```ruby
sendgrid_api_key = Rails.application.credentials.dig(Rails.env.to_sym, :sendgrid_api_key)
ActionMailer::Base.add_delivery_method :sendgrid, Mail::SendGrid, api_key: sendgrid_api_key
```

The api_key is set in credentials and retrieved from there.
* Since you can try this with RAILS_ENV=development, you may set it directly. Do so at your own risk.

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

    // Register it here as category information
    sg_mail.add_category(SendGrid::Category.new(name: "#{Rails.env}-#{Settings.project_name}"))

    sg = SendGrid::API.new(api_key: @settings[:api_key])
    response = sg.client.mail._('send').post(request_body: sg_mail.to_json)
    Rails.logger.info response.status_code
  end
end
```

Change the `#{Rails.env}-#{Settings.project_name}` part as appropriate.

## Try Sending an Email

Run `rails c` and then:

```ruby
ActionMailer::Base.mail(to: "nakayama.kinnikunn@hogehoge.jp", from: "info@&lt;sender authentication で認証したドメイン&gt;", subject: "メールタイトル", body: "すいません、テスト送信です").deliver_now
```

Then, Event Notification gives you event information like the following:

```ruby
{"email":"nakayama.kinnikunn@hogehoge.jp","timestamp":1551964210,"ip":"12.345.67.89","sg_event_id":"xxxxxxxxxxxxxxxx","sg_message_id":"xxxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyy","category":["staging-kenkoboys"],"useragent":"Mozilla/5.0 (Windows NT 5.1; rv:11.0) Gecko Firefox/11.0 (via ggpht.com GoogleImageProxy)","event":"open"}
```

The part to pay attention to is `category":["staging-kenkoboys"]`.

You can retrieve the category information you set with add_category, and this lets you associate which API Key the event information belongs to.

That's all.
I hope this is helpful.
