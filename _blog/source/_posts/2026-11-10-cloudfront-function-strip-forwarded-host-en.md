---
title: Stopping Host Spoofing via X-Forwarded-Host with a CloudFront Function
date: 2026-11-10
lang: en
translation_id: cloudfront-function-strip-forwarded-host
permalink: en/2026/11/10/cloudfront-function-strip-forwarded-host/
cover: /img/cover/2026-11-10-cloudfront-function-strip-forwarded-host.svg
categories:
- [AWS]
- [Terraform]
tags:
- AWS
- CloudFront
- CloudFront Functions
- AWS WAF
- ALB
- Rails
- Sentry
- Terraform
- Security
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

As part of our security hardening work, I set up a CloudFront Function (viewer request) that **deletes client-supplied forwarding headers such as `X-Forwarded-Host` and `Forwarded: host=` so they never reach the origin**.

Blocking them outright could have broken legitimate traffic, so I first added a **COUNT rule** to the CloudFront WAF, measured the traffic, and only rolled out the fix after confirming there was no impact. This post also covers three related changes: blocking requests that carry `CloudFront-Viewer-Address` on a separate entry point that didn't go through CloudFront, checking an origin verification header on the ALB, and keeping that header out of Sentry.

※ This post reflects the state as of **November 10, 2026**. I checked the Rails, Rack, and sentry-ruby behavior described here against the source of the versions we were running at the time (Rails 8.1.4 / Rack 3.2.6 / sentry-ruby 7.0.0).

<!-- more -->

## Conclusion

| Item | Details |
| --- | --- |
| Risk | `X-Forwarded-Host` and similar headers can rewrite `request.host`, which can lead to poisoned password-reset URLs, cache poisoning, or bypassing Host-based routing |
| Measurement | Added a COUNT rule to the CloudFront WAF to confirm that legitimate traffic doesn't send `X-Forwarded-Host` / `Forwarded: host=` (the other 3 headers were not measured) |
| Fix | A CloudFront Function (viewer request) deletes five forwarding headers |
| Out of scope | CloudFront Functions can't touch `X-Forwarded-Proto`. Rails overrides it with `assume_ssl` |
| Related measures | Block `CloudFront-Viewer-Address` on the WAF of the entry point that bypasses CloudFront / verify an origin header on the ALB / don't send that header to Sentry |

## Background: Host spoofing via forwarding headers

Apps behind a reverse proxy often treat headers like `X-Forwarded-Host` as "the Host of the original request". If the proxy doesn't overwrite or strip that header, **whatever value the client sends reaches the app unchanged, so the client can spoof the Host the app sees**.

