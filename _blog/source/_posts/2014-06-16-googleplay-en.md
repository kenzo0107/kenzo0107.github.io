---
layout: post
title: "\"The item you requested could not be found\" on Google Play"
date: 2014-06-16
category: Infrastructure
lang: en
translation_id: googleplay
permalink: en/2014/06/16/googleplay/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140616/20140616214045.png
tags:
- Android
- GooglePlay
---

## Overview

As of 2014.05.30, the specification changed so that you can no longer run billing tests on the pre-release draft version.

As a result, when you try to run a test purchase the way you used to, you now get the message
"<span style="color: #e2241a">The item you requested could not be found</span>".

## Solution
Upload the APK to the draft or beta version
and publish it to testers only.

Added 2015/02/20
When uploading an APK, be careful about the Version.
This assumes an app where you upload the APK at Version 1 (1.0),
and once the billing test is complete you release it.

Be aware that if you think "I'd like to tweak it a bit,"
make the fix, and then try to upload the same version,
the upload will not go through.

## Details

### (1) Alpha test: Upload the APK file to the beta version.
*Added 2015/02: It seems billing tests can no longer be run unless you publish to the beta version.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140616/20140616214045.png" width="100%">
</div>

↓

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140616/20140616214047.png" width="100%">
</div>

### (2) Register testers

- Click the "Manage list of testers" link, register a group e-mail address, and invite the target devices.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140616/20140616214048.png" width="100%">
</div>



### (3) Confirm that no APK file has been uploaded to the production version

If you upload an APK file to the production version, the app will be published to the public!

### (4) Publish the app

It is published as the alpha/beta version, and the app is released only to testers.

Purchase test completed successfully ♪
