---
title: Trimming Unused Namespaces Lowers the CloudWatch Bill from Datadog's AWS Integration
date: 2026-08-18
lang: en
translation_id: datadog-aws-integration-getmetricdata-cost
permalink: en/2026/08/18/datadog-aws-integration-getmetricdata-cost/
cover: /img/cover/2026-08-18-datadog-aws-integration-getmetricdata-cost.svg
categories:
- [Monitoring]
- [AWS]
tags:
- Datadog
- CloudWatch
- AWS
- Terraform
- Cost Optimization
---

Datadog's AWS integration periodically fetches metrics for every enabled namespace via CloudWatch's GetMetricData. Metrics you never reference in Datadog still incur API charges as long as their namespace is polled.
Drop the namespaces you don't use and their share of the GetMetricData cost simply goes away. How much that is depends on how many metrics your unwatched namespaces carry, so the place to start is looking up what GetMetricData actually costs you.

<!-- more -->

## First, find out what you're paying for GetMetricData

CloudWatch's GetMetricData shows up in Cost Explorer as the usage type `CW:GMD-Metrics` (with a region prefix such as `APN1-` depending on the region).
Grouping by usage type and finding that row is the reliable way to spot it.

```sh
# List last month's CloudWatch cost by usage type and look for the GMD row
aws ce get-cost-and-usage \
  --time-period Start=2026-08-01,End=2026-09-01 \
  --granularity MONTHLY \
  --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=USAGE_TYPE \
  --filter '{"Dimensions":{"Key":"SERVICE","Values":["AmazonCloudWatch"]}}'
```

The Cost Explorer console works just as well, as does the AWS Billing and Cost Management MCP server.
The larger this line item, the more narrowing will save you. If you run Datadog and GMD barely registers, your collection scope is already tight.

## The unit cost: roughly $8/month per 1,000 polled metrics

Once you know the GMD cost, count active metrics per namespace with CloudWatch ListMetrics and divide the GMD cost by the total metric count. That gives you the monthly cost of keeping a single metric polled.
In my environment it worked out to roughly **$8/month per 1,000 metrics**. Datadog's crawl interval is fixed at about 10 minutes, so cost scales almost linearly with metric count. And metric count naturally grows with resource count, which makes this a line item that creeps up as the environment grows.
With that unit cost in hand, multiplying by per-namespace metric counts tells you what dropping each namespace would save.

## The biggest offender was AWS/Config

Breaking it down, `AWS/Config` accounted for about 2,200 metrics — **roughly $18/month on that namespace alone** at the unit cost above — for something we never look at in Datadog.
The only metrics actually used by monitors and dashboards were `aws.applicationelb.*`, `aws.ecs.service.*`, `aws.rds.*`, and `aws.cloudfront.*`, so I narrowed collection from 14 namespaces to 5.

## Configuration

Declare the collection targets with `namespace_filters.include_only` on `datadog_integration_aws_account`.

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

Dropped: nine namespaces (Backup / Billing / CertificateManager / Config / ECR / KMS / Route53 / S3 / WAFV2) plus custom metrics.
Our monitoring policy splits the work: **anything CloudWatch Alarm can handle stays on the CloudWatch side, and what CloudWatch alone can't do is left to Datadog**. The only metrics that need to reach Datadog are the ones belonging to what we handed to Datadog.
The nine namespaces I dropped were all handled entirely on the CloudWatch side — polled into Datadog month after month without anyone using them there.
The plan shows in-place updates only — no resource recreation. One config change permanently drops the excluded namespaces off the bill.

## Caveats

- **Check what references the metrics before narrowing.** I pulled dashboard, monitor, and SLO definitions via the Datadog API and cross-checked them against the exclusion candidates. That's how I caught `AWS/CloudFront` — an initial exclusion candidate — being used by 4 dashboard widgets, and kept it. Skip this check and something goes No Data without anyone noticing
- **Datadog-side history for the excluded period is lost.** Metrics remain in CloudWatch, so adding a namespace back restores collection immediately, but the gap cannot be backfilled
- After the apply, verify existing monitors and dashboards aren't showing No Data

I hope this helps.

## References

- [Datadog: AWS Integration and CloudWatch FAQ](https://docs.datadoghq.com/integrations/guide/aws-integration-and-cloudwatch-faq/)
- [Datadog: AWS integration billing](https://docs.datadoghq.com/account_management/billing/aws/)
- [Amazon CloudWatch pricing](https://aws.amazon.com/cloudwatch/pricing/)
- [datadog_integration_aws_account](https://registry.terraform.io/providers/DataDog/datadog/latest/docs/resources/integration_aws_account)
