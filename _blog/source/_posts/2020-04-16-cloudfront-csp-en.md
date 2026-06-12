---
title: Basic Authentication and CSP with Lambda@Edge
tags:
  - AWS
  - Lambda
date: 2020-04-16
category: AWS
lang: en
translation_id: cloudfront-csp
permalink: en/2020/04/16/cloudfront-csp/
cover: https://docs.aws.amazon.com/ja_jp/AmazonCloudFront/latest/DeveloperGuide/images/cloudfront-events-that-trigger-lambda-functions.png
---

This is a story about handling Basic authentication and CSP with Lambda@Edge.

<!-- more -->

## What is CSP?

- A security layer you can add to detect and mitigate the impact of certain types of attacks, such as XSS and Data Injection.

Reference: [Content Security Policy (CSP)](https://developer.mozilla.org/ja/docs/Web/HTTP/CSP)

## What can it do?

It lets you constrain content so that it can only be executed from specific domains or protocols.
This makes it impossible for unintended communication to occur.

## How do you configure it?

### Add information to the header

Set it in the HTTP header with Content-Security-Policy : policy.

### Specify the policy using the <meta> element

```
<meta http-equiv="Content-Security-Policy" content=" policy ">
```

## Why do it with Lambda@Edge?

```
CloudFront --> ALB --> ECS - Rails
```

I usually serve services with the configuration above, so I attempted to address CSP by setting the CSP policy in the header information of the response from the origin Rails (Origin Response) that CloudFront receives.

There is also a way to set it in Rails itself, which I will describe later.

## Setting it up with terraform

https://github.com/kenzo0107/sample-lambda-edge

- templates/csp.js
  - Sets the CSP measures on the Origin Response
- templates/basic_auth.js
  - Sets Basic authentication on the Viewer Request

## How was it after actually setting it up?

When using Vue on the front end with Rails, there were cases where you needed to specify `script-src 'unsafe-eval'`, and the front end wouldn't work at all.

I frequently ran into problems with CSP settings depending on the third parties or front end being used.

This made me think there could be situations where it works in the development environment but not in an environment where Lambda@Edge is in effect unless you configure it on the Rails side. So while you *can* do it with Lambda@Edge, I came to feel it might be better to leave it to the application side.

## References

[MDN web docs - Content-Security-Policy](https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/Content-Security-Policy)
