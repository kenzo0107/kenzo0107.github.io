---
title: 使っていないネームスペースを絞ると Datadog AWS インテグレーションの CloudWatch 代が減る
date: 2026-08-18
lang: ja
translation_id: datadog-aws-integration-getmetricdata-cost
cover: /img/cover/2026-08-18-datadog-aws-integration-getmetricdata-cost.svg
categories:
- [Monitoring]
- [AWS]
tags:
- Datadog
- CloudWatch
- AWS
- Terraform
- コスト削減
---

Datadog の AWS インテグレーションは、有効になっているネームスペースのメトリクスを CloudWatch の GetMetricData で定期的に取得します。Datadog 側で一切参照していないメトリクスでも、ポーリング対象に入っていれば API 課金は発生します。
使っていないネームスペースを収集対象から外せば、その分の GetMetricData コストはそのまま消えます。どれだけ効くかは「見ていないネームスペースがどれだけメトリクスを抱えているか」次第なので、まずは自分の請求で GetMetricData がいくら出ているかを見るところからです。

<!-- more -->

## まず GetMetricData にいくら払っているか確認する

CloudWatch の GetMetricData は、Cost Explorer 上では使用タイプ `CW:GMD-Metrics` として出てきます（リージョンによって `APN1-` のようなプレフィックスが付きます）。
使用タイプ別に出して該当行を探すのが確実です。

```sh
# CloudWatch の使用タイプ別に先月のコストを出し、GMD の行を探す
aws ce get-cost-and-usage \
  --time-period Start=2026-08-01,End=2026-09-01 \
  --granularity MONTHLY \
  --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=USAGE_TYPE \
  --filter '{"Dimensions":{"Key":"SERVICE","Values":["AmazonCloudWatch"]}}'
```

Cost Explorer の画面でも、AWS Billing and Cost Management の MCP サーバー経由でも同じことが確認できます。
ここが大きいアカウントほど、絞り込みの効果も大きくなります。Datadog を入れているのに GMD がほとんど出ていないなら、そもそも収集対象が絞れているということです。

## 単価はポーリング対象1,000メトリクスあたり月 $8 前後

GMD のコストが分かったら、CloudWatch の ListMetrics でネームスペース別のアクティブメトリクス数を数え、GMD コストを総メトリクス数で割ります。これで「1メトリクスをポーリングし続けるのに月いくら掛かっているか」が出ます。
手元の環境ではざっくり **1,000メトリクスで月 $8 前後**でした。Datadog のクロール間隔は約10分で固定なので、コストはほぼメトリクス数に比例します。リソース数が増えれば当然メトリクス数も増えるので、環境が育つにつれて自然に上がっていく類のコストです。
この単価が分かれば、あとはネームスペース別のメトリクス数を掛けるだけで「このネームスペースを外すといくら減るか」をネームスペース単位で見積もれます。

## 一番効いたのは AWS/Config

内訳を見ると、`AWS/Config` が約2,200メトリクスあり、上の単価だと **これ1つで月 $18 相当**でした。Datadog 側では一切見ていないネームスペースです。
モニター・ダッシュボードで実際に使っていたのは `aws.applicationelb.*` / `aws.ecs.service.*` / `aws.rds.*` / `aws.cloudfront.*` だけだったので、収集対象を 14 → 5 ネームスペースに絞りました。

## 設定

`datadog_integration_aws_account` の `namespace_filters.include_only` で収集対象を明示します。

```hcl
resource "datadog_integration_aws_account" "integrations" {
  for_each       = local.env
  aws_account_id = each.value.account_id

  metrics_config {
    enabled                   = true
    automute_enabled          = true
    collect_cloudwatch_alarms = true
    collect_custom_metrics    = false

    namespace_filters {
      include_only = [
        "AWS/ApplicationELB",
        "AWS/CloudFront",
        "AWS/ECS",
        "AWS/NATGateway",
        "AWS/RDS",
      ]
    }
  }
}
```

外したのは Backup / Billing / CertificateManager / Config / ECR / KMS / Route53 / S3 / WAFV2 の9ネームスペースとカスタムメトリクスです。
監視のポリシーとして、**CloudWatch Alarm でできる監視は CloudWatch 側で行い、CloudWatch だけでは難しいものを Datadog に任せる**という切り分けにしています。Datadog に取り込む必要があるのは、その Datadog に任せた対象に付随するメトリクスだけです。
外した9ネームスペースは CloudWatch 側で監視が完結していたもので、Datadog に持ってきても使われないのにポーリングされ続けていました。
plan は in-place 変更のみで、リソースの再作成は起きません。設定1箇所の変更で、外したネームスペースの分が恒久的に請求から消えます。

## 注意点

- **絞る前に参照箇所を確認する**。Datadog API でダッシュボード・モニター・SLO の定義を取得し、除外候補メトリクスへの参照がないか突き合わせました。これで当初除外候補だった `AWS/CloudFront` がダッシュボードの4ウィジェットで使われていることに気づき、対象に残しています。確認せず絞ると気づかないまま No Data になります
- 除外した期間の **Datadog 側の履歴は欠落**します。CloudWatch 側にメトリクスは残るのでリストに戻せば収集は即復旧しますが、遡って埋めることはできません
- apply 後は既存のモニターとダッシュボードが No Data になっていないか確認します

以上です。参考になれば幸いです。

## 参考

- [Datadog: AWS Integration and CloudWatch FAQ](https://docs.datadoghq.com/integrations/guide/aws-integration-and-cloudwatch-faq/)
- [Datadog: AWS インテグレーションの請求](https://docs.datadoghq.com/ja/account_management/billing/aws/)
- [Amazon CloudWatch の料金](https://aws.amazon.com/jp/cloudwatch/pricing/)
- [datadog_integration_aws_account](https://registry.terraform.io/providers/DataDog/datadog/latest/docs/resources/integration_aws_account)
