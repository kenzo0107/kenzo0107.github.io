---
title: Updating a CodeDeploy-managed ECS Service from the AWS Console resets the capacity provider to FARGATE
date: 2022-05-27
lang: en
translation_id: update-ecs-service-on-aws-console
permalink: en/2022/05/27/update-ecs-service-on-aws-console/
cover: https://i.imgur.com/rqRuh2G.png
category: AWS
---

I had a FARGATE setup where the capacity provider strategy put all the weight on FARGATE_SPOT with weight = 1.

![](https://i.imgur.com/rqRuh2G.png)

- FARGATE_SPOT weight = 1
- FARGATE weight = 0

<!-- more -->

## The problem when updating an ECS Service from the AWS Console

![](https://i.imgur.com/4RoXEV6.png)

In Configure service, I had set FARGATE_SPOT weight = 1.

For a quick test, I made a small change to the task definition and deployed it by updating only the task from the AWS Console.

And then...

The capacity provider strategy configuration was gone...
![](https://i.imgur.com/8kt06gl.png)

## Why does this happen?

![](https://i.imgur.com/N16Wks5.png)

When you go through the ECS Service update steps in the AWS Console and click the `AppSpec` for the Revision under `Configure CodeDeploy Deployment`, you find the following configuration:

```
{
    "version": 1,
    "Resources": [
        {
            "TargetService": {
                "Type": "AWS::ECS::Service",
                "Properties": {
                    "TaskDefinition": "<タスク定義 ARN>",
                    "LoadBalancerInfo": {
                        "ContainerName": "nginx",
                        "ContainerPort": 80
                    },
                    "PlatformVersion": "LATEST"
                }
            }
        }
    ]
}
```

There is no capacity provider strategy configuration here.

As a result, after the update completed, the capacity provider strategy configuration was gone.

If you manage the capacity provider strategy with Terraform, running `terraform apply` will unintentionally force the ECS Service to be recreated, causing downtime.

```
  # aws_ecs_service.app must be replaced
-/+ resource "aws_ecs_service" "app" {

      + capacity_provider_strategy { # forces replacement
          + capacity_provider = "FARGATE"
          + weight            = 0
        }
      + capacity_provider_strategy { # forces replacement
          + capacity_provider = "FARGATE_SPOT"
          + weight            = 1
        }
```

## Solution

For an ECS Service managed by CodeDeploy, perform updates via the AWS CLI or through CodeDeploy.

Trying to handle everything with options to `aws deploy create-deployment` gets a bit complicated.

```
aws deploy create-deployment \
	--application-name xxx \
	--deployment-group-name yyy \
	--revision '{"revisionType": "AppSpecContent", "appSpecContent": {"content": "{\"version\": 0.0, \"Resources\": [{\"TargetService\": {\"Type\": \"AWS::ECS::Service\", \"Properties\": {\"TaskDefinition\": \"<タスク定義 ARN>\", \"LoadBalancerInfo\": {\"ContainerName\": \"nginx\", \"ContainerPort\": 80},\"CapacityProviderStrategy\": [{\"Base\":0,\"CapacityProvider\":\"FARGATE_SPOT\",\"Weight\":1},{\"Base\":0,\"CapacityProvider\":\"FARGATE\",\"Weight\":0}]}}}]}"}}'
```

Putting it into a file keeps the command simple ♪
(Since the content definition is a String, it has to be written as a single-line string, which makes it a bit hard to read.)

```
aws deploy create-deployment --cli-input-json file://deployment.json
```

deployment.json

```
{
    "applicationName": "xxx",
    "deploymentGroupName": "yyy",
    "revision": {
	    "revisionType": "AppSpecContent",
		  "appSpecContent": {
			  "content": "{\"version\": 0.0, \"Resources\": [{\"TargetService\": {\"Type\": \"AWS::ECS::Service\", \"Properties\": {\"TaskDefinition\": \"<タスク定義 ARN>\", \"LoadBalancerInfo\": {\"ContainerName\": \"nginx\", \"ContainerPort\": 80},\"CapacityProviderStrategy\": [{\"Base\":0,\"CapacityProvider\":\"FARGATE_SPOT\",\"Weight\":1},{\"Base\":0,\"CapacityProvider\":\"FARGATE\",\"Weight\":0}]}}}]}"
		}
	}
}
```

I confirmed that by explicitly specifying the appspec, you can explicitly preserve the capacity provider strategy.

That's all.
I hope this is helpful.
