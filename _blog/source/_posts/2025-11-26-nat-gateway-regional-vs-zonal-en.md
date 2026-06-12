---
title: NAT Gateway Regional vs Zonal - Cost and IP Address Management
date: 2025-11-26
lang: en
translation_id: nat-gateway-regional-vs-zonal
permalink: en/2025/11/26/nat-gateway-regional-vs-zonal/
category: AWS
cover: https://i.imgur.com/apEIwWh.png
---

A summary of what I investigated using Claude Code + the AWS Documentation MCP.

## Overview

In addition to the traditional **Zonal** mode, AWS NAT Gateway now offers a new [**Regional** mode](https://docs.aws.amazon.com/ja_jp/vpc/latest/userguide/nat-gateways-regional.html).<br/>
This article summarizes the characteristics of both, a cost comparison, and IP address management, based on the official AWS documentation.

<!-- more -->

## ⚠️ Important Notes

~~As of 2025.11.26, [terraform-provider-aws](https://github.com/hashicorp/terraform-provider-aws) does not support Regional NAT Gateway.~~
issue: https://github.com/hashicorp/terraform-provider-aws/issues/45151

It is now supported as of [v6.24.0](https://github.com/hashicorp/terraform-provider-aws/releases/tag/v6.24.0) 🎉

## Cost Advantages of Regional NAT Gateway

The basic pricing model is the same fee structure for both Regional and Zonal.

- **Hourly charge**: For each hour the NAT Gateway is available
- **Data processing charge**: For the amount of data processed (per GB)

### The Cost Reduction Mechanism

Regional NAT Gateway is more likely to reduce costs because it eliminates cross-AZ transfer.

- The problem with a Zonal setup
```
AZ-1a: Private Subnet → NAT Gateway (AZ-1b) → Internet
      ↑
   クロスAZデータ転送料金が発生
```

- The advantage of a Regional setup
```
AZ-1a: Private Subnet → Regional NAT Gateway (自動的にAZ-1aに展開)
AZ-1b: Private Subnet → Regional NAT Gateway (自動的にAZ-1bに展開)
      ↑
   各AZで処理され、クロスAZ転送を削減
```

#### Reducing Operational Costs

**Zonal setup:**
- Requires creating and managing public subnets
- Route table configuration for each AZ
- Manual work to expand into additional AZs

**Regional setup:**
- No public subnets required
- A single route table configuration
- Automatic AZ expansion and contraction

⚠️ If you are using the [vpc module](https://registry.terraform.io/modules/terraform-aws-modules/vpc), configuring it not to create public subnets means an Internet Gateway will not be created.<br/>
Be careful when using CloudFront VPC Origin, since it requires an Internet Gateway.

### Cases Where Cost Reduction Can Be Expected

1. Environments with **frequent multi-AZ deployments**
2. Current setups with **a lot of cross-AZ communication**
3. When operating **multiple zonal NAT Gateways**
4. When you prioritize reducing operational cost through **automation of operations**

## IP Address Management: How to Achieve a Fixed IP

When integrating with external services, there are sometimes requirements to fix your outbound IP so that the external service can allowlist it.<br/>
There are two ways to fix the IP with a Regional NAT Gateway, so be careful.

![](https://i.imgur.com/9uwU4WU.png)

- Automatic: IPs are assigned automatically and may change every time it scales.
- Manual: You specify a fixed Elastic IP.

### How to Inherit Existing IP Addresses

The official AWS documentation also provides a way to inherit IP addresses from an existing zonal NAT Gateway:

```
既存IPアドレスを再利用する手順:
1. 既存のゾーナルNAT Gatewayを削除してIPアドレスを解放
2. 解放されたIPアドレスを使用してリージョナルNAT Gatewayを作成
3. ルートテーブルをリージョナルNAT Gatewayに更新

注意: この方法では一時的にトラフィック断絶が発生するため、
      メンテナンスウィンドウでの実施を推奨
```

## Improved Performance and Availability

### Automatic High Availability

**Traditional Zonal:**
- Manual configuration required in each AZ
- Manually add a NAT Gateway when deploying to a new AZ

**Regional:**
- Detects workloads and automatically deploys into AZs
- Deployment to a new AZ completes in up to 60 minutes
- Automatically withdraws from AZs that are not in use

### Improved Scalability

| Item | Zonal NAT Gateway | Regional NAT Gateway |
|------|-------------------|----------------------|
| IP address limit | 8 per Gateway | 32 per AZ |
| Concurrent connections | 55,000 per IP | 55,000 per IP × 32 |
| AZ expansion | Manual configuration required | Automatic deployment |
| Management complexity | High | Low |

The advantages of Regional NAT Gateway look set to grow even further from here on ♪

## Considerations When Migrating

### Connection Reset

**Important note:**
> From the official AWS documentation:
> This resets existing connections. We recommend completing these steps within a maintenance window.

### Migration Strategies

#### Strategy A: Migrate with a New IP Address
```
1. 新しいリージョナルNAT Gateway作成
2. ルートテーブル更新
3. 古いゾーナルNAT Gateway削除

メリット: シンプル
デメリット: IPアドレス変更
```

#### Strategy B: Migrate While Keeping the Existing IP Address
```
1. 既存ゾーナルNAT Gateway削除（IP解放）
2. 解放されたIPでリージョナルNAT Gateway作成
3. ルートテーブル更新

メリット: IPアドレス保持
デメリット: 一時的な通信断絶
```

## Monitoring and Operations

### CloudWatch Metrics

For Regional NAT Gateway, in addition to the traditional metrics:
- Per-AZ traffic analysis
- Monitoring of automatic scaling events
- Early detection of port exhaustion

## Recommendations and Best Practices

### Cases Where Regional NAT Gateway Is Recommended

✅ **Recommended**
- New builds in multi-AZ environments
- Currently operating multiple zonal NAT Gateways
- Prioritizing operational automation
- Environments with a lot of cross-AZ communication

❌ **Not recommended**
- The private NAT Gateway feature is required
- Small-scale systems in a single AZ

### Guidance for Choosing IP Address Management

| Requirement | Recommended mode | Reason |
|------|-----------|------|
| Fixed IP required | Manual | Can specify a particular Elastic IP |
| Cost is top priority | Automatic | Cost reduction through AWS optimization |
| Security-focused | Manual | Manage external access by controlling the IP address |
| Simplified operations | Automatic | Operations-free through full automation |

## Summary

Compared to the traditional zonal NAT Gateway, Regional NAT Gateway offers:

**On cost:**
- Reduced cross-AZ data transfer charges
- Reduced operational costs
- Cost optimization by consolidating multiple NAT Gateways

**On operations:**
- Automatic high availability
- Simplified management
- Automated AZ expansion

**On IP address management:**
- A fixed IP can be achieved with Manual mode
- Existing IP addresses can also be inherited
- Meets security requirements as well

In particular, in **environments operating multiple zonal NAT Gateways**, migrating to Regional NAT Gateway can be expected to bring significant cost reductions and improved operational efficiency.

**The currently recommended approach:**
- **Existing Terraform projects**: Continue operating with zonal NAT Gateway and wait for Terraform support to begin
- **New projects**: Create a Regional NAT Gateway with the AWS CLI, and migrate to Terraform management in the future
- **Cost-focused**: Consider migrating to Regional NAT Gateway right away

When considering a migration, it is important to thoroughly analyze your current communication patterns and integration requirements with external systems, and to choose the appropriate mode (Automatic or Manual).

## Reference Links

- [AWS NAT Gateway Documentation](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html)
- [Regional NAT Gateway Documentation](https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateways-regional.html)
- [AWS CLI NAT Gateway Commands](https://docs.aws.amazon.com/cli/latest/reference/ec2/create-nat-gateway.html)
- [Terraform AWS Provider - NAT Gateway](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/nat_gateway)

---

*This document was created based on research of the official AWS documentation and the Terraform Provider; for the latest information, please refer to the official documentation. For the timeline of Terraform support, please check HashiCorp's roadmap.*
