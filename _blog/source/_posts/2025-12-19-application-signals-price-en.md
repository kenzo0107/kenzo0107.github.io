---
title: Pricing Model of AWS CloudWatch Application Signals
date: 2025-12-19
lang: en
translation_id: application-signals-price
permalink: en/2025/12/19/application-signals-price/
category: AWS
cover: https://i.imgur.com/Ozk9mO9.png
---

Based on the pricing data retrieved via the [AWS Pricing MCP](https://github.com/awslabs/mcp/tree/main/src/aws-pricing-mcp-server), the pricing model for AWS CloudWatch Application Signals is as follows.

<!-- more -->

## Application Signals Signal Pricing

A tiered pay-as-you-go model.

- First 100 million signals: $1.50 / 1 million signals
- Next 900 million signals (100 million to 1 billion): $0.75 / 1 million signals
- Over 1 billion signals: $0.30 / 1 million signals

## Application Signals Bytes Data Ingestion Pricing

A tiered model based on data volume.

- First 10TB: $0.35 / GB
- Next 20TB (10TB to 30TB): $0.20 / GB
- Over 30TB: $0.15 / GB

### Characteristics of the Pricing Model

1. Fully pay-as-you-go
  - You are billed only for what you use
  - No minimum usage charge
2. Tiered discounts
  - The unit price decreases as usage grows
  - Improved cost efficiency at large scale
3. Region-specific pricing
  - Prices for the Tokyo region (ap-northeast-1)
  - May differ slightly in other regions

## Cost Examples (Monthly Usage)

| Usage Scale | Number of Signals | Data Volume | Estimated Monthly Cost |
| --- | --- | --- | --- |
| Small | 10 million | 100GB | $50-70 |
| Medium | 50 million | 500GB | $250-300 |
| Large | 200 million | 2TB | $900-1,100 |

## Related Costs

Additional cost factors when using Application Signals.

- CloudWatch metrics charges
- X-Ray trace charges (if enabled)
- Charges for related services such as Lambda, ECS, and EKS
- Data transfer charges to other regions

Application Signals is a relatively new service that provides powerful capabilities for improving application observability, but keep in mind that costs accumulate in proportion to usage.

That's all.<br>
I hope you find this helpful.