These are the commonly known risks ([PortSwigger: HTTP Host header attacks](https://portswigger.net/web-security/host-header)):

- **Password reset poisoning**: if you build URLs for emails from `request.host`, a legitimate email can arrive with a link to the attacker's domain
- **Web cache poisoning**: a response containing a URL built from the Host gets cached and served to other users
- **Bypassing Host-based routing**: if one app routes several domains by Host, a request can end up in the routes meant for another domain (such as an internal one)

In Rails, `raw_host_with_port`, which `request.host` is built from, uses `X-Forwarded-Host` first ([action_dispatch/http/url.rb (v8.1.4)](https://github.com/rails/rails/blob/v8.1.4/actionpack/lib/action_dispatch/http/url.rb)).

```ruby
def raw_host_with_port
  if forwarded = x_forwarded_host.presence
    forwarded.split(/,\s?/).last
  else
    get_header("HTTP_HOST") || "#{server_name}:#{get_header('SERVER_PORT')}"
  end
end
```

Rails' `request.host` ignores the `Forwarded` header, but Rack's `Rack::Request` defaults to `forwarded_priority = [:forwarded, :x_forwarded]`, so it reads `Forwarded` before `X-Forwarded-*` ([rack/request.rb (v3.2.6)](https://github.com/rack/rack/blob/v3.2.6/lib/rack/request.rb)). When I tried it with the check script, `X-Forwarded-Host` did rewrite Rails' `request.host`, while `Forwarded: host=` did not. Rather than trace which middleware reads which header, I decided it was safer to **keep both from reaching the origin**.

The stack is CloudFront → ALB → Rails. The CloudFront origin request policy forwards all viewer headers, so a client-supplied `X-Forwarded-Host` went all the way to Rails. The ALB docs list three `X-Forwarded-*` headers, `X-Forwarded-For`, `X-Forwarded-Proto`, and `X-Forwarded-Port`, and `X-Forwarded-Host` is not among them ([HTTP headers and Application Load Balancers](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/x-forwarded-headers.html)).

## How each header is handled

I listed every forwarding header and decided which ones to delete.

| Header | How the app uses it | Decision |
| --- | --- | --- |
| `X-Forwarded-Host` | Rails `request.host` | Delete |
| `Forwarded` | Rack reads host / proto / for from it | Delete |
| `X-Forwarded-Scheme` | Rack uses it to work out the scheme | Delete |
| `X-Forwarded-Ssl` | Rack uses it to work out the scheme | Delete |
| `X-Forwarded-Port` | Used to work out the port (the ALB sets it) | Delete |
| `X-Forwarded-Proto` | Used to work out the scheme | Out of scope because CloudFront Functions can't touch it. Overridden by Rails `assume_ssl` |
| `X-Forwarded-For` | Used to compute `remote_ip` | Keep (used on the assumption that CloudFront / ALB append to it) |

`X-Forwarded-Proto` is on the **Disallowed headers** list for CloudFront edge functions, so a function can neither read nor add it ([Restrictions on all edge functions](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/edge-function-restrictions-all.html)).

> The following HTTP headers are not exposed to edge functions, and functions can't add them.

So I left it to `config.assume_ssl = true` on the Rails side. `ActionDispatch::AssumeSSL` is a middleware that overwrites `HTTP_X_FORWARDED_PROTO` with `https` and `HTTP_X_FORWARDED_PORT` with `443` ([assume_ssl.rb (v8.1.4)](https://github.com/rails/rails/blob/v8.1.4/actionpack/lib/action_dispatch/middleware/assume_ssl.rb)).

## Measuring first with a WAF COUNT rule

The data I had couldn't show that legitimate callers (mobile apps, integration partners, and so on) never send these headers. We don't keep normal ALLOW entries in the WAF logs, and ALB / CloudFront access logs don't record arbitrary request headers.

So I added a **COUNT rule** to the WAF attached to CloudFront. I gave it a low priority number so it is evaluated before any allow rule can end evaluation.

I only measured the two headers used to determine the Host: `X-Forwarded-Host` (Rails) and `Forwarded: host=` (Rack). Deleting `X-Forwarded-Scheme`, `X-Forwarded-Ssl`, or `X-Forwarded-Port` only means the scheme and port come from CloudFront, the ALB, and `assume_ssl`, so legitimate traffic behaves the same even if it sends them. That's why I left them out of the measurement.

```hcl
rule {
  name     = "count-host-override-headers"
  priority = 5

  action {
    count {}
  }

  statement {
    or_statement {
      statement {
        size_constraint_statement {
          comparison_operator = "GT"
          size                = 0

          field_to_match {
            single_header {
              name = "x-forwarded-host"
            }
          }

          text_transformation {
            priority = 0
            type     = "NONE"
          }
        }
      }

      statement {
        byte_match_statement {
          positional_constraint = "CONTAINS"
          search_string         = "host="

          field_to_match {
            single_header {
              name = "forwarded"
            }
          }

          text_transformation {
            priority = 0
            type     = "LOWERCASE"
          }
        }
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "count-host-override-headers"
    sampled_requests_enabled   = true
  }
}
```

The WAF logging filter was already set to keep only BLOCK and COUNT, so the counted requests showed up in the logs with no extra setup ([Finding your protection pack (web ACL) records](https://docs.aws.amazon.com/waf/latest/developerguide/logging-management.html)).

```hcl
resource "aws_wafv2_web_acl_logging_configuration" "app" {
  resource_arn            = aws_wafv2_web_acl.app.arn
  log_destination_configs = [aws_cloudwatch_log_group.waf_app.arn]

  logging_filter {
    default_behavior = "DROP"

    filter {
      behavior    = "KEEP"
      requirement = "MEETS_ANY"

      condition {
        action_condition {
          action = "BLOCK"
        }
      }

      condition {
        action_condition {
          action = "COUNT"
        }
      }
    }
  }
}
```

I did the aggregation in CloudWatch Logs Insights.

```
fields @timestamp, httpRequest.clientIp, httpRequest.uri
| filter @message like /count-host-override-headers/
| stats count(*) by httpRequest.clientIp
| sort count(*) desc
```

I also wrote a check script that requests the same URL with and without the headers and compares the responses (status code and `Location`). It fails while the responses differ, which is the case before the fix, and passes once they match.

```console
$ curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://www.example.com/
$ curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' -H 'X-Forwarded-Host: other.example.com' https://www.example.com/
$ curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' -H 'Forwarded: host=other.example.com' https://www.example.com/
```

### Why I shipped before the measurement period ended

The original plan was to measure for a fixed period before rolling out the fix. Once measurement started in production, though, the only matches up to the next day came from my own check script. I found none from legitimate traffic.

Also, the length of that period had been chosen on the assumption that we would **BLOCK in WAF**. This fix only deletes headers and never stops a request. Even if legitimate traffic did send one of these headers, the request would just be handled with the Host CloudFront received. The impact was small and leaving the hole open was the bigger risk, so I moved the rollout forward.

## Deleting forwarding headers with a CloudFront Function

A viewer request CloudFront Function deletes the headers. The function itself is very short.

```js
function handler(event) {
  const request = event.request;
  const headers = request.headers;

  delete headers["x-forwarded-host"];
  delete headers["forwarded"];
  delete headers["x-forwarded-scheme"];
  delete headers["x-forwarded-ssl"];
  delete headers["x-forwarded-port"];

  return request;
}
```

```hcl
resource "aws_cloudfront_function" "strip_forwarded_headers" {
  name    = "strip-forwarded-headers"
  runtime = "cloudfront-js-2.0"
  comment = "Strip client-supplied forwarding headers before sending to the origin"
  publish = true
  code    = file("${path.module}/files/strip_forwarded_headers.js")
}

resource "aws_cloudfront_distribution" "app" {
  # ...

  default_cache_behavior {
    # ...

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.strip_forwarded_headers.arn
    }
  }
}
```

Header names are converted to lowercase in the CloudFront Functions event, so deleting the lowercase keys is enough ([CloudFront Functions event structure](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/functions-event-structure.html)). I also ran the function under a local node and confirmed that only those five headers were removed, while `host`, `x-forwarded-for`, and `cloudfront-viewer-address` stayed.

### Caveat: one viewer request function per behavior

A cache behavior can have **only one edge function per event type** ([Restrictions on all edge functions](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/edge-function-restrictions-all.html)).

> Each event type (viewer request, origin request, origin response, and viewer response) can have only one edge function association.

If a behavior already has a viewer request function, such as JWT verification, you can't attach this one too. In that case you have to **add the same deletion logic to the existing function**. The logic then lives in two places, so I put a NOTE in both files saying "update the other one too" so nobody fixes only one of them.

### Why I didn't use allExcept in the origin request policy

I also considered skipping the function and excluding the headers with `allExcept` in the origin request policy, but decided against it.

`allExcept` means "forward all viewer headers except the listed ones". The listed headers are used as the exclusion list, so there is no way to also include headers that CloudFront adds, such as `CloudFront-Viewer-Address`. The option that forwards all viewer headers plus CloudFront headers is `allViewerAndWhitelistCloudFront` ([OriginRequestPolicyHeadersConfig](https://docs.aws.amazon.com/cloudfront/latest/APIReference/API_OriginRequestPolicyHeadersConfig.html)). The app uses `CloudFront-Viewer-Address` as the client IP, so switching to `allExcept` would stop that header from arriving.

### Keeping the WAF COUNT rule

I kept the COUNT rule in place after the fix, in the hope that attempts are still recorded. The docs state explicitly that WAF rules are evaluated before viewer request functions, but only for Lambda@Edge ([How Lambda@Edge works with requests and responses](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-edge-event-request-response.html)).

> If you're using AWS WAF, the Lambda@Edge viewer request is executed after any AWS WAF rules are applied.

I couldn't find the same statement for CloudFront Functions in the official docs, so whether WAF is evaluated before the function is unverified.

## Blocking CloudFront-Viewer-Address on an entry point that bypasses CloudFront

The app is configured to trust the `CloudFront-Viewer-Address` value as the client IP (`remote_ip`). Through CloudFront that is fine, because CloudFront sets the value. On an **separate entry point that didn't go through CloudFront (at the time)**, a client can spoof `remote_ip` just by sending that header. That would make the IPs in logs and login records unreliable, so I added a rule to that ALB's WAF that blocks any request carrying the header.

```hcl
rule {
  name     = "block-cloudfront-viewer-address"
  priority = 5

  action {
    block {}
  }

  statement {
    size_constraint_statement {
      comparison_operator = "GT"
      size                = 0

      field_to_match {
        single_header {
          name = "cloudfront-viewer-address"
        }
      }

      text_transformation {
        priority = 0
        type     = "NONE"
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "block-cloudfront-viewer-address"
    sampled_requests_enabled   = true
  }
}
```

This entry point doesn't go through CloudFront, so legitimate traffic never carries this header. That's why I skipped COUNT here and went straight to BLOCK.

## Verifying an origin header on the ALB

Stripping headers in CloudFront doesn't help if the ALB can be reached by something other than CloudFront. Restricting the ALB security group to the CloudFront managed prefix list isn't enough, because that list covers all of CloudFront's IP ranges and **can't tell your distribution apart from anyone else's**.

Following the approach in the AWS docs, I added a **custom header** to the CloudFront origin and made the ALB listener rule check its value ([Restrict access to Application Load Balancers](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/restrict-access-to-load-balancer.html)).

```hcl
locals {
  origin_verify_header = "X-Origin-Check"
}

resource "random_password" "origin_verify" {
  length  = 64
  special = false

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_cloudfront_distribution" "app" {
  # ...

  origin {
    origin_id   = "alb-app"
    domain_name = aws_lb.app.dns_name

    custom_header {
      name  = local.origin_verify_header
      value = random_password.origin_verify.result
    }

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
}

resource "aws_lb_listener_rule" "app" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }

  condition {
    host_header {
      values = ["www.example.com"]
    }
  }

  condition {
    http_header {
      http_header_name = local.origin_verify_header
      values           = [random_password.origin_verify.result]
    }
  }

  # NOTE: If the listener rule changes before CloudFront starts sending the header, legitimate traffic is rejected too,
  #       so wait for the distribution update to finish before changing it
  depends_on = [aws_cloudfront_distribution.app]
}
```

The listener's default action returns a fixed response, so requests without the matching header never reach the app. The docs use 403 in their example; I kept the existing 404 fixed response.

Operational points I watched for:

- **Apply order**: if the listener rule changes before CloudFront starts sending the header (that is, before the edges finish updating), legitimate traffic gets rejected too. `depends_on` makes the listener rule wait until the distribution update completes (`wait_for_deployment`)
- **Removal order**: to remove it, delete the listener rule condition and apply first, then remove the custom_header. If you remove both in one apply, CloudFront drops the header first and legitimate traffic is rejected until the edges catch up
- **Preventing recreation**: if `random_password` is recreated, traffic is rejected for the same reason, so it has `prevent_destroy`
- **Rotation**: allow a window where both values are accepted. The documented procedure adds a second header and switches over to it; I kept the same header name instead: put both old and new values in the listener rule's `values` → switch CloudFront to the new value → remove the old one
- **What plan shows**: because a sensitive value is involved, later plans show the whole CloudFront `origin` block and the whole listener rule `condition` as `(sensitive value)`, so you can't see what's in them. Reviewers need to know this
- **Where the value lives**: the value stays in Terraform state and in the CloudFront configuration. Anyone with access to the state or the `GetDistributionConfig` permission can read it

If you can make the ALB internal and connect it through a CloudFront **VPC origin**, there is no path from the internet to the ALB at all, which is the cleaner setup ([Restrict access with VPC origins](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-vpc-origins.html)).

※ Later, I replaced this ALB with a CloudFront VPC origin + internal ALB setup, and retired both this header check and the entry point that bypassed CloudFront. The details are in [the post on CloudFront VPC origins and ECS native Blue/Green](/en/2026/11/10/cloudfront-vpc-origin-ecs-native-blue-green/).

## Keeping the secret header out of Sentry

This one is easy to miss: **the origin verification header reaches Rails**. If Sentry attaches request headers to error events, the secret value gets sent to your error tracker.

sentry-ruby 7.0.0 deprecated `send_default_pii` and introduced a more granular `data_collection` setting ([CHANGELOG (7.0.0)](https://github.com/getsentry/sentry-ruby/blob/7.0.0/CHANGELOG.md)). Request headers use `:deny_list` mode, and the value of any header whose name matches `terms` is replaced with `[Filtered]`.

Reading the source ([key_value_collection.rb (7.0.0)](https://github.com/getsentry/sentry-ruby/blob/7.0.0/sentry-ruby/lib/sentry/data_collection/key_value_collection.rb)), the matching works like this:

- The header name is lowercased and each word in `terms` is matched as a **substring**
- Separately from `terms`, names containing `auth`, `token`, `secret`, `key`, `cookie`, and similar words are always filtered (`SENSITIVE_DENY_LIST`)
- If you don't configure `data_collection` and `send_default_pii = false`, `terms` is backfilled with `PII_HEADER_SNIPPETS` (`forwarded -ip _ip remote via _user -user`) ([data_collection.rb (7.0.0)](https://github.com/getsentry/sentry-ruby/blob/7.0.0/sentry-ruby/lib/sentry/data_collection.rb))

The header name I used matches neither list, so by default its value would be sent as-is. I added it to `terms`.

```ruby
Sentry.init do |config|
  config.data_collection.http_headers.request.mode = :deny_list
  # NOTE: The origin verification header is a secret added by CloudFront, so don't send it
  config.data_collection.http_headers.request.terms =
    Sentry::DataCollection::PII_HEADER_SNIPPETS + %w[x-origin-check]
end
```

A spec checks it, so we'd notice if the setting were ever removed.

```ruby
RSpec.describe "Sentry data collection" do
  it "excludes the origin verification header from request headers" do
    terms = Sentry.configuration.data_collection.http_headers.request.terms

    expect(terms).to include("forwarded", "-ip", "_ip", "x-origin-check")
  end
end
```

The plan was to **release this Rails change first** and only then apply the ALB / CloudFront changes. In the reverse order, any error raised between the apply and the release would ship the value to Sentry. In practice, though, the ALB / CloudFront changes were applied to production a few hours before the Rails production release. I think it's worth making that prerequisite order part of the checks done before approving the apply.

Putting `secret` or `token` in the header name would trigger sentry-ruby's always-on filter, but an explicit exclusion makes the intent clearer than relying on that. And this isn't limited to Sentry: anywhere you dump all request headers into logs or an APM has the same problem, so check those too.

## Summary

- Clients can set `X-Forwarded-Host` / `Forwarded` freely. Unless the proxy does something about it, `X-Forwarded-Host` lets them spoof Rails' `request.host`, and Rack also treats `Forwarded` as the Host
- Instead of blocking right away, I used a WAF COUNT rule to confirm that legitimate traffic doesn't send the Host-determining headers `X-Forwarded-Host` / `Forwarded: host=`, then rolled out the fix
- The fix only deletes headers and never stops requests, so its impact was small and I could ship it early
- A CloudFront Function (viewer request) deletes five forwarding headers. Functions can't touch `X-Forwarded-Proto`, so Rails' `assume_ssl` handles it
- A behavior gets only one viewer request function, so behaviors that already have one need the same logic added to that function
- On the entry point that bypasses CloudFront, WAF blocks requests carrying `CloudFront-Viewer-Address`
- The ALB checks an origin verification header, and I excluded that secret from Sentry

I hope this helps.

## References

- [PortSwigger: HTTP Host header attacks](https://portswigger.net/web-security/host-header)
- [Restrictions on all edge functions](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/edge-function-restrictions-all.html)
- [CloudFront Functions event structure](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/functions-event-structure.html)
- [How Lambda@Edge works with requests and responses](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-edge-event-request-response.html)
- [OriginRequestPolicyHeadersConfig](https://docs.aws.amazon.com/cloudfront/latest/APIReference/API_OriginRequestPolicyHeadersConfig.html)
- [Add CloudFront request headers](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/adding-cloudfront-headers.html)
- [Restrict access to Application Load Balancers](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/restrict-access-to-load-balancer.html)
- [Restrict access with VPC origins](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-vpc-origins.html)
- [HTTP headers and Application Load Balancers](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/x-forwarded-headers.html)
- [Finding your protection pack (web ACL) records](https://docs.aws.amazon.com/waf/latest/developerguide/logging-management.html)
- [rails/rails: action_dispatch/http/url.rb (v8.1.4)](https://github.com/rails/rails/blob/v8.1.4/actionpack/lib/action_dispatch/http/url.rb)
- [rails/rails: action_dispatch/middleware/assume_ssl.rb (v8.1.4)](https://github.com/rails/rails/blob/v8.1.4/actionpack/lib/action_dispatch/middleware/assume_ssl.rb)
- [rack/rack: lib/rack/request.rb (v3.2.6)](https://github.com/rack/rack/blob/v3.2.6/lib/rack/request.rb)
- [getsentry/sentry-ruby: key_value_collection.rb (7.0.0)](https://github.com/getsentry/sentry-ruby/blob/7.0.0/sentry-ruby/lib/sentry/data_collection/key_value_collection.rb)
- [getsentry/sentry-ruby: data_collection.rb (7.0.0)](https://github.com/getsentry/sentry-ruby/blob/7.0.0/sentry-ruby/lib/sentry/data_collection.rb)
