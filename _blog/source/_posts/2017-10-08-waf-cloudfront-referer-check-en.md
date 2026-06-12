---
layout: post
title: Referer Checking with WAF + CloudFront (Block Hotlinking)
date: 2017-10-08
lang: en
translation_id: waf-cloudfront-referer-check
permalink: en/2017/10/08/waf-cloudfront-referer-check/
tags:
  - AWS
  - WAF
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005180531.png
---

## Overview

This is a summary of how I implemented referer-based access control on CloudFront using AWS WAF (Web Application Firewall).

I introduced it as a measure to block hotlinking (direct linking).

The steps are as follows.

### Click the "Go to AWS WAF" button

Navigate to Services > WAF & Shield and click Go to AWS WAF.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005174955.png" width="100%">
</div>

### Click the "Configure Web ACL" button

We'll configure an ACL (Access Control List).

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005180856.png" width="100%">
</div>

### Review the overview

Without checking anything in particular, click the Next button.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005181044.png" width="100%">
</div>

### Web ACL settings

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005181315.png" width="100%">
</div>

Configure the following settings, then click the Next button.

| _Item_                    | _Value_                                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Web ACL name              | (Any value) In this example I set the CloudFront CNAME.                                                                   |
| CloudWatch metric name    | Automatically filled in when you enter the Web ACL name. Change it only if you want a different value.                    |
| Region                    | Select Global (CloudFront).                                                                                              |
| AWS resource to associate | The place to select the target CloudFront. If you target a CloudFront distribution that is in production, set it later. |

### Create a condition

Since we'll use string matching as the condition this time, click the `Create condition` button under String match conditions.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005181800.png" width="100%">
</div>

### Create a string match condition

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005181926.png" width="100%">
</div>

Configure the following and click the `Add filter` button.
If you have multiple filters, repeat Add filter.

| _Item_                           | _Value_                  |
| -------------------------------- | ------------------------ |
| Name                             | (Any value)              |
| Part of the request to filter on | Header                   |
| Header                           | Referer                  |
| Match type                       | Contains                 |
| Transformation                   | Convert to lowercase     |
| Value to match                   | Set the target domain    |

<br/>

#### After `Add filter`, click the `Create` button.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005182327.png" width="100%">
</div>

#### Click the Next button

What you added isn't reflected immediately.
Just click the `Next` button as is.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005182446.png" width="100%">
</div>

### Create a rule

Click the `Create rule` button.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005182608.png" width="100%">
</div>

#### Attach the condition to the rule

Set the Name and CloudWatch metric name,
and add the condition with Add conditions.

After that, click the `Create` button.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005182641.png" width="100%">
</div>

### Deny access to requests that don't match the rule

As expected, the rule isn't reflected yet. But continuing on,
check `Block all requests that don't match any rules` and click the `Review and create` button.

* If you don't want this applied to the target CloudFront, you need to deselect the resource where CloudFront is selected.
<span style="color: #ff0000">* You can associate it at the end, so I think you shouldn't do it here.</span>

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005182806.png" width="100%">
</div>

### Create after reviewing the entered content on the confirmation page

Click the `Confirm and create` button.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005183423.png" width="100%">
</div>

### Edit the target web ACL

Select it from WEB ACLs and click the `Edit web ACL` button.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005183628.png" width="100%">
</div>

#### Edit the web ACL

1. Select the rule you created
2. Click the `Add rule to web ACL` button
3. Select Allow
4. Click the `Update` button

[f:id:kenzo0107:20171005183720p:plain]

### Associate CloudFront

Click the `Add association` button.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005183720.png" width="100%">
</div>

#### Associate CloudFront with the web ACL

Select the target CloudFront in Resource and click the `Add` button.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005184119.png" width="100%">
</div>

That's it. After a few minutes, referer checking via WAF + CloudFront will be in effect.

### Verifying access

In my own environment,
I edited the local /etc/hosts, placed a link from the target domain to the CloudFront CNAME, and verified it.

When I accessed a resource directly via the CloudFront CNAME domain,
I confirmed that an error page like the one below was displayed.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005184505.png" width="100%">
</div>

### Making it a bit more user-friendly

The error page above can be customized by going to CloudFront > Error Pages and specifying a path on S3 with `Create Custom Error Response`.

By all means, preparing an error page that matches your site's concept will make for a more user-friendly delivery.

That's all.
I hope this is helpful.
