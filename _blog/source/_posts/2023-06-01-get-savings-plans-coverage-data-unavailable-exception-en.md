---
title: DataUnavailableException Error When Calling the AWS Savings Plans Coverage API
date: 2023-06-01
lang: en
translation_id: get-savings-plans-coverage-data-unavailable-exception
permalink: en/2023/06/01/get-savings-plans-coverage-data-unavailable-exception/
cover: https://i.imgur.com/ztLP9oV.png
category: AWS
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

## Overview

I ran into a DataUnavailableException error when calling the AWS Savings Plans Coverage API.

```console
$ aws ce get-savings-plans-coverage --time-period Start=2023-05-31,End=2023-06-01 --group-by Type=DIMENSION,Key=INSTANCE_TYPE_FAMILY Type=DIMENSION,Key=REGION Type=DIMENSION,Key=SERVICE

An error occurred (DataUnavailableException) when calling the GetSavingsPlansCoverage operation:
```

I checked with AWS Support about the conditions under which this occurs.

## Support's Answer

"If you have not used any Savings Plans-eligible services during the target period, the error above occurs."

## Confirming in Cost Explorer

In Cost Explorer, the Savings Plans > Coverage report also showed the following message.

> No savings plans coverage data was returned for this time period. Please adjust the time period or filters if this seems incorrect.

![](https://i.imgur.com/ztLP9oV.png)

## Summary

A DataUnavailableException error when retrieving Savings Plans coverage
= You are not using any Savings Plans-eligible services
= You have no need to purchase a Savings Plan

That was the takeaway.

That's all.
I hope you find this helpful.
