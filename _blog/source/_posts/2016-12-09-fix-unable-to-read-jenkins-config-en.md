---
layout: post
title: Jenkins Won't Start - Unable to read /var/lib/jenkins/config.xml
date: 2016-12-09
category: AWS
lang: en
translation_id: fix-unable-to-read-jenkins-config
permalink: en/2016/12/09/fix-unable-to-read-jenkins-config/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161209/20161209135407.png
tags:
  - Jenkins
---

## One afternoon, the error that showed up when I restarted Jenkins

```
hudson.util.HudsonFailedToLoad: org.jvnet.hudson.reactor.ReactorException: java.io.IOException: Unable to read /var/lib/jenkins/config.xml
	at hudson.WebAppMain$3.run(WebAppMain.java:234)
Caused by: org.jvnet.hudson.reactor.ReactorException: java.io.IOException: Unable to read /var/lib/jenkins/config.xml
	at org.jvnet.hudson.reactor.Reactor.execute(Reactor.java:269)
	at jenkins.InitReactorRunner.run(InitReactorRunner.java:44)
	at jenkins.model.Jenkins.executeReactor(Jenkins.java:912)
	at jenkins.model.Jenkins.<init>(Jenkins.java:811)
	at hudson.model.Hudson.<init>(Hudson.java:82)
	at hudson.model.Hudson.<init>(Hudson.java:78)
	at hudson.WebAppMain$3.run(WebAppMain.java:222)
```

An error saying `cannot read /var/lib/jenkins/config.xml`.

The owner of `/var/lib/jenkins/config.xml` is jenkins:jenkins, so why?

After testing and fixing various permission-related things, changing the owner of the entire `plugins` directory fixed it. Phew.

```
$ sudo chown -R jenkins:jenkins /var/lib/jenkins/plugins
```

I never figured out what plugin behavior could have changed the owner.

## I found an article about the same issue, so I'm linking it

{% linkPreview https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=764711 _blank %}
