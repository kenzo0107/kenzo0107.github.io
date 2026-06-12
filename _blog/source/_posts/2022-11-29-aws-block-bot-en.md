---
title: Blocking Bots on AWS
date: 2022-11-29
lang: en
translation_id: aws-block-bot
permalink: en/2022/11/29/aws-block-bot/
cover: https://i.imgur.com/I66XH5J.png
category: AWS
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

I serve a web service on AWS using CloudFront + ECS, but it gets a lot of bot traffic. When I tried to deal with it using WAF, I ran into a few snags, so this post is a memo about that.

I tried the following two approaches.

1. Block overseas IPs that bot requests originate from, using a GEO match statement in WAF v2
2. Defend against bots with WAF v2 Bot Control

<!-- more -->

## Defending with a GEO match statement in WAF v2

I blocked everything except JP (Japan).

```
resource "aws_wafv2_web_acl" "main" {
  # 日本以外をブロック
  rule {
    action {
      block {}
    }

    statement {
      not_statement {
        statement {
          geo_match_statement {
            country_codes = ["JP"]
          }
        }
      }
    }
```

Then I ran into a case where, even though the access came from within Japan, it was judged as being outside Japan and got blocked.

That happened with access from smartphones (docomo, au, softbank).

Since there were false positives, I avoided this approach.

## Defending with WAF v2 Bot Control

I tried bot protection with AWS Bot Control.

It hasn't caused any major problems so far, but let me summarize the points where I got stuck when trying to enable AWS Bot Control with Terraform.

### ManagedRuleGroupConfigs is not supported

* As of 2022-11-29 it is not supported, so you cannot configure InspectionLevel.

https://github.com/hashicorp/terraform-provider-aws/issues/23290

```
{
  "Name": "AWS-AWSManagedRulesBotControlRuleSet",
  "Statement": {
    "ManagedRuleGroupStatement": {
      "VendorName": "AWS",
      "Name": "AWSManagedRulesBotControlRuleSet",
      "ManagedRuleGroupConfigs": [
        {
          "AWSManagedRulesBotControlRuleSet": {
            "InspectionLevel": "COMMON"
          }
        }
      ],
      ...
```

### Bot Control Rules are not supported

* As of 2022-11-29

Since configuring Bot Control Rules is not supported, you need to set them manually.

![](https://i.imgur.com/I66XH5J.png)

### Override rule group action is supported

If you set the following inside the `rule {}` block, you can put it into detection mode (only count, without blocking, etc.).

```
    override_action {
      count {}
    }
```

This is already mentioned in the [issue](https://github.com/hashicorp/terraform-provider-aws/issues/23290) noted earlier, so I expect it will be supported eventually.

Be careful when using it.

### There was a daredevil who decided to just update via aws-cli with local-exec

https://github.com/hashicorp/terraform-provider-aws/issues/23287

I can't deny that there may be unintended behavior, so I want to keep everything within Terraform. I'd also rather not have to test or syntax-check a shell script.

## Overall thoughts

Even if you have configured rate limiting and other rules for SQLi and XSS, it's difficult to prevent bots when they temporarily make requests from multiple source IPs.

It would have been nice if I could have kept it down with GEO restrictions, but if a service with a lot of requests gets false positives, that alone makes it hard to use in a production environment.

The safest approach was to watch things in Bot Control's detection mode (Count) and add block settings as appropriate.

That's all.
I hope this is helpful.
