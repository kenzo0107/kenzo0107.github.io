---
title: Restricting Access Using the CloudFront Managed Prefix List with Terraform
date: 2022-02-10
lang: en
translation_id: cloudfront-managed-prefix
permalink: en/2022/02/10/cloudfront-managed-prefix/
category: AWS
cover: https://i.imgur.com/raMMbxt.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

https://aws.amazon.com/jp/about-aws/whats-new/2022/02/amazon-cloudfront-managed-prefix-list/

VPC now supports the CloudFront managed prefix list.
This makes it possible to restrict access from CloudFront based on security group rules.

<!-- more -->

## Implementing It Right Away with Terraform

The following configuration is assumed.

```
CloudFront-->ALB
```

In the security group attached to the ALB, we allow only the CloudFront managed prefix list ID.

```
# Retrieve the CloudFront managed prefix list
data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}

resource "aws_security_group" "lb_app" {
  ...
}

resource "aws_security_group_rule" "lb_app_https" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  prefix_list_ids   = [data.aws_ec2_managed_prefix_list.cloudfront.id]
  security_group_id = aws_security_group.lb_app.id
}

resource "aws_lb" "app" {
  security_groups = [aws_security_group.lb_app.id]
  ...
}
```

We were able to allow access from CloudFront based on security group rules.

<!-- more -->

## How to Retrieve the CloudFront Prefix List

I went through some trial and error to figure out which implementation is the correct way to retrieve the prefix list.

To get straight to the point, I went with [data "ec2_managed_prefix_list"](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/ec2_managed_prefix_list).

It is specified as `com.amazonaws.global.cloudfront.origin-facing` in every region, so it makes the configuration flexible against region changes.

```
data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}
```

You can also retrieve it by directly specifying the ID with `data "aws_prefix_list"` as shown below,
but the value differs per region, so it cannot be used when the region is changed.

```
data "aws_prefix_list" "cloudfront" {
  prefix_list_id = "pl-58a04531"
}
```

When specifying it by name as below, it resulted in an error.

```
data "aws_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}
```

The error message:

```
Error: no matching prefix list found; the prefix list ID or name may be invalid or not exist in the current region
```

Reference: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/prefix_list#name

When specifying a filter, the number of steps also increases.

I concluded that `data "aws_ec2_managed_prefix_list"`, which requires a simple implementation, is the best choice.
https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/prefix_list#filter

## Making It More Secure

This is a bit of a tangent from controlling access with the CloudFront managed prefix list, but
it is even more secure to restrict access by domain name using WAF or an ALB listener rule.

If you write the code for both app and admin in a single repository and
you do not place any particular restrictions on routing,
there is a possibility of being able to access it over the internet as follows.

```
curl -H "Host: admin.example.com" https://example.com/login
```

To prevent processing like the above,
in the following configuration the ALB listener rule sets the default action to display a maintenance page,
and routes to the backend only when the specified domain name is matched.

```
resource "aws_cloudfront_distribution" "app" {
  aliases = [
    "example.com",
  ]
  ...
}
resource "aws_lb_listener" "app_https" {
  load_balancer_arn = aws_lb.app.arn
  ...

  # Maintenance screen
  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/html"
      message_body = file("${path.module}/files/503.html")
      status_code  = "503"
    }
  }

  depends_on = [aws_lb_target_group.app]
}

resource "aws_lb_listener_rule" "app_listener_https_host" {
  listener_arn = aws_lb_listener.app_https.arn
  ...

  condition {
    host_header {
      # NOTE: control by domain name
      values = [
        "example.com",
      ]
    }
  }
}
```

In addition to ensuring that access is only possible via CloudFront,
adding an access restriction by domain name on top of that
lets you avoid unintended routing from CloudFront even further.

## Conclusion

Previously, we adopted a mechanism that put a value in a CloudFront custom header
and verified that value with the ALB's WAF,
but we were able to make the implementation simpler.

Since this effectively becomes security-group-rule-based authorization,
I felt it also made it easier to migrate from an ALB-only setup to a CloudFront + ALB configuration.

This is a welcome update ♪

That's all.
I hope you find it helpful.
