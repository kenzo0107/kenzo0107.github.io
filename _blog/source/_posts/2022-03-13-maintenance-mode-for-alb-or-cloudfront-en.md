---
title: Switching to Maintenance Mode with AWS ALB / CloudFront
date: 2022-03-13
lang: en
translation_id: maintenance-mode-for-alb-or-cloudfront
permalink: en/2022/03/13/maintenance-mode-for-alb-or-cloudfront/
category: AWS
cover: https://i.imgur.com/IwHAByw.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

This post summarizes how to switch to maintenance mode when ALB or CloudFront sits in front as the interface.

<!-- more -->

---

## For ALB

```
resource "aws_lb" "app" {
  ...
}

resource "aws_lb_target_group" "app" {
  # We prepare blue/green target groups for deploying the ECS Service via CodeDeploy.
  for_each = toset(["blue", "green"])
  ...
}

resource "aws_lb_listener" "app" {
  load_balancer_arn = aws_lb.app.arn
  ...

  # The default action returns a 404 error
  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      status_code  = "404"
    }
  }
}

# NOTE: In maintenance mode, route only internal IPs
resource "aws_alb_listener_rule" "app_routing_in_maintenance" {
  count = var.maintenance_mode ? 1 : 0

  listener_arn = aws_alb_listener.app.arn
  priority     = 10

  action {
    # Specify the Target Group ARN bound to the ECS Service
    target_group_arn = element(aws_ecs_service.app.load_balancer[*].target_group_arn, 0)
    type             = "forward"
  }

  condition {
    # NOTE: Control by domain name
    host_header {
      values = [
        "example.com",
      ]
    }
  }

  # Make sure only internal IPs can still access even during maintenance
  condition {
    source_ip {
      values = office_ips
    }
  }

  # NOTE: Ignore the parts changed by Blue/Green Deployment via CodeDeploy
  lifecycle {
    ignore_changes = [
      action,
    ]
  }
}

# NOTE: In maintenance mode, return a fixed 503 response.
resource "aws_alb_listener_rule" "app_listener_https_maintenance" {
  count = var.maintenance_mode ? 1 : 0

  listener_arn = aws_alb_listener.app.arn
  priority     = 20

  action {
    type = "fixed-response"

    fixed_response {
      status_code  = "503"
      content_type = "application/json"
      message_body = jsonencode(
        {
          code = "service_unavailable"
          hint = "現在メンテナンス中です。"
        }
      )
    }
  }

  condition {
    # NOTE: Control by domain name
    host_header {
      values = [
        "example.com",
      ]
    }
  }
}

resource "aws_lb_listener_rule" "app_listener_https_host" {
  listener_arn = aws_lb_listener.app_https.arn
  priority     = 100

  action {
    target_group_arn = aws_lb_target_group.app["blue"].arn
    type             = "forward"
  }

  condition {
    host_header {
      # NOTE: Control by domain name
      values = [
        "example.com",
      ]
    }
  }

  # NOTE: Ignore the parts changed by Blue/Green Deployment via CodeDeploy
  lifecycle {
    ignore_changes = [
      action,
    ]
  }
}
```

- When maintenance mode is enabled, only internal IPs can connect to the server, and all other requests get a 503.
- When maintenance mode is disabled, the rules above are removed.
- The maintenance response is returned as application/json because it assumes communication with a native application. You can also choose text/html and so on.

Reference: https://docs.aws.amazon.com/ja_jp/elasticloadbalancing/latest/application/load-balancer-limits.html

### Why var.maintenance_mode is used to toggle maintenance mode

Managing maintenance_mode outside of the Terraform that manages the ALB resources has the benefit of letting you manage maintenance toggling and resource updates on separate lifecycles.

For example, the intended usage is as follows:

1. Set maintenance_mode = true on Terraform Cloud and run `terraform apply` to enter maintenance mode
2. Apply infrastructure changes with Terraform

### Why the ALB default action is set to 404

This strays a bit from the maintenance topic, but the reason is that we want to disallow requests to anything other than the specified domain.

Allowing access via a direct IP address or via the ALB domain name is, in my understanding, undesirable both for security and for SEO.

## For CloudFront

```
resource "aws_wafv2_web_acl" "cloudfront_app" {
  ...
  scope = "CLOUDFRONT"

  custom_response_body {
    content = jsonencode(
      {
        code = "service_unavailable"
        hint = "現在システムのメンテナンス中です。"
      }
    )
    content_type = "APPLICATION_JSON"
    key          = "maintenance"
  }

  default_action {
    allow {}
  }

  # Block when the request does not match an allowed IP
  dynamic "rule" {
    for_each = var.maintenance_mode ? ["1"] : []
    content {
      ...
      priority = 10

      # Return the maintenance response when blocking
      action {
        block {
          custom_response {
            custom_response_body_key = "maintenance"
            response_code            = 503
          }
        }
      }

      statement {
        not_statement {
          statement {
            ip_set_reference_statement {
              arn = aws_wafv2_ip_set.allow_ips.arn
            }
          }
        }
      }
      ...
    }
  }

  ...
}

resource "aws_cloudfront_distribution" "app" {
  ...

  web_acl_id = aws_wafv2_web_acl.cloudfront_app.arn

  ...
}
```

- The WAF attached to CloudFront returns the 503 maintenance response for any request not from an allowed IP.
- Note: `custom_response_body` is supported in terraform-provider-aws>=3.67.0.

## Why the default action is set to allow {}

```
  default_action {
    allow {}
  }

  dynamic "rule" {
    ...
    content {
      statement {
        not_statement {
          statement {
            ip_set_reference_statement {
              arn = aws_wafv2_ip_set.allow_ips.arn
            }
          }
        }
      }
```

This also strays from the maintenance topic, but the reason is that we want to unify the default action across the production and staging environments.

A configuration like the following is sometimes seen:

- Production environment → `default_action { allow {} }`
- Staging environment → `default_action { block {} }`

When the default action differs per environment, an added rule can unintentionally block or allow requests, leading to accidents. Unifying it is one measure to prevent that, and is the better choice.

## Summary

We were able to implement maintenance methods that leverage the characteristics of each resource.

- ALB uses listener rules
- CloudFront uses WAF

If you want a richer maintenance page, routing to S3 is also a good option.

That's all.
I hope you find this helpful.
