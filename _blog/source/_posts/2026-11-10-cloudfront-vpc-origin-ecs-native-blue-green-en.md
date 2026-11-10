---
title: Replacing a Public ALB Behind CloudFront with VPC Origins + an Internal ALB, and Moving to ECS Native Blue/Green
date: 2026-11-10
lang: en
translation_id: cloudfront-vpc-origin-ecs-native-blue-green
permalink: en/2026/11/10/cloudfront-vpc-origin-ecs-native-blue-green/
cover: /img/cover/2026-11-10-cloudfront-vpc-origin-ecs-native-blue-green.svg
categories:
- [AWS]
- [Terraform]
tags:
- AWS
- CloudFront
- VPC Origins
- ALB
- ECS
- Blue/Green
- CodeDeploy
- Terraform
- GitHub Actions
- Security
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

I **replaced the internet-facing ALB behind CloudFront with an internal ALB connected through CloudFront VPC origins**. Along the way, I also **moved the ECS service deployments from CodeDeploy blue/green to ECS native blue/green**.

This is **part of a security effort** to stop exposing the ALB to the internet. There were two targets, the app (member pages and mobile API) and the admin console, and for each I went stg → prd with the same sequence: build the new resources side by side, switch over, then delete the old ones. Rebuilding the ALB and changing the deployment method at the same time comes with a few things to watch out for, so I'm writing them down as a memo.

<!-- more -->

## Conclusion

| Item | Details |
| --- | --- |
| Goal | Make the ALB unreachable from the internet so that CloudFront is the single entry point |
| New architecture | CloudFront → VPC origin → internal ALB (private subnets) → ECS (ECS native blue/green) |
| Removed | Origin verification header (`X-Origin-Check`), allowing the CloudFront managed prefix list, CodeDeploy applications and deployment groups |
| Approach | Build the new ALB and service side by side → switch the CloudFront origin (or DNS) → disable deletion protection → delete the old resources |
| Service migration | I prepared a rehearsal for moving the existing service via UpdateService but didn't adopt it; instead I **created new services that use ECS native blue/green from the start** |
| Gotchas | `internal` can't be changed after the ALB is created / CloudFront's origin response timeout tops out at 120 seconds by default / the service name in the deploy workflow has to switch in sync with the infrastructure work |

## The old architecture and its problems

The old setup looked like this:

- The ALB was internet-facing in public subnets
- Its SG only allowed 443 from the CloudFront managed prefix list (`com.amazonaws.global.cloudfront.origin-facing`)
- On its own that **also lets other people's CloudFront distributions reach the ALB**, so a custom header `X-Origin-Check` was added to the CloudFront origin and checked in the ALB listener rule (I also touched on this header check in [a related post](/en/2026/11/10/cloudfront-function-strip-forwarded-host/))
- The prd app and admin console were deployed with CodeDeploy blue/green (stg had already moved to ECS native blue/green)

Header verification is the standard way to force traffic through CloudFront, but in the end the ALB itself is still public. The SG drops traffic that doesn't come from CloudFront, but if someone sets the ALB DNS name as the origin of their own distribution, the request still reaches the ALB, and you have to keep managing the header value as a secret.

## What CloudFront VPC origins are

This is described in [Restrict access with VPC origins](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-vpc-origins.html): a feature that lets CloudFront **use an ALB / NLB / EC2 instance in a private subnet directly as an origin**.

> VPC origins is designed to enhance the security posture of your application by placing your load balancers and EC2 instances in private subnets, making CloudFront the single point of entry.

The docs give two options for what the ALB SG should allow:

- Option 1: the CloudFront managed prefix list
- Option 2: the service-managed SG CloudFront creates automatically when you create a VPC origin (`CloudFront-VPCOrigins-Service-SG`)

> This configuration is further restrictive as it restricts the traffic only to your CloudFront distributions.

I **went with Option 2**, because the prefix list also covers CloudFront in other accounts. With this SG as the source, only your own distributions can connect, so header verification with `X-Origin-Check` is no longer needed.

The same page lists the other prerequisites:

