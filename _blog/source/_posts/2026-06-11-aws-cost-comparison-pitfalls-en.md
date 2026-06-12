---
title: Pitfalls when talking about AWS cost "month-over-month"
category: AWS
date: 2026-06-11
lang: en
translation_id: aws-cost-comparison-pitfalls
permalink: en/2026/06/11/aws-cost-comparison-pitfalls/
cover: /img/cover/2026-06-11-aws-cost-comparison-pitfalls.svg
tags:
  - AWS
  - Cost
  - FinOps
---

"Cost went up/down N% from last month" — this comparison we reach for so often in cost management
can actually **appear to rise or fall even when nothing about the architecture changed** if you do it naively.

These are the "pitfalls" I hit while automating a monthly cost-comparison report, written down as a memo.
The conclusion up front: nail down the two things — **the difference in the number of days per month** and **which cost metric you pick** — and you can prevent most misreadings.

<!-- more -->

## Pitfall 1: difference in days per month (28 days vs. 31 days)

This is the most common one.

For **time-based (proportional to running hours)** services like RDS or NAT Gateway,
even if you don't change the configuration at all:

- April (30 days) → May (31 days): appears to increase by **+3.3%**
- January (31 days) → February (28 days): appears to decrease by **about -10%**

This is simply "the billed hours went up or down" — it is **not an actual change in cost**.

In fact, a cost-comparison report once flagged "RDS as the biggest driver of the month-over-month increase,"
but when I broke it down, **most of the increase was the day-count difference (May has 31 days, April 30)**, and the configuration hadn't changed.

### Fix: look at it per-day, or normalize by the number of days

```text
Instead of comparing the monthly total directly…

  per-day cost = monthly total / days in that month

Comparing this way removes the noise from hourly billing.
```

"The monthly total is up, but per-day it's basically flat" is a pattern you see constantly in cost analysis.
Before you talk about an increase or decrease, it's safer to build the habit of **first suspecting whether the day-count difference explains it**.

## Pitfall 2: which cost metric you view it through

Cost Explorer has several cost metrics, and **which one you choose changes both the number and its meaning**.

| Metric | What it represents | Best suited for |
| --- | --- | --- |
| **UnblendedCost** | The amount actually billed, as-is | Explaining the bill, actual monthly payments |
| **AmortizedCost** | RI / SP upfront payments spread across the period | Understanding the real running cost |
| **BlendedCost** | An amount averaged across the organization | Basically no need to use it |

A common misread is **viewing the monthly trend in UnblendedCost while you've purchased RIs / Savings Plans**.
Only the month you paid upfront spikes, and the following months look cheap — this makes it impossible to grasp "the reality of the monthly running cost."

**If you want to know "how much it costs each month," use AmortizedCost**;
**if you want to know "how much you'll be billed this month," use UnblendedCost** — pick by purpose.

## Pitfall 3: Credit / Refund / Tax getting mixed in

- **Credit**: amounts offset by campaigns or compensation. When this gets mixed in, it looks like things "suddenly got cheaper."
- **Refund**: when a refund lands, that month alone swings in the negative direction.
- **Tax**: noise when you want to see the pure service-usage cost.

If you want to compare "the reality of the running cost,"
**exclude Credit / Refund and drop Tax**, and the cost of the service itself becomes visible.

```text
Assumptions fixed in the comparison report (example):
  Metric:    UnblendedCost (or AmortizedCost)
  Exclude:   Credit / Refund
  Tax:       Tax excluded
  Currency:  unified in USD
```

Always write "what assumptions the figures were aggregated under" at the top of the report,
so whoever reads it later won't misread it. Even in auto-generated reports, I have these assumptions printed in a fixed header every time.

## Summary: align the "assumptions" before comparing

When talking about AWS cost month-over-month, check the following before jumping at the increase/decrease numbers:

1. Can it be explained by the **day-count difference**? (especially for hourly-billed services) → look at it per-day
2. Is the **metric suited to the purpose**? (grasping reality = AmortizedCost / billed amount = UnblendedCost)
3. Are **Credit / Refund / Tax mixed in**? → exclude them before comparing
4. **State the aggregation assumptions** in the report

Templatize these four points and you won't be jerked around by "it went up/down even though we didn't change anything,"
letting you focus only on **the cost changes that actually need attention**.
