---
title: "Confluent Cloud Pricing Comparison: SaaS vs AWS Marketplace"
category: AWS
date: 2025-07-03
lang: en
translation_id: confluent-pricing-saas-vs-aws-marketplace
permalink: en/2025/07/03/confluent-pricing-saas-vs-aws-marketplace/
cover: /img/cover/2025-07-03-confluent-pricing-saas-vs-aws-marketplace.svg
tags:
  - Confluent
  - AWS
  - Kafka
---

I looked into how Confluent Cloud's pricing works, comparing the SaaS edition with the AWS Marketplace edition.

* Note: For this article, I had Claude Code research the content, summarized it into Obsidian, and turned it into a blog post. My first attempt at this workflow 💓

<!-- more -->

## 💰 The Bottom Line on Pricing

**Confluent Cloud and the AWS Marketplace edition cost the same.**

The pricing of Confluent Cloud through AWS Marketplace is identical to Confluent's direct pricing. In other words, whichever you choose, there is essentially no difference in the underlying pricing model.

## Pricing Model Details

### 🧮 The Shared Pricing Structure

Both are billed based on the following components:

1. **Kafka cluster**: hourly charges based on eCKUs (Elastic Confluent Units for Kafka), networking (per GB), and storage (per GB-hour)
2. **Connect**: connector usage is billed by throughput (per GB) and task-based pricing (per task/hour)
3. **Stream Processing**: billed by CFUs (per minute) via Apache Flink
4. **Stream Governance**: billed per environment (per hour)

### Key Differences

**Payment method and integration**:

- **SaaS edition**: paid directly to Confluent
- **AWS Marketplace edition**: billed directly through AWS Marketplace, letting you draw down existing AWS commitments and skip the procurement paperwork

**Perks**:

- The AWS Marketplace edition offers $1,000 in free credits ($400 immediately, $600 via a promo code)
- Every Confluent Cloud signup through AWS Marketplace includes white-glove onboarding, an architecture review, and on-demand training from Confluent Cloud Engineers at no additional cost

## Recommendation

Since there is no difference on the pricing side, I recommend choosing based on the following factors:

1. **If you want to integrate with your AWS environment** → AWS Marketplace edition
2. **If you want to leverage an existing AWS contract or commitment** → AWS Marketplace edition
3. **If you prefer unified billing** → AWS Marketplace edition
4. **If you want to take advantage of the initial free credits** → AWS Marketplace edition

Beyond pricing, the AWS Marketplace edition has the edge when it comes to integrating with your AWS environment and simplifying billing.

## ⚠️ If You Use PrivateLink, You Must Choose the Enterprise Plan

If you expect to handle highly sensitive data and need internal communication that never leaves the internet, you will likely need to configure PrivateLink.
In that case, you must select the Enterprise / Dedicated plan in Confluent, so be aware that you need to factor in that cost as well.

That's all.
I hope you find this helpful.