- The VPC has an internet gateway (it isn't used for routing)
- The private subnet has free IP addresses (CloudFront creates a service-managed ENI)
- gRPC and Lambda@Edge origin request / origin response triggers aren't supported

## Why I didn't just make the existing ALB internal

An ALB's `internal` setting (scheme) **can't be changed after creation**. I confirmed in [load_balancer.go](https://github.com/hashicorp/terraform-provider-aws/blob/main/internal/service/elbv2/load_balancer.go) that `internal` is `ForceNew` in Terraform's `aws_lb` too. Flipping it to `internal = true` means destroy → create, and the service goes down in between.

So I built a new internal ALB alongside, switched over, and then deleted the old ALB. A new ALB also means new target groups, which runs into the CodeDeploy constraint described below.

## Before / After

```
Before:
  Users → CloudFront ──(HTTPS + X-Origin-Check)──> ALB (internet-facing, public subnet)
                                                    └─(listener rule checks the header)─> ECS (CodeDeploy B/G)

After:
  Users → CloudFront → VPC origin ──(HTTPS)──> ALB (internal, private subnet)
                                               └─(weighted forward blue/green)─> ECS (ECS native B/G)
```

## The new ALB and VPC origin

The ALB SG only accepts 443 from `CloudFront-VPCOrigins-Service-SG`, and egress is limited to the ECS task port.

```hcl
data "aws_security_group" "cloudfront_vpc_origins" {
  name   = "CloudFront-VPCOrigins-Service-SG"
  vpc_id = var.vpc_id
}

resource "aws_security_group" "alb" {
  name   = "example-alb"
  vpc_id = var.vpc_id
}

resource "aws_vpc_security_group_ingress_rule" "alb_from_cloudfront" {
  security_group_id            = aws_security_group.alb.id
  from_port                    = 443
  to_port                      = 443
  ip_protocol                  = "tcp"
  referenced_security_group_id = data.aws_security_group.cloudfront_vpc_origins.id
}

resource "aws_vpc_security_group_egress_rule" "alb_to_ecs" {
  security_group_id            = aws_security_group.alb.id
  from_port                    = 3000
  to_port                      = 3000
  ip_protocol                  = "tcp"
  referenced_security_group_id = aws_security_group.ecs.id
}

resource "aws_lb" "app" {
  name               = "example-app-lb"
  internal           = true
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.private_subnet_ids

  enable_deletion_protection = true
  drop_invalid_header_fields = true
}

resource "aws_cloudfront_vpc_origin" "app" {
  vpc_origin_endpoint_config {
    name                   = "example-app-vpc-origin"
    arn                    = aws_lb.app.arn
    http_port              = 80
    https_port             = 443
    origin_protocol_policy = "https-only"

    origin_ssl_protocols {
      items    = ["TLSv1.2"]
      quantity = 1
    }
  }
}
```

`CloudFront-VPCOrigins-Service-SG` is created automatically by CloudFront when you create a VPC origin, and the docs say Option 2 can only be configured after the VPC origin and this SG have been created. So a VPC origin has to exist in the same VPC before you can look it up with `data` (in my case another VPC origin already existed in the same VPC, so this wasn't an issue).

The hop between the VPC origin and the ALB is also **HTTPS**. With an HTTP listener, the `X-Forwarded-Proto` header added by the ALB becomes `http`, which changes how the app behaves (the scheme of redirects, secure cookie decisions, and so on) ([X-Forwarded headers](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/x-forwarded-headers.html)).

On the CloudFront side you only swap the origin. If you keep the same `origin_id`, the cache behaviors don't need to change.

```hcl
resource "aws_cloudfront_distribution" "app" {
  # ...

  origin {
    domain_name = aws_lb.app.dns_name
    origin_id   = "alb-app"

    vpc_origin_config {
      vpc_origin_id            = aws_cloudfront_vpc_origin.app.id
      origin_keepalive_timeout = 5
      origin_read_timeout      = 30
    }
  }
}
```

The old `custom_header` (`X-Origin-Check`) and `custom_origin_config` were removed at this point.

## The ECS native blue/green service

ECS native blue/green requires **the production listener rule to forward to two target groups with weights** ([Migrate CodeDeploy blue/green deployments to Amazon ECS blue/green deployments](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/migrate-codedeploy-to-ecs-bluegreen.html)).

> You must pre-configure the load balancer production listener with a rule that includes two target groups with weights of 1 and 0.

ALB weights are relative, so in terms of traffic distribution the 100 / 0 in the example below is the same as 1 / 0 ([Forward actions](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/rule-action-types.html#forward-actions)). ECS native blue/green deployments did succeed with this 100 / 0 setup in practice.

```hcl
resource "aws_lb_target_group" "app" {
  for_each = toset(["blue", "green"])

  name        = "example-app-${each.key}"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path    = "/healthcheck"
    matcher = "200"
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.app.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      status_code  = "404"
    }
  }
}

resource "aws_lb_listener_rule" "app" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 100

  action {
    type = "forward"

    forward {
      target_group {
        arn    = aws_lb_target_group.app["blue"].arn
        weight = 100
      }

      target_group {
        arn    = aws_lb_target_group.app["green"].arn
        weight = 0
      }
    }
  }

  condition {
    host_header {
      values = ["app.example.com"]
    }
  }

  lifecycle {
    # NOTE: ECS swaps the weights on every deployment
    ignore_changes = [action]
  }
}

resource "aws_ecs_service" "app_v2" {
  name            = "example-app-v2"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  deployment_controller {
    type = "ECS"
  }

  deployment_configuration {
    strategy             = "BLUE_GREEN"
    bake_time_in_minutes = 0
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [aws_security_group.ecs.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app["blue"].arn
    container_name   = "app"
    container_port   = 3000

    advanced_configuration {
      alternate_target_group_arn = aws_lb_target_group.app["green"].arn
      production_listener_rule   = aws_lb_listener_rule.app.arn
      role_arn                   = aws_iam_role.ecs_infrastructure.arn
    }
  }

  # NOTE: Creation fails if the TG isn't attached to a listener rule yet, or if the infrastructure role doesn't yet have permissions for the new ALB / TGs
  depends_on = [
    aws_lb_listener_rule.app,
    aws_iam_role_policy_attachment.ecs_infrastructure,
  ]

  lifecycle {
    ignore_changes = [
      task_definition,
      load_balancer,
    ]
  }
}
```

These were the pitfalls:

- Add **ELB permissions for the new ALB and TGs** to the ECS infrastructure role in `advanced_configuration.role_arn`. If the service is created before that, the blue/green configuration fails
- Specifying a TG that isn't yet attached to a listener rule fails with `does not have an associated load balancer`, so order things with `depends_on`
- The active TG and the listener rule weights swap on every deployment, so put `load_balancer` and the listener rule's `action` in `ignore_changes`

## Why I didn't move the existing service with UpdateService

The prd admin console used CodeDeploy blue/green (`deployment_controller = CODE_DEPLOY`), so at first I considered changing the existing service's deployment controller to `ECS` with UpdateService. The migration guide lists three approaches:

| Approach | Risk per the guide | Rollback |
| --- | --- | --- |
| Reuse the same ELB resources and switch the controller to ECS with UpdateService | High (no parallel setup) | Revert the service revision |
| Create new TGs and listeners on the existing LB, plus a new service | Low | Revert the ELB port swap |
| Create a new LB and a new service, and switch at the reverse proxy layer above (Route 53 / CloudFront) | Low | Revert the proxy configuration |

AWS provider [6.4.0](https://github.com/hashicorp/terraform-provider-aws/blob/main/CHANGELOG.md) also stopped replacing the resource when `deployment_controller.type` changes (`changes no longer force a replacement`), so in Terraform this can be written as an in-place change. I prepared two PRs that temporarily created a rehearsal service in stg with the same shape as prd (CODE_DEPLOY) to test whether UpdateService could move it.

In the end, though, I closed the rehearsal, for these reasons:

- Making the ALB internal **means rebuilding the ALB anyway**, so the TGs are new too
- A CODE_DEPLOY service can't change its load balancer via UpdateService. [UpdateService](https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_UpdateService.html) states this explicitly:
  > For services using the blue/green (`CODE_DEPLOY`) deployment controller, only the desired count, deployment configuration, health check grace period, task placement constraints and strategies, enable ECS managed tags option, and propagate tags can be updated using this API. If the network configuration, platform version, task definition, or load balancer need to be updated, create a new AWS CodeDeploy deployment.
- So the in-place route would need two steps on the production service, "change the controller" and then "move to the new ALB", both without a parallel setup
- An earlier in-place migration attempt in stg had failed with a 400 error during apply. That apply also included other changes, the logs had expired, and the cause was never identified, and I couldn't be sure it wouldn't happen again
- CloudFront sits in front and all traffic goes through it, so the setup already meets the preconditions of the guide's third approach (new LB + new service, switched at the reverse proxy)

Running old and new side by side lets you check the new service before switching, and if something goes wrong you roll back by reverting the CloudFront origin (or DNS). I chose the lower-risk path.

The stg app was already on ECS native blue/green (ECS controller), so its load balancer could have been swapped, but I **used the same procedure as a rehearsal for prd** and kept the service names (`*-v2`) consistent across both environments.

## The switchover sequence

The app and the admin console differ only in the switch point.

| Step | App | Admin console |
| --- | --- | --- |
| ① Build side by side | Internal ALB, VPC origin, v2 service | Internal ALB, v2 service, **a dedicated CloudFront distribution for the admin console**, VPC origin, CLOUDFRONT-scope WAF |
| ② Point deployments at v2 | Switch the workflow's service to v2 and deploy the latest | Same |
| ③ Switch | Change the CloudFront origin to the VPC origin | Change the Route 53 alias from the old ALB to CloudFront |
| ④ Verify | Old TG RequestCount drops to 0, no increase in 5xx on the new ALB | Same |
| ⑤ Disable deletion protection | `enable_deletion_protection = false` on the old ALB | Same |
| ⑥ Delete the old setup | Old ALB, service, SG, `X-Origin-Check`, CodeDeploy | Old ALB, service, REGIONAL WAF, SG, CodeDeploy |

I went stg → prd for each. Step ② is a repository variable change; every other step was one PR per step on the infrastructure side.

### App: swapping the CloudFront origin

The app already went through CloudFront, so step ③ was just swapping the origin. While a CloudFront change propagates, edges still on the old version keep sending requests with the header to the old ALB, so I expected no 404s during propagation, but **I couldn't find official documentation that states this behavior**. In the actual switchover I saw no increase in user-facing errors, and after a while the old TG's RequestCount dropped to 0.

### Admin console: a dedicated CloudFront distribution and a DNS switch

The admin console had DNS pointing straight at the ALB, with a REGIONAL WAF attached to the ALB.

- The app's CloudFront distribution routes to origins by path and can't route by host name, so I created **a dedicated distribution for the admin console**
- The WAF was recreated with CLOUDFRONT scope (us-east-1) and the REGIONAL rules were moved over
- To match the WAF IP allow list, the distribution's `is_ipv6_enabled` is set to `false`
- Step ③ is moving the Route 53 alias. Until DNS caches expire, both the old ALB and CloudFront receive traffic, so there's no downtime
- When the alias target is CloudFront, `evaluate_target_health` can't be `true` ([AliasTarget](https://docs.aws.amazon.com/Route53/latest/APIReference/API_AliasTarget.html))

> You can't set `EvaluateTargetHealth` to `true` when the alias target is a CloudFront distribution.

### Keeping the real client IP

Behind CloudFront, the last entry of the `X-Forwarded-For` header added by the ALB is CloudFront. The app already received [`CloudFront-Viewer-Address`](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/adding-cloudfront-headers.html) via an origin request policy and took the client IP from it, so after the switch I confirmed that the IPs in the app logs were still the users' IPs.

### Disable deletion protection first

The docs state that an ALB **can't be deleted while deletion protection is enabled** ([Deletion protection](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/edit-load-balancer-attributes.html)).

> If you enable deletion protection for your load balancer, you must disable it before you can delete the load balancer.

If `enable_deletion_protection = false` and the deletion of `aws_lb` are in the same apply, the destroy runs while protection is still on and fails. So I applied a PR that only disables deletion protection first, then opened the deletion PR. Disabling deletion protection alone still leaves the rollback option open.

### What I kept and changed when deleting the old setup

- The Athena (Glue) table that reads the old ALB's access logs was kept for looking at past logs. Its S3 prefix was built from an `aws_lb` attribute reference, so I changed it to a literal string before deleting the referenced ALB resource
- I changed the OpenTelemetry resource attribute `aws.ecs.service.name` in the task definition to the v2 service name (otherwise the APM side stays tied to the old service name)
- Monitoring (ALB and ECS alarms) was rebuilt for v2, and the old service's alarms were deleted

## Raising the origin response timeout quota

The admin console has large file uploads, and even with the ALB directly exposed some requests took over two minutes. Putting CloudFront in front means CloudFront's **origin response timeout** (origin read timeout) now applies.

According to [General quotas on distributions](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-limits.html), `Response timeout per origin` is **1–120 seconds** by default and can be raised by request. So I:

- Switched over with `origin_read_timeout = 120` (the maximum you can set without a request) and `idle_timeout = 120` on the internal ALB
- Requested an increase to 180 seconds in Service Quotas in parallel

The request was also made with Terraform.

```hcl
data "aws_servicequotas_service_quota" "cloudfront_response_timeout" {
  region       = "us-east-1"
  service_code = "cloudfront"
  quota_name   = "Response timeout per origin"

  lifecycle {
    postcondition {
      condition     = self.adjustable
      error_message = "This quota is not adjustable."
    }
  }
}

resource "aws_servicequotas_service_quota" "cloudfront_response_timeout" {
  region       = "us-east-1"
  service_code = "cloudfront"
  quota_code   = data.aws_servicequotas_service_quota.cloudfront_response_timeout.quota_code
  value        = 180

  lifecycle {
    # NOTE: Until approved, the applied value stays at the default and shows up as a diff on every plan
    ignore_changes = [value]
  }
}
```

- Writing the quota code by hand is easy to get wrong, so it's looked up by name, with a `postcondition` that checks `adjustable`
- CloudFront quotas are managed with `region = "us-east-1"` (the request went through with this setting, but I haven't found it stated in the official docs)
- **Approval doesn't change the distribution settings automatically**. [Response and keep-alive timeout quotas](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/DownloadDistValuesOrigin.html) says so explicitly:

> A quota increase for your account doesn't automatically update your origins.

In stg, uploads where the processing time on the ALB went over 150 seconds (the app itself only took a dozen or so seconds) did not return 504. The docs define the response timeout as the time CloudFront waits for a response after forwarding the request to the origin, so my guess is that the time spent transferring the request body doesn't count. I couldn't find a clear official statement on this, so I kept the quota request going just in case.

## Switching the deploy workflow

The app is deployed from GitHub Actions with [aws-actions/amazon-ecs-deploy-task-definition](https://github.com/aws-actions/amazon-ecs-deploy-task-definition). This action **decides whether to use CodeDeploy based on the service's deployment controller** ([index.js in v2.6.3](https://github.com/aws-actions/amazon-ecs-deploy-task-definition/blob/v2.6.3/index.js#L620-L633)). If the controller is `ECS` it calls UpdateService, and if it's `CODE_DEPLOY` it creates a CodeDeploy deployment. So pointing it at the v2 service is all it takes to run ECS native blue/green.

The problem was **timing the switch**. If you rewrite the service name in the workflow file, prd only picks it up on the next app release, and you can't line it up with the infrastructure switchover. So I made the service name come from **repository variables**, falling back to the current service when unset.

```yaml
env:
  APP_SERVICE: ${{ (github.ref == 'refs/heads/main' && vars.PRD_APP_SERVICE) || (github.ref != 'refs/heads/main' && vars.STG_APP_SERVICE) || 'app' }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        uses: aws-actions/amazon-ecs-deploy-task-definition@v2
        with:
          task-definition: task-definition.json
          service: ${{ env.APP_SERVICE }}
          cluster: example-cluster
          wait-for-service-stability: true
```

- Merging alone changes nothing (with the variable unset, the old service is used)
- Once the infrastructure side is running in parallel, set the variable to v2, run one deploy to put the latest task definition on v2, and then switch the origin / DNS
- If deploys land only on the old service in the meantime, the task definition revisions drift apart, so **catch v2 up right before the switch**

After every environment had moved to v2 and the old services and CodeDeploy were deleted, I removed the variable-based switch and the CodeDeploy branches (AppSpec rendering, the `codedeploy-*` inputs) from the workflow and hard-coded the v2 service names.

## Summary

- CloudFront VPC origins let you make the ALB internal in private subnets, with CloudFront as the single entry point
- Using `CloudFront-VPCOrigins-Service-SG` as the source in the ALB SG limits access to your own distributions, so header verification like `X-Origin-Check` is no longer needed
- `internal` can't be changed later, and a CODE_DEPLOY service can't change its load balancer via UpdateService, so **building a new ALB + new service side by side and switching at CloudFront / DNS** was the lowest-risk option
- Keep the apply that disables deletion protection separate from the one that deletes the ALB
- CloudFront's origin response timeout tops out at 120 seconds by default. If you have long-running requests, request the quota increase early, and raise the distribution setting after approval
- Making the deploy target's service name switchable via repository variables lets you line it up with the timing of the infrastructure work

I hope this helps.

## References

- [Restrict access with VPC origins](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-vpc-origins.html)
- [Migrate CodeDeploy blue/green deployments to Amazon ECS blue/green deployments](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/migrate-codedeploy-to-ecs-bluegreen.html)
- [UpdateService - Amazon ECS API Reference](https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_UpdateService.html)
- [General quotas on distributions - Amazon CloudFront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-limits.html)
- [Origin settings (Response timeout) - Amazon CloudFront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/DownloadDistValuesOrigin.html)
- [Add CloudFront request headers](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/adding-cloudfront-headers.html)
- [X-Forwarded headers - Application Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/x-forwarded-headers.html)
- [Edit attributes for your Application Load Balancer (Deletion protection)](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/edit-load-balancer-attributes.html)
- [AliasTarget - Amazon Route 53 API Reference](https://docs.aws.amazon.com/Route53/latest/APIReference/API_AliasTarget.html)
- [hashicorp/terraform-provider-aws CHANGELOG (6.4.0)](https://github.com/hashicorp/terraform-provider-aws/blob/main/CHANGELOG.md)
- [aws-actions/amazon-ecs-deploy-task-definition](https://github.com/aws-actions/amazon-ecs-deploy-task-definition)
