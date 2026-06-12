---
title: Annual Reserved Purchases of AWS Resources
date: 2023-12-07
lang: en
translation_id: annual-subscription-purchase-of-aws-resources
permalink: en/2023/12/07/annual-subscription-purchase-of-aws-resources/
cover: https://i.imgur.com/Kq3llTo.png
category: AWS
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

This is a memo about making annual reserved purchases of AWS resources.

## Summary of Annual Reserved Purchases

<!-- more -->

- Reserved Instance

  - Targets:
    - RDS
    - ElastiCache
    - RedShift
    - OpenSearch
  - Purchase by specifying the following:
    - Instance type
    - Quantity
    - Upfront payment
    - Term (we specify 1 year)
  - Expiration notification
    - Configure in [RI Alert Management](https://us-east-1.console.aws.amazon.com/cost-management/home#/ri/alert)
  - Pros:
    - Easy to decide which resources to purchase for

- Savings Plans

  - Targets: compute resources (there is also a Savings Plans dedicated to EC2)
    - EC2
    - ECS
    - Lambda
  - Purchase by specifying the following:
    - Commitment amount against compute resource usage
    - Term
    - Upfront payment
  - Expiration notification
    - Configure in [Savings Plans Alert Management](https://us-east-1.console.aws.amazon.com/cost-management/home#/savings-plans/overview/alert)
  - Commitment amount
    - Calculate from past/future estimated usage, or set the AWS recommended value
  - Pros:
    - Still applies after replacing EC2 with ECS
  - Cons:
    - Hard to tell which resources the purchase was made for

- CloudFront Security Bundle
  - Targets:
    - CloudFront
    - WAF
  - Purchase by specifying the following:
    - Commitment amount against CloudFront usage
    - Term
    - Upfront payment
  - Expiration notification
    - None currently (as of 2023-12-07)
  - Commitment amount
    - Calculate from past/future estimated usage, or set the AWS recommended value

## Configuring RI Expiration Notifications

When an RI expires, you fall back to on-demand pricing, which increases costs.
To avoid only noticing after costs have risen, there is a feature that notifies you before expiration.

You can configure it from the following page.

- [RI Alert Management](https://us-east-1.console.aws.amazon.com/cost-management/home#/ri/alert)
  ![](https://i.imgur.com/Kq3llTo.png)
  ![](https://i.imgur.com/cnwPI8X.png)

- On the day of expiration: on the day of expiration
- 7 days: 7 days before expiration
- 30 days: 30 days before expiration
- 60 days: 60 days before expiration
- Email recipients: if there are multiple email addresses, separate them with `,`
  - Setting an email address issued by the Slack Email app enables Slack notifications

## Calculating Cost Savings Before and After Purchasing a Reserved Instance

For RIs, you can calculate the annual cost savings as follows.

```
On-demand price/hour × 365 days × 24 hours - (RI upfront fee + RI applied price/hour × 365 days × 24 hours)
```

The pricing for RDS, ElastiCache, and RedShift can be checked in the AWS documentation.

- [Aurora MySQL](https://aws.amazon.com/jp/rds/aurora/pricing/#Aurora_MySQL-Compatible_Edition)
- [Aurora PostgreSQL](https://aws.amazon.com/jp/rds/aurora/pricing/#Aurora_PostgreSQL-Compatible_Edition)
- [MySQL](https://aws.amazon.com/jp/rds/mysql/pricing/#RDS_for_MySQL)
- [PostgreSQL](https://aws.amazon.com/jp/rds/postgresql/pricing/#RDS_for_PostgreSQL)
- [ElastiCache](https://aws.amazon.com/jp/elasticache/pricing/#Reserved_nodes)
- [RedShift](https://aws.amazon.com/jp/redshift/pricing/#Reserved_Instance_pricing)

## Calculating Savings Plans Cost Savings

### When Using the AWS Savings Plans Recommended Commitment Value

You can check the cost savings results on the following page.

- [AWS Savings Plans Recommendations](https://us-east-1.console.aws.amazon.com/cost-management/home#/savings-plans/recommendations?lookbackPeriodInDays=SEVEN_DAYS&paymentOption=ALL_UPFRONT&scope=PAYER&spType=COMPUTE_SP&termInYears=ONE_YEAR&tokens=%5B%5D)
  ![](https://i.imgur.com/vBbJUik.png)

- Savings Plans type: the type of savings plan

  - Compute Savings Plans: a savings plan for compute resources
    - Targets:
      - EC2
      - ECS
      - Lambda
    - Advantageous when you are considering replacing EC2 with ECS
  - EC2 Instance Savings Plans: a savings plan for EC2
    - Targets:
      - EC2
    - Because it is specialized for EC2, it saves more than Compute Savings Plans
  - SageMaker Savings Plans: a savings plan for SageMaker
    - Targets:
      - SageMaker

- Term: the reserved purchase period (minimum 1 year)

  - 3-year: a 3-year reserved purchase (highest cost savings rate)
    - If you cannot foresee the current infrastructure configuration lasting 3 years, it is better to choose 1-year
  - 1-year: a 1-year reserved purchase

- Payment Option: the type of upfront payment.

  - All upfront: pay the full amount upfront (highest cost savings rate)
  - Partial upfront: pay part upfront
  - No upfront: no upfront payment

- The "Based on the past" value is the number of past operating days used to calculate the recommended value
  - If recent usage is stable, choose 7 days
  - If you routinely scale EC2 and ECS tasks up and down, choose 30 or 60 days

If usage is not expected to decrease significantly over the next year, it is fine to adopt the recommended value that AWS calculated from past usage.

### When Setting Your Own Commitment Value for AWS Savings Plans

When you set your own commitment value, the cost savings are not displayed.

- [Savings Plans: Set your own commitment value](https://us-east-1.console.aws.amazon.com/cost-management/home?region=us-east-1#/savings-plans/purchase)
  ![](https://i.imgur.com/7KIypok.png)

If usage is likely to change going forward, or if the usage amount is not stable due to scaling timing and so on, calculate and set the value yourself.

## CloudFront Security Bundle Cost Savings

You can check it on the following page.

- [CloudFront: Recommendations](https://us-east-1.console.aws.amazon.com/cloudfront/v3/home#/savings-bundle/purchase)
  ![](https://i.imgur.com/2yW95Gh.png)

- Term: 1-year only
- Payment option: Monthly only
- Auto renew: automatic renewal
  - It is often turned off for reasons such as needing to go through an approval process for purchases (personal impression)
- There is no expiration notification feature, so you need to check it as appropriate

AWS shows how much you can save based on past usage.

Decide whether to enable or disable auto renewal as appropriate.

That's all.
I hope this is helpful.
