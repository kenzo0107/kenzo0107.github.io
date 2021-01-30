---
title: 既存 ECS Service の Fargate Spot への切り替え方法
category: Terraform
tags:
- AWS
date: 2021-01-29
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

## 概要

既存 ECS Service の Farate Spot への切り替え方法は 2 つあります。

* terraform
* aws-cli

## terraform で切り替える

capacity_provider_strategy を追加し 100% FargateSpot で起動させるとします。

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

terraform では再作成されます。

```
$ terraform plan

# aws_ecs_service.app must be replaced
-/+ resource "aws_ecs_service" "app" {
```

## aws-cli で切り替える

aws-cli では再作成することなく更新が可能です。

```
aws ecs update-service \
	--capacity-provider-strategy capacityProvider=FARGATE,weight=0  capacityProvider=FARGATE_SPOT,weight=100 \
     --cluster <ecs cluster name> \
     --service <ecs service name> \
     --force-new-deployment
```

直ちに強制デプロイが実行され、ダウンタイムなく CapacityProviderStrategy が適用されます。

### CodeDeploy のデプロイコントローラーで管理されている場合

以下エラーが発生します。

```
An error occurred (InvalidParameterException) when calling the UpdateService operation: Cannot force a new deployment on services with a CODE_DEPLOY deployment controller. Use AWS CodeDeploy to trigger a new deployment.
```

そもそも CodeDeploy でデプロイ管理している場合、 FargateSpot を利用できない。
https://docs.aws.amazon.com/ja_jp/AmazonECS/latest/developerguide/cluster-capacity-providers.html
> サービスで Blue/Green デプロイタイプを使用している場合、キャパシティープロバイダーの使用はサポートされません。


## ダウンタイムなしで切り替え tfstate 更新手順

terraform でリソース管理をしている場合、以下の手続きでダウンタイムなしで切り替えできました。

1. aws-cli で更新
2. terraform apply で tfstate 更新

terraform での管理もでき、且つ、ダウンタイムなしに更新ができます。


## 余談

terraform で ECS Service 新規作成時だと CodeDeploy と CapacityProviderStrategy を両方指定できてしまいます。

以下画像だけ見るとできるの？と思ってしまいます。
![](https://i.imgur.com/r0W6OnK.png)

これっぽい！

{% twitter https://twitter.com/t2ynkmr/status/1325684369416024065 %}


CodeDeploy のデプロイコントローラー管理を残し CapacityProviderStrategy を外そうとすると
再作成するしか今の所、対処法がなさそうです。


aws-cli で
launch_type → capacity_provider_strategy はできるけど、
逆はできない。

### ちなみに

AWS Console 上で ECS Service 構築時に capacity provider strategy を指定していると
`Deployment type` は `Rolling update` しか選択できない様になっています。

![](https://i.imgur.com/Qei5oJi.png)

![](https://i.imgur.com/mFMDfzc.png)

以上
ご参考になれば幸いです。
