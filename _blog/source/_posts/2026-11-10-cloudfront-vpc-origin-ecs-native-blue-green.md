---
title: CloudFront → 公開 ALB を VPC オリジン + internal ALB に置き換え、ECS ネイティブ Blue/Green へ移行した
date: 2026-11-10
lang: ja
translation_id: cloudfront-vpc-origin-ecs-native-blue-green
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
- セキュリティ
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

CloudFront の後ろにある **インターネット向け（internet-facing）の ALB を、CloudFront VPC オリジンでつなぐ internal ALB に置き換えました**。あわせて、ECS service のデプロイを **CodeDeploy の Blue/Green から ECS ネイティブ Blue/Green に移行**しています。

ALB をインターネットに露出させないための、**セキュリティ対策の一環**です。対象はアプリ（会員画面・モバイル API）と管理画面の 2 つで、どちらも stg → prd の順に、新旧を並行稼働させて切り替え、旧リソースを消す、という段取りで進めました。ALB の作り直しとデプロイ方式の変更を同時にやると何に気をつけることになるのか、備忘録として残します。

<!-- more -->

## 結論

| 項目 | 内容 |
| --- | --- |
| 目的 | ALB をインターネットから到達できない状態にし、CloudFront を唯一の入口にする |
| 新構成 | CloudFront → VPC オリジン → internal ALB（private サブネット）→ ECS（ECS ネイティブ Blue/Green） |
| 廃止したもの | オリジン検証ヘッダー（`X-Origin-Check`）、CloudFront マネージドプレフィックスリストでの許可、CodeDeploy のアプリ・デプロイメントグループ |
| 進め方 | 新しい ALB・service を並べて作る → CloudFront の origin（または DNS）を切り替える → 削除保護を外す → 旧リソースを消す |
| service の移し方 | 既存 service を UpdateService で移す案は予行まで作ったが採らず、**最初から ECS ネイティブ Blue/Green の新しい service を作った** |
| 注意点 | `internal` は ALB 作成後に変えられない／CloudFront の origin 応答タイムアウトは既定で 120 秒が上限／デプロイ workflow の service 名をインフラ作業の時刻に合わせて切り替える必要がある |

## 旧構成と課題

旧構成はこうでした。

- ALB は public サブネットにある internet-facing
- SG は CloudFront のマネージドプレフィックスリスト（`com.amazonaws.global.cloudfront.origin-facing`）からの 443 だけを許可
- それだけだと **他人の CloudFront ディストリビューションからも ALB に届く**ため、CloudFront の origin にカスタムヘッダー `X-Origin-Check` を付け、ALB のリスナールールでその値を検証していた（このヘッダー検証まわりは [関連記事](/2026/11/09/2026-11-10-cloudfront-function-strip-forwarded-host/) でも触れています）
- prd のアプリ・管理画面は CodeDeploy の Blue/Green でデプロイしていた（stg は先に ECS ネイティブ Blue/Green へ移行済み）

ヘッダー検証は CloudFront を経由させるための定番の方法ですが、結局のところ ALB 自体はインターネットに公開されたままです。SG で CloudFront 以外からの通信は落とせても、他人のディストリビューションの origin に ALB の DNS 名を設定されれば ALB までは届きますし、ヘッダーの値という秘密情報を管理し続ける必要もあります。

## CloudFront VPC オリジンとは

[Restrict access with VPC origins](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-vpc-origins.html) に記載があり、CloudFront から **private サブネットにある ALB / NLB / EC2 を直接 origin にできる**機能です。

> VPC origins is designed to enhance the security posture of your application by placing your load balancers and EC2 instances in private subnets, making CloudFront the single point of entry.

ALB の SG で許可する通信元には 2 つの選択肢があることが明記されています。

- Option 1: CloudFront のマネージドプレフィックスリスト
- Option 2: VPC オリジンの作成時に CloudFront が自動で作るサービス管理の SG（`CloudFront-VPCOrigins-Service-SG`）

