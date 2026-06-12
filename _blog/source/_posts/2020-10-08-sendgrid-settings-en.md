---
title: Getting SendGrid Email Delivery Working & Anti-Spoofing Measures
tags:
  - SendGrid
date: 2020-10-08
lang: en
translation_id: sendgrid-settings
permalink: en/2020/10/08/sendgrid-settings/
cover: https://i.imgur.com/4NdER1F.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

# Overview

This post summarizes the setup procedures you perform in the SendGrid dashboard, with some operational feedback mixed in.

<!-- more -->

# Email Delivery Setup Procedure

## [Creating a SubUser](https://sendgrid.kke.co.jp/docs/User_Manual_JP/Settings/Subusers/index.html)

- Subusers let you separate and manage email delivery and API processing.
- With Subuser Stats, you can check per-subuser aggregates in the SendGrid dashboard.
- The maximum number of subusers you can create is 15. If you want more than that, you need to contact support.

![](https://i.imgur.com/NN7NOIT.png)

<!-- more -->

Basically, configure the following and click the "Create Subuser" button.
(You don't need to configure the rest.)

![](https://i.imgur.com/s1j6nLh.png)

### Username

- Creating one per environment (stg, prd, etc.) makes it easier to manage, since you get benefits like being able to check Stats per subuser in the SendGrid dashboard. For that reason, I specify them like the example below.
- Example: `<env>-<service name>`
  - stg-hogehoge
  - prd-hogehoge

### Email

If you use Gmail, setting up an email address alias consolidates all destinations into one, which makes management easier.

- Example: `sample+<subuser name>@<your domain>`

### I.P. ADDRESSES

Check this box.

We operate with a common IP shared across more than 10 subusers, and so far there have been no particular problems.

Ideally I'd like to assign an IP per custom domain. Adding one costs 3,700 yen/month per domain. How much the delivery rate improves remains unverified.

If cost is not an issue, it seems best to assign an IP per domain.

Reference: [What are the benefits of using a static IP address?](https://support.sendgrid.kke.co.jp/hc/ja/articles/202688589-%E5%9B%BA%E5%AE%9AIP%E3%82%A2%E3%83%89%E3%83%AC%E3%82%B9%E3%82%92%E5%88%A9%E7%94%A8%E3%81%99%E3%82%8B%E3%83%A1%E3%83%AA%E3%83%83%E3%83%88%E3%81%AF%E4%BD%95%E3%81%A7%E3%81%97%E3%82%87%E3%81%86%E3%81%8B-)

## [Domain Authentication Setup](https://sendgrid.kke.co.jp/docs/User_Manual_JP/Settings/Sender_authentication/How_to_set_up_domain_authentication.html)

### What is Domain Authentication?

- A feature that proves SendGrid is sending email with the user's permission.
- If you don't set it up, the email is treated as "spoofing" and is more likely to be filtered into spam.

### Setup Steps

Select the DNS you are using.
![](https://i.imgur.com/kKjpVre.png)

![](https://i.imgur.com/XIKpTtB.png)

Configuration items

- In From Domain, specify the domain part of the email (everything after the @ in the sender's email address).
- Check Advanced Settings > Use automated security (checked by default)
  - Use automated security ... A feature that specifies whether to let SendGrid handle control of the SPF/DKIM records.
- Assign to a subuser
  - If you specify a common domain part for stg and prd, uncheck this box.
    - You need to set up Domain Authentication on each of the stg and prd subusers.
  - If you specify different domain parts for stg and prd, link them to subusers.

Register the issued DNS records in your DNS.
![](https://i.imgur.com/TdlBOAQ.png)

On AWS, register the records in Route53.

Click the "Verify" button

- Note: just registering the records does not authenticate automatically; you need to click the "Verify" button!

## Creating an API Key

Switch to the subuser you created earlier.

![](https://i.imgur.com/6CEjSOJ.png)

Click "Create API Key"

![](https://i.imgur.com/1Luebo0.png)

Decide what permissions the issued API Key should have.
If you only want to send email, basically `Restricted Access` with only Full Access for Mail Send is sufficient.

![](https://i.imgur.com/oOBAOml.png)

Clicking the "Create & View" button issues the API Key.

## Configuring Email Delivery Using SendGrid in Rails

I install and use the [sendgrid-actionmailer](https://github.com/eddiezane/sendgrid-actionmailer) gem.

- Gemfile

Since it's not used in development or test, I limit it to staging and production only. Adjust this as appropriate.

```ruby
group :staging, :production do
  gem 'sendgrid-actionmailer'
end
```

- production.credentials.enc, staging.credentials.enc

  - Set the separately issued API Keys for prd and stg in the credentials.

- sconfig/environments/production.rb

```ruby
  config.action_mailer.delivery_method = :sendgrid_actionmailer
  config.action_mailer.sendgrid_actionmailer_settings = {
    api_key: Rails.application.credentials[:sendgrid_api_key]
  }
```

With the above, you're now in a state where you can send email.

From here on, we address the problem of emails not being delivered due to sender domain authentication.

# Anti-Spoofing Measures

## [DMARC Setup](https://sendgrid.kke.co.jp/blog/?p=1781)

DMARC (Domain-based Message Authentication, Reporting, and Conformance) is one of the sender domain authentication technologies. It lets the sender specify the behavior for emails that fail sender domain authentication such as SPF and DKIM.

![](https://i.imgur.com/z07TUlW.png)

It mainly has the following three roles.

1. The email sender can specify how to handle emails that fail authentication
   - You can have failed emails put into the spam mailbox, or have them rejected outright.
2. The email sender can receive authentication results from email recipients
   - You can identify senders who are spoofing your email.
3. It does not allow third-party signatures (proxy signatures)
   - Prevents emails judged to be spoofing from being received.

In other words, if you don't set up DMARC, users can unsuspectingly receive emails spoofed by third parties, and the sender has no way of knowing about it.

For the DMARC setup, register the following record.

```
_dmarc.example.com    CNAME    v=DMARC1;p=quarantine;rua=mailto:dmarc.rua@example.com
```

| _Item_         | _Value_                          | _Explain_                                                                                                              |
| -------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| v=DMARC1       | Protocol version                 | Since only version 1 exists, specify DMARC1.                                                                           |
| p=quarantine   | Policy of the DMARC record       | Specifying p=quarantine filters into spam.                                                                             |
| pct=100        | Percentage to which DMARC applies | Unless you set pct=100 or remove the pct tag, there is a risk of exposure to spoofing attacks, so remove the pct tag. |
| rua=mailto:... | Reporting URI for aggregate reports | The destination for aggregate report notifications. Confirm the notification destination with the application owner in advance. |

### When Outsourcing the Aggregate Report Email Address

If the domain where the DMARC record is configured (example.com) and the domain specified in the aggregate-report mailto (hogehoge.jp) differ,

```
_dmarc.example.com    CNAME    v=DMARC1;p=quarantine;rua=mailto:dmarc.rua@hogehoge.jp
```

you need to register the following record on the aggregate-report domain (hogehoge.jp) to indicate the relationship between the domains.

```
example.com._report._dmarc.hogehoge.jp IN TXT "v=DMARC1"
```

### Caution on Handling the p Tag

It seems best to use only p=quarantine and remove the pct tag.

- p=reject

  - If you set `p=reject`, the receiving server rejects unauthenticated emails.

- `p=quarantine` together with `pct=0~99`
  - When pct is not 100, there is a possibility of being exposed to the risk of spoofing.
    Reference: https://www.valimail.com/blog/what-you-need-to-know-about-the-pct-tag-in-dmarc-records/
    > However, this can still leave your domain open to impersonation attacks until you set pct=100 or remove the pct tag entirely.
  - pct defaults to 100. By removing pct, the default of 100 is applied.

## Registering an SPF Record

### How SPF Works

SPF (Sender Policy Framework), like DMARC, is one of the sender domain authentication technologies.

You register an SPF record in the DNS that holds the domain information of the sender's email address, and the recipient can verify, based on that SPF record, whether the message was delivered from a legitimate source.

The whole mechanism by which the sender proves to the recipient "that it is not spoofing" through the above scheme is called SPF.

### Guidance for SPF Record Setup in SendGrid

When you authenticate a custom domain `hogehoge.jp` with SendGrid Domain Authentication and send email, looking at the Return-Path in Gmail's source and similar, you'll see that a subdomain like `em1234.hogehoge.jp` has been appended.

Because the domain set in From, `hogehoge.jp`, and the envelope From, `em1234.hogehoge.jp`, differ, Sender ID and docomo's proprietary authentication may not pass.

To address this, register the following SPF record.

```
"v=spf1 include:em1234.hogehoge.jp ~all"
```

References

- [SendGrid - I want to change the envelope From?](https://support.sendgrid.kke.co.jp/hc/ja/articles/360000226322)
- [Things to watch out for when sending from a custom domain to docomo with SendGrid](https://techracho.bpsinc.jp/baba/2018_12_16/65691)

## How to Test Whether You're Being Treated as Spam

You can use the following service to evaluate the sender email account.

https://www.mail-tester.com/

![](https://i.imgur.com/IbAz71X.png)

In the case above, if you send an email to `test-00a9mdjzu@svr1.mail-tester.com`, it will evaluate the sender.

Based on the results below, decide which items to address.

![](https://i.imgur.com/clKGETd.png)

## Summary

SendGrid has anti-spam measures, such as the Domain Authentication feature that helps map SPF/DKIM to your custom domain.

If you don't configure these appropriately, your emails may be filtered into spam or even rejected outright, so caution is needed.

Proceeding with the setup while understanding the following sender domain authentication mechanisms helped me deepen my understanding.

- SPF (Sender Policy Framework)
- DKIM (DomainKeys Identified Mail)
- DMARC (Domain-based Message Authentication, Reporting, and Conformance)

To further improve the delivery rate, I'll add any measures I notice as I go.
And I'd be grateful for any feedback.

That's all.
I hope this is helpful.
