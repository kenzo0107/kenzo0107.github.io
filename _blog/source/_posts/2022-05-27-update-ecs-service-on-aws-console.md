---
title: AWS コンソール上で CodeDeploy でデプロイ管理されている ECS Service をアップデートすると capacity provider が FARGATE になってしまう件
date: 2022-05-27
category: AWS
---

capacity provider strategy で FARGATE_SPOT に weight = 1 で全振りしていた FARGATE がいます。

![](https://i.imgur.com/rqRuh2G.png)

- FARGATE_SPOT weight = 1
- FARGATE weight = 0

<!-- more -->

## AWS コンソール上で ECS Service をアップデートした際の問題

![](https://i.imgur.com/4RoXEV6.png)

Configure service で FARGATE_SPOT weight = 1 に指定しています。

ちょっとした検証でタスク定義をちょこっと変えたものを AWS コンソール上でタスク更新だけしてデプロイしました。

すると...

capacity provider strategy の設定がなくなっている...
![](https://i.imgur.com/8kt06gl.png)

## 何故こんなことが起きるのか？

![](https://i.imgur.com/N16Wks5.png)

AWS コンソール上で ECS Service 更新ステップを進むと
`Configure CodeDeploy Deployment` の Revision の `AppSpec` をクリックしてみると以下設定になっていました。

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

ここで capacity provider strategy の設定がありません。

その影響で更新完了後、 capacity provider strategy の設定がなくなってしまいました。

terraform で capacity provider strategy を管理していると
terraform apply 実施すると ECS Service が意図せず再作成となりダウンタイムが発生します。

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

## 対策

CodeDeploy で管理されている ECS Service の更新は
aws-cli や CodeDeploy 経由でデプロイします。

`aws deploy create-deployment` のオプションで全て対応しようとするとやや複雑になります。

```
aws deploy create-deployment \
	--application-name xxx \
	--deployment-group-name yyy \
	--revision '{"revisionType": "AppSpecContent", "appSpecContent": {"content": "{\"version\": 0.0, \"Resources\": [{\"TargetService\": {\"Type\": \"AWS::ECS::Service\", \"Properties\": {\"TaskDefinition\": \"<タスク定義 ARN>\", \"LoadBalancerInfo\": {\"ContainerName\": \"nginx\", \"ContainerPort\": 80},\"CapacityProviderStrategy\": [{\"Base\":0,\"CapacityProvider\":\"FARGATE_SPOT\",\"Weight\":1},{\"Base\":0,\"CapacityProvider\":\"FARGATE\",\"Weight\":0}]}}}]}"}}'
```

ファイルにまとめておくとコマンドがシンプル ♪
（content の定義が String なので、1 行にまとめて文字列として定義しており見づらさはある）

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

appspec を明示的に指定することで capacity provider strategy を明示的に残すようにできることを確認しました。

以上
参考になれば幸いです。