> This configuration is further restrictive as it restricts the traffic only to your CloudFront distributions.

今回は **Option 2 を採用**しました。プレフィックスリストは他アカウントの CloudFront も含むためです。この SG を許可元にしておけば自分のディストリビューションからの通信だけに絞れるので、`X-Origin-Check` によるヘッダー検証は不要になります。

ほかの前提条件も同じページに書かれています。

- VPC にインターネットゲートウェイがあること（ルーティングには使われない）
- private サブネットに空き IP があること（CloudFront がサービス管理の ENI を作るため）
- gRPC、Lambda@Edge の origin request / origin response トリガーは非対応

## なぜ既存 ALB を internal に変えなかったのか

ALB の `internal`（scheme）は **作成後に変えられません**。Terraform の `aws_lb` でも `internal` は `ForceNew` になっていることを [load_balancer.go](https://github.com/hashicorp/terraform-provider-aws/blob/main/internal/service/elbv2/load_balancer.go) で確認しました。`internal = true` に書き換えるだけだと destroy → create になり、その間サービスが止まります。

そこで、新しい internal ALB を並べて作り、切り替えてから旧 ALB を消すことにしました。ALB が新しくなれば target group も新しくなります。ここで後述する CodeDeploy の制約に当たります。

## 構成の Before / After

```
Before:
  利用者 → CloudFront ──(HTTPS + X-Origin-Check)──> ALB (internet-facing, public subnet)
                                                    └─(listener rule でヘッダー検証)─> ECS (CodeDeploy B/G)

After:
  利用者 → CloudFront → VPC オリジン ──(HTTPS)──> ALB (internal, private subnet)
                                                  └─(weighted forward blue/green)─> ECS (ECS ネイティブ B/G)
```

## 新しい ALB と VPC オリジン

ALB の SG は `CloudFront-VPCOrigins-Service-SG` からの 443 だけを受け、egress も ECS タスクのポートだけに絞りました。

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

`CloudFront-VPCOrigins-Service-SG` は VPC オリジンを作成したときに CloudFront が自動で作る SG で、Option 2 は VPC オリジンとこの SG が作られた後でないと設定できないとされています。そのため `data` で引く前に、同じ VPC に VPC オリジンが存在している必要があります（今回は同じ VPC に別の VPC オリジンが既にあったため問題になりませんでした）。

VPC オリジンと ALB の間も **HTTPS** にしています。HTTP リスナーで受けると ALB が付ける `X-Forwarded-Proto` が `http` になり、アプリから見える挙動（リダイレクト先のスキームや secure cookie の判定など）が変わってしまうためです（[X-Forwarded headers](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/x-forwarded-headers.html)）。

CloudFront 側は origin を差し替えるだけです。`origin_id` を変えなければ cache behavior には手を入れずに済みます。

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

旧構成の `custom_header`（`X-Origin-Check`）と `custom_origin_config` はここで消しました。

## ECS ネイティブ Blue/Green の service

ECS ネイティブ Blue/Green では、**本番リスナールールが 2 つの target group に重み付きで forward している**必要があります（[Migrate CodeDeploy blue/green deployments to Amazon ECS blue/green deployments](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/migrate-codedeploy-to-ecs-bluegreen.html)）。

> You must pre-configure the load balancer production listener with a rule that includes two target groups with weights of 1 and 0.

ALB の weight は相対値なので、トラフィックの配分としては下の例の 100 / 0 も 1 / 0 と同じです（[Forward actions](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/rule-action-types.html#forward-actions)）。実際この 100 / 0 の構成で、ECS ネイティブ Blue/Green のデプロイは成功しています。

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
    # NOTE: デプロイのたびに ECS が weight を入れ替えるため
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

  # NOTE: リスナールールに紐づく前の TG を指定すると失敗し、インフラロールに新しい ALB / TG の権限が付く前に作っても失敗するため
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

ハマりどころはこのあたりでした。

- `advanced_configuration.role_arn` の ECS インフラロールに、**新しい ALB と TG の ELB 操作権限**を足しておく。足す前に service を作ると Blue/Green の設定に失敗する
- リスナールールにまだ紐づいていない TG を指定すると `does not have an associated load balancer` になるので、`depends_on` で順序を付ける
- デプロイのたびに稼働側の TG とリスナールールの weight が入れ替わるので、`load_balancer` とリスナールールの `action` は `ignore_changes` にする

## 既存 service を UpdateService で移す案を採らなかった理由

prd の管理画面は CodeDeploy の Blue/Green（`deployment_controller = CODE_DEPLOY`）だったので、当初は「既存 service の deployment controller を UpdateService で `ECS` に変える」案を検討しました。移行ガイドには 3 つの方法が載っています。

| 方法 | ガイド上のリスク | 切り戻し |
| --- | --- | --- |
| 同じ ELB リソースを使い回し、UpdateService で controller を ECS に変える | 高（並行構成がない） | service revision を戻す |
| 既存 LB に新しい TG・リスナーを作り、新しい service を作る | 低 | ELB のポート入れ替えを戻す |
| 新しい LB と新しい service を作り、上位のリバースプロキシ（Route 53 / CloudFront）で切り替える | 低 | プロキシの設定を戻す |

AWS provider も [6.4.0](https://github.com/hashicorp/terraform-provider-aws/blob/main/CHANGELOG.md) で `deployment_controller.type` の変更で置換されなくなった（`changes no longer force a replacement`）ので、Terraform 上も in-place で書けます。そこで、stg に prd と同じ形（CODE_DEPLOY）の予行用 service を一時的に作り、UpdateService で移せるかを試す PR を 2 本用意しました。

ただ、最終的にこの予行は close しました。理由は以下です。

- ALB を internal にするには **どのみち ALB を作り直す**ので、TG も新しくなる
- CODE_DEPLOY の service は、UpdateService で load balancer を変えられない。[UpdateService](https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_UpdateService.html) に明記されています
  > For services using the blue/green (`CODE_DEPLOY`) deployment controller, only the desired count, deployment configuration, health check grace period, task placement constraints and strategies, enable ECS managed tags option, and propagate tags can be updated using this API. If the network configuration, platform version, task definition, or load balancer need to be updated, create a new AWS CodeDeploy deployment.
- つまり in-place 案だと「controller を変える」→「新しい ALB に付け替える」の 2 段階が本番の service 上で必要になり、どちらも並行構成なしで行うことになる
- 以前 stg で in-place の移行を試した際に apply が 400 エラーで失敗したことがあった。同じ apply に別の変更も入っており、ログも期限切れで原因を特定できておらず、再現しないと言い切れなかった
- 前段に CloudFront があり、すべての通信がそこを通るので、ガイドの 3 つ目の方法（新しい LB + 新しい service をリバースプロキシで切り替える）の前提をそのまま満たしている

並行稼働させれば、切り替え前に新しい service を確認でき、問題があれば CloudFront の origin（または DNS）を戻すだけで切り戻せます。リスクの低い方を選びました。

なお stg のアプリはすでに ECS ネイティブ Blue/Green（ECS コントローラー）だったので load balancer を付け替えることもできましたが、**prd の予行を兼ねて同じ手順**にし、service 名（`*-v2`）も両環境でそろえました。

## 切り替えの段取り

アプリと管理画面で、切り替えポイントだけが違います。

| 手順 | アプリ | 管理画面 |
| --- | --- | --- |
| ① 並べて作る | internal ALB・VPC オリジン・v2 service | internal ALB・v2 service・**管理画面専用の CloudFront**・VPC オリジン・CLOUDFRONT スコープの WAF |
| ② デプロイ先を v2 にする | workflow の service を v2 に切り替え、最新を入れる | 同左 |
| ③ 切り替える | CloudFront の origin を VPC オリジンに変更 | Route 53 の alias を旧 ALB から CloudFront に変更 |
| ④ 確認 | 旧 TG の RequestCount が 0、新 ALB の 5xx が増えていない | 同左 |
| ⑤ 削除保護を外す | 旧 ALB の `enable_deletion_protection = false` | 同左 |
| ⑥ 旧構成を消す | 旧 ALB・service・SG・`X-Origin-Check`・CodeDeploy | 旧 ALB・service・REGIONAL WAF・SG・CodeDeploy |

それぞれを stg → prd の順に進めました。② はリポジトリ変数の変更で、それ以外はインフラ側で 1 手順 1 PR にしています。

### アプリ: CloudFront の origin を差し替える

アプリはすでに CloudFront 経由だったので、③ は origin の差し替えだけです。CloudFront の設定反映中は旧い版のエッジが旧 ALB へヘッダー付きで送り続けるので、反映中も 404 にはならないだろうと考えていましたが、**この挙動を明記した公式ドキュメントは確認できませんでした**。実際の切り替えでは、利用者からのエラー増加は見られず、しばらくして旧 TG の RequestCount が 0 になりました。

### 管理画面: 専用の CloudFront を作って DNS を切り替える

管理画面は ALB に直接 DNS を向けていて、ALB に REGIONAL の WAF を付けていました。

- アプリの CloudFront はパスで origin を振り分けていて、ホスト名では振り分けられないため、**管理画面専用のディストリビューション**を作った
- WAF は CLOUDFRONT スコープ（us-east-1）で作り直し、REGIONAL のルールを移した
- WAF の IP 許可リストに合わせて、ディストリビューションの `is_ipv6_enabled` は `false` にした
- ③ は Route 53 の alias の付け替え。DNS キャッシュが切れるまでは旧 ALB と CloudFront の両方で受けるので止まらない
- CloudFront を alias 先にする場合、`evaluate_target_health` は `true` にできない（[AliasTarget](https://docs.aws.amazon.com/Route53/latest/APIReference/API_AliasTarget.html)）

> You can't set `EvaluateTargetHealth` to `true` when the alias target is a CloudFront distribution.

### 利用者の IP を取り続ける

CloudFront 経由にすると、ALB が付ける `X-Forwarded-For` の末尾は CloudFront になります。アプリはもともと origin request policy で [`CloudFront-Viewer-Address`](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/adding-cloudfront-headers.html) を受け取り、そこから利用者の IP を取る作りにしていたので、切り替え後もアプリのログに残る IP が利用者のものであることを確認しました。

### 削除保護は先に外す

ALB の削除保護は、**有効なままでは削除できない**ことが明記されています（[Deletion protection](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/edit-load-balancer-attributes.html)）。

> If you enable deletion protection for your load balancer, you must disable it before you can delete the load balancer.

`enable_deletion_protection = false` と `aws_lb` の削除を同じ apply に入れると、保護が付いたまま destroy が走って失敗します。そのため削除保護を外す PR を先に apply してから、削除 PR を出しました。削除保護を外すだけなら、まだ切り戻しもできます。

### 旧構成を消すときに残したもの・変えたもの

- 旧 ALB のアクセスログを読む Athena（Glue）テーブルは、過去ログの参照用に残した。テーブルの S3 プレフィックスを `aws_lb` の属性参照で組み立てていたので、参照先の ALB リソースを消す前に文字列で持つように変えた
- タスク定義の OpenTelemetry のリソース属性 `aws.ecs.service.name` を v2 の service 名に変えた（APM 側の紐づけが旧 service 名のままになるため）
- 監視（ALB・ECS のアラーム）も v2 向けに作り直し、旧 service のものは消した

## origin 応答タイムアウトのクォータ引き上げ

管理画面には大きなファイルのアップロードがあり、ALB 直結の時点で 2 分を超えるリクエストがありました。CloudFront を前段に入れると、今度は CloudFront の **origin 応答タイムアウト**（origin read timeout）が効いてきます。

[General quotas on distributions](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-limits.html) によると、`Response timeout per origin` は既定で **1〜120 秒**で、引き上げを申請できます。そこで、

- `origin_read_timeout = 120`（申請なしで設定できる上限）と、internal ALB の `idle_timeout = 120` で切り替え
- 並行して Service Quotas で 180 秒への引き上げを申請

という形にしました。申請も Terraform で出しています。

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
    # NOTE: 承認されるまで適用値は既定値のままで、plan のたびに差分になるため
    ignore_changes = [value]
  }
}
```

- quota code を手で書くと取り違えやすいので、名前から引いて `adjustable` を `postcondition` で確かめる
- CloudFront のクォータは `region = "us-east-1"` を指定して操作する（この指定で申請できましたが、公式ドキュメントでの明記は確認できていません）
- **承認されても distribution の設定は自動で変わりません**。[Response and keep-alive timeout quotas](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/DownloadDistValuesOrigin.html) にも明記されています

> A quota increase for your account doesn't automatically update your origins.

なお stg では、ALB 上の処理時間が 150 秒を超えるアップロード（アプリ自体の処理は十数秒）でも 504 になりませんでした。ドキュメント上の response timeout は「リクエストを origin に転送した後、応答を待つ時間」と定義されているので、リクエストボディの転送時間は含まれないのではないか、という推察です。公式に明確な記載は確認できなかったため、念のため申請はそのまま進めています。

## デプロイ workflow の切り替え

アプリのデプロイは GitHub Actions で [aws-actions/amazon-ecs-deploy-task-definition](https://github.com/aws-actions/amazon-ecs-deploy-task-definition) を使っています。このアクションは、**CodeDeploy を使うかどうかを service の deployment controller で決めています**（[v2.6.3 の index.js](https://github.com/aws-actions/amazon-ecs-deploy-task-definition/blob/v2.6.3/index.js#L620-L633)）。controller が `ECS` なら UpdateService、`CODE_DEPLOY` なら CodeDeploy のデプロイを作ります。なので v2 service に向ければ、それだけで ECS ネイティブ Blue/Green が走ります。

問題は**切り替えのタイミング**でした。workflow ファイル内で service 名を書き換えると、prd にはアプリのリリースまで反映されず、インフラ側の切り替え時刻に合わせられません。そこで、service 名を**リポジトリ変数**から取り、未設定なら今の service を使うようにしました。

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

- マージしただけでは動作が変わらない（変数が未設定なら旧 service）
- インフラ側で並行稼働の準備ができたら、変数を v2 にしてデプロイを 1 回流し、v2 に最新のタスク定義を入れてから origin / DNS を切り替える
- 切り替えまでの間に旧 service だけにデプロイが入るとタスク定義のリビジョンに差が出るので、**切り替え直前に v2 を追いつかせる**

すべての環境が v2 に移り、旧 service と CodeDeploy を消したあとで、変数による切り替えと CodeDeploy 用の分岐（AppSpec の生成、`codedeploy-*` の入力）を workflow から外し、service 名を v2 に固定しました。

## まとめ

- CloudFront VPC オリジンを使うと ALB を private サブネットの internal にでき、CloudFront を唯一の入口にできる
- ALB の SG は `CloudFront-VPCOrigins-Service-SG` を許可元にすると自分のディストリビューションだけに絞れるので、`X-Origin-Check` のようなヘッダー検証は不要になる
- `internal` は後から変えられず、CODE_DEPLOY の service は UpdateService で load balancer を変えられないので、**新しい ALB + 新しい service を並べて CloudFront / DNS で切り替える**のが一番リスクが低かった
- 削除保護を外す apply と ALB の削除は分ける
- CloudFront の origin 応答タイムアウトは既定で 120 秒が上限。長いリクエストがあるなら先にクォータを申請し、承認後に distribution の設定も上げる
- デプロイ先の service 名はリポジトリ変数で切り替えられるようにしておくと、インフラ側の作業時刻に合わせられる

参考になれば幸いです。

## 参考

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
