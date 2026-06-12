---
title: How Much Aurora Serverless v2 Capacity Equals an Aurora PostgreSQL db.t4g.medium?
date: 2025-12-01
lang: en
translation_id: aws-aurora-rds-cluster-instance-vs-serverless-v2
permalink: en/2025/12/01/aws-aurora-rds-cluster-instance-vs-serverless-v2/
category: AWS
cover: https://i.imgur.com/7XgGjaF.png
---

## Overview

When considering adopting Aurora Serverless v2, I investigated how much capacity db.t4g.medium, the smallest instance class for an Aurora RDS Cluster Instance, corresponds to. This post summarizes those findings.

<!-- more -->

## Capacity Calculation

### db.t4g.medium Specs

- **vCPU**: 2
- **Memory**: 4 GiB
- **ACU equivalent**: 2 ACU 👀✨

## Cost Comparison (ap-northeast-1, as of December 1, 2025)

This assumes the cheaper Aurora PostgreSQL Standard option.

|  | USD |
|---|---|
| RI | 710 |
| Serverless v2 (full operation for 1 year) | 2,628 |
| Serverless v2 (stopped on weekday nights, weekends, and holidays) | 1,176 |

RI is cheaper, but you need to manage scaling yourself with mechanisms such as CloudWatch Alarms.

### Aurora PostgreSQL Provisioned Instance db.t4g.medium

- Aurora Standard: 0.113 USD / hour
- Aurora I/O-Optimized: 0.147 USD / hour

#### Aurora Standard for 1 Year

```
989.88 USD
= 0.113 USD / hour x 24 hour x 365 days
```

#### Using a Reserved Instance

```
710 USD
```

### Aurora PostgreSQL Serverless v2

- Aurora Standard: 0.15 USD / ACU / hour
- Aurora I/O-Optimized: 0.20 USD / ACU / hour

#### Aurora Standard for 1 Year

```
2,628 USD
= 2 ACU x 0.15 USD / ACU x 24 hours x 365 days / hour
```

If you expect zero capacity during the following hours (3,920 hours/year):
- Weekdays 23:00 - 07:00
- Weekends and holidays

```
1,176 USD
= 2 ACU x 0.15 USD / ACU / hour x 3,920 hours
```


## Conclusion

I think the biggest drawback of using Aurora Serverless is that you can't predict the actual workload, which can lead to unintended cost increases. In that case, you can calculate the cost benefit only after testing against an assumed real-world workload.

The benefit of reducing the operational burden of managing scaling is significant, so I think this is a major advantage for adopting it.

In any case, testing matters!

## References

- [Using Aurora Serverless v2 - Amazon Aurora](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html)
- [Hardware specifications for DB instance classes for Aurora](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Concepts.DBInstanceClass.Summary.html)
- [Amazon Aurora Pricing](https://aws.amazon.com/rds/aurora/pricing/)
