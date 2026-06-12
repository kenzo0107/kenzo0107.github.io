---
title: How to Delete a Datadog Child Organization
category: Monitoring
date: 2025-01-15
lang: en
translation_id: how-to-delete-datadog-child-org
permalink: en/2025/01/15/how-to-delete-datadog-child-org/
cover: /img/cover/2025-01-15-how-to-delete-datadog-child-org.svg
---

As a personal note,
this post summarizes how to delete a Datadog child organization.

## Steps

### 1. Delete monitors, API Keys, and Application Keys

- If monitors remain, deletion may not be possible.
- Deleting the API Keys stops data collection from Datadog Agents that use those API Keys, which is intended to prevent unintended costs.

### 2. Contact support

- There is no API for deleting a child organization. As noted in the documentation, you need to contact Datadog support to have it deleted.
- https://docs.datadoghq.com/ja/account_management/#%E7%B5%84%E7%B9%94%E3%81%AE%E3%82%A2%E3%82%AB%E3%82%A6%E3%83%B3%E3%83%88%E3%82%92%E7%84%A1%E5%8A%B9%E3%81%AB%E3%81%99%E3%82%8B
- Since no API exists for deleting a child organization, even with terraform-provider-datadog, deleting the resources that manage the child organization will not remove the child organization itself.

It depends on support's workload, but it took roughly one week to have it deleted.

That's all.
