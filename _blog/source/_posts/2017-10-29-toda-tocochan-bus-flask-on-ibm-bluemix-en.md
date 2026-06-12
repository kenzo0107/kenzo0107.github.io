---
layout: post
title: Migrating the toda-tocochan-bus Flask app to IBM Bluemix
date: 2017-10-29
lang: en
translation_id: toda-tocochan-bus-flask-on-ibm-bluemix
permalink: en/2017/10/29/toda-tocochan-bus-flask-on-ibm-bluemix/
tags:
  - Python
  - flask
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171029/20171029095513.png
---

I moved from GCP to IBM Bluemix!

[How many minutes until the toco-chan bus?](https://toda-tocochan-bus.mybluemix.net/)

## Overview

After moving from Sakura VPS to GCP,
this time I migrated from GCP to IBM Bluemix.

Here is the earlier story from when I was running it on GCP:

{% linkPreview https://kenzo0107.github.io/2017/08/03/2017-08-03-tutorial-of-gke _blank %}

On GCP, once I put an LB in front of GKE the price shot up dramatically
and I ended up exceeding the free tier (>\_<).

My aim was somehow to keep running it at a low cost.

## Why IBM Bluemix instead of Heroku?

The great thing about IBM Bluemix is how feature-rich it is.
You get Kibana for free, available by default.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171029/20171029101148.png" width="100%">
</div>

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171029/20171029101853.png" width="100%">
</div>

It also supports integration with Git.

Below I have put together the steps, assuming you are working on a Mac.

## Prerequisites

- Sign up for IBM Bluemix in advance

[Signup IBM Bluemix](https://console.bluemix.net/registration/)

- clone

```sh
macOS%$ git clone https://github.com/kenzo0107/toda-tocochan-bus-on-ibmbluemix
macOS%$ cd toda-tocochan-bus-on-ibmbluemix
```

- Install the Cloud Foundry CLI

```sh
macOS%$ brew tap cloudfoundry/tap
macOS%$ brew install cf-cli
```

## Deploy

```sh
macOS%$ cf api https://api.ng.bluemix.net
macOS%$ cf login
macOS%$ cf push <application name>
```

- The API differs depending on the Region.

| Region        | API URL                       |
| ------------- | ----------------------------- |
| US South      | https://api.ng.bluemix.net    |
| United Kingdom | https://api.eu-gb.bluemix.net |

## Conclusion

Thanks to the Cloud Foundry CLI, the migration was easy too ♪

I thought that if I could do things like restricting access to specific IPs or domains for security,
it could be usable as a method for commercial use.

I asked them about that point, but I have not heard back for about two weeks, so I will reach out again.
↑ Questions were English-only!

I hope their support gets strengthened.

That's all.
I hope this is helpful.
