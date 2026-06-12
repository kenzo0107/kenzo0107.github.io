---
title: You are not subscribed to this service
tags:
- AWS
date: 2020-10-06
lang: en
translation_id: aws-startup
permalink: en/2020/10/06/aws-startup/
cover: https://i.imgur.com/CWMs1IV.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

## Overview

I was told "Your AWS account has been created!", but when I tried running terraform, I got the following error.
This is a memo of how I dealt with it at the time.

<!-- more -->

```
Error: Error fetching Availability Zones: OptInRequired: You are not subscribed to this service. Please go to http://aws.amazon.com to subscribe.
```

## Conclusion

The cause was that the AWS sign-up had not been completed.

I accessed [My Service Quotas](https://console.aws.amazon.com/servicequotas/home) from the menu, and once I completed identity verification, it was resolved.

![](https://i.imgur.com/CWMs1IV.png)
