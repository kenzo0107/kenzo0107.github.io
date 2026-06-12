---
title: What You Can Do by Querying the Application Signals MCP
date: 2025-12-17
category: AWS
lang: en
translation_id: what-application-signals-mcp-can-do
permalink: en/2025/12/17/what-application-signals-mcp-can-do/
categories:
- [AWS]
- [AI]
cover: https://i.imgur.com/XccV9Ug.png
---

AIOps enhancements continue to roll out in CloudWatch Application Signals, and expectations are running high.

To see what the Application Signals MCP can actually do, I sent the following query exactly as described in the [AWS documentation](https://aws.amazon.com/jp/blogs/news/enhance-your-aiops-introducing-amazon-cloudwatch-and-application-signals-mcp-servers/).

> What questions can I ask about CloudWatch or Application Signals MCP Servers?

I received the response below, so I'm keeping it here as a personal reference.

<!-- more -->

---

⏺ Great! The MCP server for AWS Application Signals is now available.

You can ask questions like the following:

## 🎯 Service Audit / Health Check

### Basic service audits

- Audit the health of all services
- Check the status of payment-related services
- Audit all services running on the EKS cluster
- Check the service status from last night

### Detailed analysis by operation

- Audit the latency of the GET operation on the payment service
- Investigate the performance of a specific API endpoint
- Identify operations with high error rates

## 📊 SLO (Service Level Objective)

### SLO management

- List all configured SLOs
- Check for SLO violations
- Show me the detailed configuration of a specific SLO
- Perform a root cause analysis of payment-related SLO violations

## 🔍 Trace / Log Analysis

### Problem investigation

- Investigate the cause of errors occurring in a specific service
- Analyze the cause of high latency using traces
- Identify dependency issues
- Find outlier hosts

### Log search

- Search error logs for a specific time window
- Investigate communication errors between services

## 📈 Metrics / Performance Analysis

### Service metrics

- Retrieve the latency metrics of a specific service
- Check the trend of error rates over time
- Analyze performance trends over the past week

## 🚨 Failure Analysis / Root Cause Investigation

### Incident response

- Investigate new errors that appeared after a deployment
- Identify issues with inter-service dependencies
- Audit dependencies on S3
- Check the quota usage of Tier 1 services

## 🕸️ Synthetics Canary Analysis

### Canary monitoring

- Analyze canary failures for [canary name]
- Investigate canary failure patterns

## Concrete Example Questions

- Overall service health check
    "Audit the health of all services"

- Detailed analysis of a specific service
    "Perform a root cause analysis of the latency issue on the GET operation of payment-service"

- Investigating SLO violations
    "Investigate SLO violations since yesterday and analyze the root cause"

- Identifying performance problems
    "Identify services with slow response times and check their error logs"

- Investigating dependency issues
    "Identify services that have connectivity problems with S3"

That's all.<br/>
I hope you find this helpful.
