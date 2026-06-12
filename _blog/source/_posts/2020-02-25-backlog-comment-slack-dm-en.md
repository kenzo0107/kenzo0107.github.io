---
title: Sending a Slack DM to the "Users to Notify" When a Comment Is Added in Backlog
category: Go
tags:
  - Go
date: 2020-02-25
lang: en
translation_id: backlog-comment-slack-dm
permalink: en/2020/02/25/backlog-comment-slack-dm/
comments: true
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20200227/20200227215819.png
---

I built an AWS Serverless Application Model project with Golang that sends a Slack DM to the "users to notify" when a comment is added in Backlog. ♪

<!-- more -->

For how to use it, please take a look at the Git project!

[kenzo0107/backlog-to-slack-dm](https://github.com/kenzo0107/backlog-to-slack-dm)

If anything is unclear, feel free to reach out. ♪

### Points Considered During Development

#### Are there any SDKs related to the Backlog API out there?

[griffin-stewie/go-backlog](https://github.com/griffin-stewie/go-backlog) seemed to have everything in place, so I gave it a try.

The parts I wanted to use are the following:

- The `type Activity struct` that receives event information when a comment is added
- Executing the API that retrieves the email address from the ID of the user to be notified, obtained from the above

However, in this library, [the `Notifications` field in `Activity`, which contains the information I wanted to notify on, was commented out](https://github.com/griffin-stewie/go-backlog/blob/master/models.go#L242), so I couldn't use it as is.

Since I was pressed for time, I forked it and handled it in [kenzo0107/go-backlog](https://github.com/kenzo0107/go-backlog).

Simply uncommenting it wasn't enough to make it work — it raised an error during `json.Unmarshal`, so I had to handle some other parameters as well.

#### How should access control from Backlog be handled?

There was a mention of Basic authentication for access control from Backlog, so I went with Basic authentication.

> If you want a method that isn't affected by IP address changes, you can add Basic authentication to the Webhook URL to achieve authentication that doesn't depend on the IP address.

[Please tell me the IP address of the Webhook sending server](https://support-ja.backlog.com/hc/ja/articles/360035645534-Webhook-%E3%82%B5%E3%83%BC%E3%83%90%E3%81%AE%E6%83%85%E5%A0%B1)

The IP range may change without notice, and it might be hard for anyone other than the creator to notice. For that reason, I embedded the Basic authentication credentials into the URL set in the Backlog Webhook, like `https://<user>:<password>@......`.

I had this authenticated with API Gateway + a Lambda Authorizer (Request Type).

#### What about the IPs to allow when executing the Backlog API?

By placing the Lambda that executes the Backlog API in a Private Subnet routed through a NAT Gateway, I fixed the egress IP, and set that IP as an allowed IP on the Backlog side.

### Caveats

#### Backlog Webhooks must be configured per project

It wasn't possible to configure all projects at once. (As of 2020-02-27)

I handled this by notifying each project administrator of the credentials as confidential information.

## Summary

There are still some areas where I haven't fully written tests, but I've confirmed that it works without issues.

I hope this is helpful in some way to those who use Backlog.

That's all.
