---
layout: post
title: Phone Notifications with Twilio
date: 2015-12-08
lang: en
translation_id: tellme-twillio
permalink: en/2015/12/08/tellme-twillio/
tags:
  - Monitoring
  - Twilio
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20151208/20151208143258.png
---

## Overview

Even if you push incident alerts to email or Slack, people rarely check work-related messages on their days off.<br/>
So, to make alerts harder to miss,<br/>
we decided to introduce Twilio for phone notifications.

First, here is a simple walkthrough of how to get started.<br/>

* Twilio's site includes code samples, which made it easy to get up and running.

## Steps

### 1. Access Twilio

Access Twilio from the link below.

[http://twilio.kddi-web.com](http://twilio.kddi-web.com)

### 2. Sign Up

Enter your name, email, and password (with upper- and lower-case alphanumeric characters),

select what you want to use it for and in which language,

and click "Get Started."

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20151208/20151208104015.png" width="100%">
</div>

The Japanese phrase "始めましょう" (Let's get started) isn't quite from the user's point of view, so it feels a bit off.

### 3. Account Verification

There are two verification methods.

- Have a confirmation code sent to your phone number via SMS
- Receive a call from Twilio at your phone number and enter the confirmation code on the dial pad.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20151208/20151208104800.png" width="100%">
</div>

With the latter, a text-to-speech robot from Twilio calls you,<br/>
so if you want to try out what the notification feels like, definitely choose the latter.<br/>

The intonation isn't exactly smooth, but it conveys its message with more heart than anyone.

### 4. Make a Call from Twilio

After account verification, I was taken to the top of the "Programmable Voice" page for the Twilio product.
From the menu, click `Tools` to go to the Tools page.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20151208/20151208110143.png" width="100%">
</div>

#### Specifying To

In the API Explorer under Voice Calls > Calls > Make a Call,
enter your verified phone number in the `required` `To` field.

Note that for Japanese numbers (+81),<br/>
a number like `090********`<br/>
should have its leading `0` removed and `+81` added as a prefix,<br>
becoming `+8190********`, so be careful.<br/>

#### Specifying the URL

In the `optional` `Url` field, you can specify, as a URL,<br/>
the behavior that occurs when Twilio's call is received and when a dial key is pressed.

If you don't have a suitable URL handy,<br/>
any arbitrary URL like the following will do.

`http:/hogehoge.hogehoge.co.jp`

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20151208/20151208110552.png" width="100%">
</div>

#### Triggering the Notification

Click the `Make Request` button at the bottom of the page.

<span style="color: #d32f2f">*</span> Although it says `* Charges will apply`, you won't actually be billed during the Trial.<br/>
<span style="color: #d32f2f">*</span> When you upgrade the same account, you'll also be charged for the calls you made, so once testing is complete, we recommend obtaining a separate account.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20151208/20151208112301.png" width="100%">
</div>

#### Receiving the Call

You should receive a call from Twilio.<br/>
When you enter a dial key, the program specified by the URL runs, but<br/>
since we entered an arbitrary URL,<br/>
you should hear the notification<br/>
`An application error has occurred. Ending the call.`

When you actually use this from a program,<br/>
the flow is to receive the key input at the specified URL and then control the subsequent behavior.<br/>

## A Real-World Example

In a project I worked on, I built a mechanism that uses Twilio to report (escalate) incidents detected by Zabbix to the person in charge by phone.

> Example) You can implement behavior like the following.<br/>
> Zabbix detects an incident <br/>
> ↓<br/>
> Twilio<br/>
> ↓ call<br/>
> Responder <br/>
> ↓ Responder presses "1"<br/>
> The program at the specified URL runs<br/>
> ↓ Receives "1" and notifies Zabbix that the incident can be handled<br/>
> Zabbix (incident in progress)

##### Zabbix & Twilio Reference

[zabbix-twillio](http://begood-technology.github.io/zabbix-twilio/)

If you follow the zabbix-twilio integration steps on the site above,<br/>
after entering a dial key in twilio, the following error occurs and the event cannot be registered.<br/>
`API error -32602: The "user.login" method must be called without the "auth" parameter`

This is because the `Zabbix_API` class in zabbix-twilio.php is outdated.<br/>

[zabbix-twilio.php](https://github.com/begood-technology/zabbix-twilio/blob/master/zabbix-twilio.php)

[PhpZabbixApi](https://github.com/confirm/PhpZabbixApi)

Download the above, generate the following two files with `php build.php`,<br/>
then call these and change `Zabbix_Api` to `ZabbixApi`.

- ZabbixApi.class.php
- ZabbixApiAbstract.class.php

- /var/www/html/zabbix-twilio/zabbix-twilio.php

```
+ require_once 'ZabbixApi.class.php';
+ use ZabbixApi\ZabbixApi;

-                                       $api = new Zabbix_API ( $ZABBIX_API, $ZABBIX_USER, $ZABBIX_PASS );
+                                       $api = new ZabbixApi ( $ZABBIX_API, $ZABBIX_USER, $ZABBIX_PASS);
```

`ZabbixApi ` also handles the case where Basic authentication is configured.

```
// Example)
$api = new ZabbixApi ( $ZABBIX_API, $ZABBIX_USER, $ZABBIX_PASS, $BASIC_AUTH_USER, $BASIC_AUTH_PASS);
```

#### Test Environment

- Amazon Linux AMI release 2015.09
- Zabbix 2.5 (3.0α)
- PHP 5.6.14
- MySQL 5.5.46

That's all.
