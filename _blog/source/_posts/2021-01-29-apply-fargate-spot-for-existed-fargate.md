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

## ダウンタイムなしで切り替える手順

以下の手続きでダウンタイムなしで切り替えできました。

1. aws-cli で更新
2. terraform apply で tfstate 更新

terraform での管理もでき、且つ、ダウンタイムなしに更新ができます。

以上
ご参考になれば幸いです。
