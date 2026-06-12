---
title: RDS Performance Insights Reaches EOL in June 2026 — Planning the Migration to Database Insights
date: 2025-12-05
lang: en
translation_id: migrate-from-performance-insights-to-database-insights
permalink: en/2025/12/05/migrate-from-performance-insights-to-database-insights/
category: AWS
cover: https://i.imgur.com/wzeyuhw.png
---

## Overview

Performance Insights is scheduled to be deprecated on June 30, 2026.

{% linkPreview https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/USER_PerfInsights.html _blank %}

> AWS has announced the end-of-life date for Performance Insights: June 30, 2026.

To keep using functionality equivalent to Performance Insights, you need to migrate from Performance Insights to CloudWatch Database Insights.

This post summarizes the differences in features and cost between them.

<!-- more -->


## Mode Comparison

| Item | Performance Insights | Database Insights Standard | Database Insights Advanced |
|------|---------------------|---------------------------|----------------------------|
| **Cost** | $4.76/month (2vCPU) | Free | $18.25/month (2vCPU) |
| **Retention** | 7 days–15 months | 7 days | 15 months |
| **Fleet monitoring** | ❌ | ✅ | ✅ |
| **Unified dashboard** | ❌ | Basic | ✅ |

Database Insights offers a Standard mode and an Advanced mode.

## Database Insights Standard vs. Advanced Mode Feature Comparison

### Common Features (Standard & Advanced)
- ✅ Dimensional analysis of DB Load
- ✅ Query, graph, and alert on database metrics (7-day retention)
- ✅ Access control for sensitive dimensions such as SQL text

### Advanced Mode Exclusive Features

| Feature Category | Feature Details | Supported Engines | Prerequisites |
|-------------|---------|-------------|----------|
| **Monitoring & Analysis** | Detailed OS process monitoring | All engines | Enhanced Monitoring required |
| **Fleet Management** | Define and save fleet-wide monitoring views | All engines | - |
| **SQL Analysis** | SQL lock analysis (15-month retention) | Aurora PostgreSQL only | - |
| **Execution Plans** | SQL execution plan analysis (15-month retention) | Aurora PostgreSQL, RDS Oracle, RDS SQL Server | - |
| **Query Statistics** | Per-query statistics visualization | All engines | - |
| **Slow Queries** | Slow query analysis | All engines | CloudWatch Logs output required |
| **Application** | CloudWatch Application Signals integration | All engines | - |
| **Unified Dashboard** | Unified view of metrics, logs, events, and apps | All engines | Log output required |
| **Automatic Integration** | Automatic import of Performance Insights metrics | All engines | - |
| **Event Monitoring** | Display RDS events in CloudWatch | All engines | - |
| **On-Demand Analysis** | Performance analysis for arbitrary time ranges | Aurora PostgreSQL/MySQL, RDS PostgreSQL/MySQL/MariaDB/Oracle | - |

## Important Limitations

### Engine-Dependent Features
- **SQL lock analysis**: Aurora PostgreSQL only
- **Execution plan analysis**: Aurora PostgreSQL, RDS Oracle, RDS SQL Server only
- **On-demand analysis**: MySQL family, PostgreSQL family, and Oracle only (SQL Server excluded)

### Prerequisites
1. **Enabling Advanced Mode**: Performance Insights must be enabled
2. **Slow query analysis**: Output to CloudWatch Logs must be configured
3. **Unified dashboard**: Log output configuration is required (to display logs)
4. **OS process monitoring**: Enhanced Monitoring must be enabled

### Regional Limitations
- Advanced Mode features are not available in all AWS regions

## Selection Guide

### When Standard Mode Is a Good Fit
- Basic DB monitoring is sufficient
- You want to keep costs down
- 7-day data retention is sufficient

### When Advanced Mode Is Needed
- You need centralized, fleet-wide monitoring
- You need long-term trend analysis (15 months)
- You need SQL execution plan or lock analysis
- You need integrated monitoring with your applications

## Summary

- Advanced Mode is feature-rich, but it comes with engine dependencies and prerequisites.
- Starting with Standard mode and switching to Advanced when you want to investigate bottlenecks in more detail is a reasonable approach.

Review your organization's monitoring requirements and target engines, then choose the appropriate mode.

## References

### Database Insights
- [CloudWatch Database Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Database-Insights.html)
- [Monitoring Amazon RDS databases with CloudWatch Database Insights](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_DatabaseInsights.html)
- [Considerations for Database Insights for Amazon RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_DatabaseInsights.Considerations.html)

### Pricing Information
- [Amazon CloudWatch Pricing](https://aws.amazon.com/cloudwatch/pricing/)
- [Performance Insights Pricing](https://aws.amazon.com/rds/performance-insights/pricing/)

### Migration & Comparison Information - AWS re:Post
- [Transitioning from RDS Performance Insights to CloudWatch Database Insights](https://repost.aws/articles/AR6gPnT__dQdq81Md6Q_A1mA/transitioning-from-rds-performance-insights-to-cloudwatch-database-insights)
- [Performance Insights to CloudWatch Database Insights](https://repost.aws/articles/ARelTfHKHvTBC78mc-CNVqmA/performance-insights-to-cloudwatch-database-insights)

### Third-Party Articles
- [AWS Performance Insights has been deprecated: What to know about CloudWatch Database Insights - pganalyze](https://pganalyze.com/blog/aws-performance-insights-deprecation-database-insights-comparison)
- [Transitioning from RDS Performance Insights to CloudWatch Database Insights - DoiT](https://www.doit.com/blog/transitioning-from-rds-performance-insights-to-cloudwatch-database-insights/)

### Technical Specifications - Performance Monitoring
- [Performance Insights counter metrics](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PerfInsights_Counters.html)
- [Amazon CloudWatch metrics for Amazon RDS Performance Insights](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PerfInsights.Cloudwatch.html)

### Enhanced Monitoring
- [Enhanced Monitoring for Amazon RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_Monitoring.OS.html)
