---
layout: post
title: Handling Jenkins Crashes
date: 2016-08-15
category: Infrastructure
lang: en
translation_id: why-jenkins-died
permalink: en/2016/08/15/why-jenkins-died/
cover: https://i.imgur.com/qds0pDI.png
---

When the thread dies, you get a display like this...

![](https://i.imgur.com/qds0pDI.png)


The cause was

```
No space left on device
```

The device had run out of space...

## Countermeasure

I created the following cleanBuild.sh to clean up builds.

{% gist kenzo0107/45731991b6462dd56a93ee9895215129 %}

Past build history gets wiped out, but
for the sake of <span style="color:red">low-cost operation</span>,
desperate times call for desperate measures!

If anything, the build history is sent as a notification to Slack,
so let's just say it's covered by Slack.
