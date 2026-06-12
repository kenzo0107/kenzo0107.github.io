---
title: How to Switch an Existing ECS Service to Fargate Spot
category: Terraform
tags:
- AWS
date: 2021-01-29
lang: en
translation_id: apply-fargate-spot-for-existed-fargate
permalink: en/2021/01/29/apply-fargate-spot-for-existed-fargate/
cover: https://i.imgur.com/r0W6OnK.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

## Overview

There are two ways to switch an existing ECS Service to Fargate Spot.

* terraform
* aws-cli

<!-- more -->

## Switching with terraform

Let's say we add a `capacity_provider_strategy` to launch with 100% Fargate Spot.

```ecs_service_app.tf
resource "aws_ecs_service" "app" {
-  launch_type = "FARGATE"

+  capacity_provider_strategy {
+    capacity_provider = "FARGATE_SPOT"
+    weight            = 100
+  }

+  capacity_provider_strategy {
+    capacity_provider = "FARGATE"
+    weight            = 0
+  }
```

With terraform, the resource is recreated.

```
$ terraform plan

# aws_ecs_service.app must be replaced
-/+ resource "aws_ecs_service" "app" {
```

## Switching with aws-cli

With aws-cli, you can update without recreating the resource.

```
aws ecs update-service \
	--capacity-provider-strategy capacityProvider=FARGATE,weight=0  capacityProvider=FARGATE_SPOT,weight=100 \
     --cluster <ecs cluster name> \
     --service <ecs service name> \
     --force-new-deployment
```

A forced deployment runs immediately, and the CapacityProviderStrategy is applied with no downtime.

### When managed by the CodeDeploy deployment controller

The following error occurs.

```
An error occurred (InvalidParameterException) when calling the UpdateService operation: Cannot force a new deployment on services with a CODE_DEPLOY deployment controller. Use AWS CodeDeploy to trigger a new deployment.
```

<s>If deployments are managed by CodeDeploy in the first place, you cannot use Fargate Spot.</s> It became usable. (added 2021-10-14)
https://docs.aws.amazon.com/ja_jp/AmazonECS/latest/developerguide/cluster-capacity-providers.html
> When a service uses the Blue/Green deployment type, the use of capacity providers is not supported.

Since aws-cli warns you to deploy via CodeDeploy,
<s>it seems there is no way other than recreating the resource with terraform.</s>
I confirmed that you can manage it without recreating by specifying the following in the CodeDeploy appspec configuration.

```
version: 0.0
Resources:
  - TargetService:
      Type: AWS::ECS::Service
      Properties:
        ...
        CapacityProviderStrategy:
          - CapacityProvider: 'FARGATE_SPOT'
            Weight: 100
            Base: 0
          - CapacityProvider: 'FARGATE'
            Weight: 0
            Base: 0
```

* Adjust the Base and Weight settings as appropriate.

## Switching with no downtime & updating tfstate

When managing resources with terraform, I was able to switch with no downtime using the following procedure.

1. Update with aws-cli
2. Update tfstate with terraform apply

This lets you keep managing with terraform while updating with no downtime.


## Aside

When creating an ECS Service from scratch with terraform, you can actually specify both CodeDeploy and CapacityProviderStrategy.

Looking at the image below alone makes you wonder whether it's possible.
![](https://i.imgur.com/r0W6OnK.png)

This looks like the one!

{% twitter https://twitter.com/t2ynkmr/status/1325684369416024065 %}


If you want to keep the CodeDeploy deployment controller management while removing the CapacityProviderStrategy,
recreating the resource seems to be the only workaround for now.


With aws-cli,
you can go from launch_type → capacity_provider_strategy,
but not the other way around.

### By the way

If you specify a capacity provider strategy when building an ECS Service in the AWS Console,
the `Deployment type` can only be set to `Rolling update`.

![](https://i.imgur.com/Qei5oJi.png)

![](https://i.imgur.com/mFMDfzc.png)

## Aside 2

With the FargateSpot weight of 100% used in this example, the service may fail to launch.
You may want to use Spot in non-production environments to cut costs, but you need to be careful.

The following issues track work to fall back to Fargate when Fargate Spot is exhausted, so that at least the minimum can launch.

https://github.com/aws/containers-roadmap/issues/773
https://github.com/aws/containers-roadmap/issues/852


That's all.
I hope this is helpful.
