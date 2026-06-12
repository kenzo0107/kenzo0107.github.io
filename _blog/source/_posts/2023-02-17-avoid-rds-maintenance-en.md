---
title: How to Avoid an RDS DB Maintenance
date: 2023-02-17
lang: en
translation_id: avoid-rds-maintenance
permalink: en/2023/02/17/avoid-rds-maintenance/
category: AWS
cover: https://i.imgur.com/7h0nRNw.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

This is a summary of how I deferred a mandatory RDS maintenance that suddenly appeared.

<!-- more -->

## Overview

A DB engine version upgrade maintenance suddenly appeared, scheduled to be applied automatically in `2 days`.

Normally AWS sends a notification email more than a month in advance so you have plenty of time to prepare, but this one came so abruptly that I asked an AWS SA and AWS Support how to avoid it.

## Conclusion

I was able to defer it by changing the maintenance window.

![](https://i.imgur.com/7h0nRNw.png)

The original `Apply date` was `2023-02-19 04:30`.

Since today was `Friday, February 17, 2023`,
I changed the next maintenance window to `Thursday`, which is earlier in the week than the current day.

In terraform, the change looks like this:

```
- maintenance_window = "sat:19:30-thu:20:00"
+ maintenance_window = "thu:19:30-thu:20:00"
```

![](https://i.imgur.com/8kiXsyT.png)

As a result, the `Apply date` changed to `Thursday, February 24, 2023`.

### Verifying with aws-cli

![](https://i.imgur.com/IXctjg7.png)

When I ran `aws rds describe-pending-maintenance-actions`,
the `AutoAppliedAfterDate` and `CurrentApplyDate` had been successfully updated,
and since there was no `ForceApplyDate`,
I confirmed that the maintenance had been successfully deferred.

Just to be sure, I checked with the SA, and they said it looked fine.

## The AWS documentation describes how to defer maintenance, but...

[Deferring maintenance actions](https://aws.amazon.com/jp/premiumsupport/knowledge-center/rds-maintenance-window/#Defer_maintenance_actions)

When I tried to follow the steps above, there was no "Defer upgrade" entry in the Action menu.

* It wasn't in the English version of the documentation either.

The AWS SA's response about this was as follows:

> I haven't been able to reproduce it in my own environment either, and I couldn't find the documentation, so there may be cases where it can be applied and cases where it can't.
> It is clearly stated that an upgrade that has already started cannot be deferred (sorry I can't give you a definitive answer).

This case may have been one where it could not be applied.

## Can sudden maintenance really happen? And how can you detect it?

AWS's answer was as follows:

> Depending on the urgency of the patch and several other factors, there are cases where notification is given with plenty of lead time, and cases where it is scheduled suddenly without any advance notice.

> We also checked internally, but unfortunately there is no clear SLA such as notifying you by N days in advance.

If I had relied solely on the maintenance email notifications, I would have come dangerously close to an unintended service outage.

## Detection method

Detecting maintenance events with EventBridge and then using Chatbot is, I think, the quickest approach.

Reference: [Notifying Slack of EC2 and other maintenance schedules via AWS Chatbot](https://blog.serverworks.co.jp/aws-health-event-to-slack-via-aws-chatbot)

Personally, since it's hard to grasp the details of maintenance events, I format them with Lambda before sending them to Slack.
The Lambda runs daily and keeps notifying until the maintenance event disappears.

That's all.
I hope this is helpful.
