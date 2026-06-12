---
title: Estimating Throughput Ingested into Kafka
category: AWS
date: 2025-07-17
lang: en
translation_id: aws-aurora-cdc-calculator
permalink: en/2025/07/17/aws-aurora-cdc-calculator/
cover: /img/cover/2025-07-17-aws-aurora-cdc-calculator.svg
tags: [AWS, Aurora, CDC, CloudWatch, MySQL, PostgreSQL]
category: Data Analytics
---

I built an analytics platform that streams CDC from AWS RDS into Kafka and delivers it to Iceberg tables.
In the process, I created a script that estimates the throughput ingested into Kafka from RDS metrics, so I'm sharing it here.

I needed the ingestion volume for a SaaS quote, so I submitted both the figures estimated by the script and the script itself. The vendor confirmed that the numbers were largely reasonable.

<!-- more -->

Ingestion and egress volume were the crux of the cost estimate, but I struggled because I didn't know how to estimate them, so I hope this helps someone.

## Background

CDC (Change Data Capture) is a technique that captures database changes in real time and delivers them to other systems.<br/>
When using CDC services such as SaaS offerings like AWS MSK or Confluent, proper capacity planning is important.

However, Aurora's WriteThroughput metric does not directly translate into CDC throughput.<br/>
You need an accurate estimate that accounts for engine-specific overhead.

## Tool Overview

This tool is a shell script that calculates CDC throughput for Aurora MySQL / PostgreSQL clusters from CloudWatch metrics. I created it through back-and-forth discussion with Claude Code.

### Key Features

- **Engine-specific optimization**: Uses coefficients tailored to MySQL and PostgreSQL respectively
- **Interactive operation**: Lets you select the target from multiple clusters
- **Comprehensive metrics**: Analyzes WriteThroughput, WriteIOPS, and log usage together
- **Capacity planning support**: Provides both peak and average values

## Technical Specifications

### Aurora MySQL Analysis (aurora-mysql.sh)

https://gist.github.com/kenzo0107/610df8182f47476e263bc080d164e840

**Key metrics:**
- WriteThroughput (cluster and instance level)
- WriteIOPS (cluster and instance level)
- BinLogDiskUsage (MySQL-specific)

**CDC formula:**
```
CDC throughput = WriteThroughput × 0.576
```

This coefficient accounts for MySQL's binlog format and replication overhead.

The coefficient 0.576 was derived from `actual CDC throughput / WriteThroughput metric` across multiple Aurora MySQL instances.<br/>
It may differ again when the engine version changes in the future.

### Aurora PostgreSQL Analysis (aurora-postgresql.sh)

https://gist.github.com/kenzo0107/1cb26379891ee8b14773609367d5c81e

**Key metrics:**
- WriteThroughput (cluster and instance level)
- WriteIOPS (cluster and instance level)
- TransactionLogsDiskUsage (WAL usage)

**CDC formula:**
```
CDC throughput = WriteThroughput × 0.8
```

This coefficient accounts for PostgreSQL's WAL (Write-Ahead Log) overhead.<br/>
This coefficient was derived using the same estimation method.

## Usage

### Execution Examples

```bash
# Analyze an Aurora MySQL cluster
./aurora-mysql.sh

# Analyze an Aurora PostgreSQL cluster
./aurora-postgresql.sh
```

### Sample Output

```console
=== Aurora MySQL CDC Analysis ===

Cluster: production-mysql-cluster
Writer Instance: production-mysql-cluster-writer

=== Metrics Summary (Past 7 days) ===

Cluster WriteThroughput:
  Maximum: 24,584,000 bytes/sec
  Average: 32,674 bytes/sec

Writer Instance WriteThroughput:
  Maximum: 24,584,000 bytes/sec
  Average: 65,348 bytes/sec

BinLog Disk Usage (Max): 2,147,483,648 bytes

=== CDC Throughput Estimates ===

Based on Cluster WriteThroughput:
  Peak CDC    : 14,160,505 bytes/sec (113.284 Mbps)
  Average CDC : 18,818 bytes/sec (0.151 Mbps)

Based on Writer Instance WriteThroughput:
  Peak CDC    : 14,160,505 bytes/sec (113.284 Mbps)
  Average CDC : 37,637 bytes/sec (0.301 Mbps)
```

## Implementation Notes

### Engine-Specific Optimization

**MySQL (coefficient: 0.576)**
- Binary format of the binlog
- Compression effect during replication
- Event header overhead

**PostgreSQL (coefficient: 0.8)**
- Physical log structure of the WAL
- Conversion cost during logical replication
- Checksum and metadata overhead

## Applying This to Capacity Planning

### 1. Confluent Cloud Configuration Guidelines

**Throughput settings:**
- **Maximum**: Peak CDC × 1.2–1.5 (safety margin)
- **Average**: Baseline for CDC performance monitoring

**Number of partitions:**
```
Required partitions = Peak CDC throughput / 10 MB/s per partition
```

### 2. PostgreSQL-Specific Settings

```sql
-- Enable logical replication
ALTER SYSTEM SET rds.logical_replication = 1;

-- Adjust WAL cache size
ALTER SYSTEM SET rds.logical_wal_cache = '64MB';

-- Apply settings
SELECT pg_reload_conf();
```

## Summary

It is now possible to estimate CDC throughput from Aurora's CloudWatch Metrics.<br/>
By using engine-specific coefficients, you can perform capacity planning for streaming service ingestion volume more accurately.

**Key benefits:**
- **Accuracy**: High-precision estimates based on coefficients derived from measured values
- **Efficiency**: Automation leveraging the CloudWatch API
- **Practicality**: Output in a format you can apply directly to capacity planning

By using this tool, you can achieve stable operation of your CDC pipeline and appropriate resource allocation.

That's all.<br/>
I hope you find this helpful.
