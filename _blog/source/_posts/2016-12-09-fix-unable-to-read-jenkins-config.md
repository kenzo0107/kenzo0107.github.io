---
layout: post
title: Jenkins が起動しない - Unable to read /var/lib/jenkins/config.xml -
date: 2016-12-09
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161209/20161209135407.png
tags:
- Jenkins
---

## とある午後、Jenkins を再起動したときに出たエラー

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

`/var/lib/jenkins/config.xml が読み込めない` というエラー

`/var/lib/jenkins/config.xml` の所有者は jenkins:jenkins だけど、なぜ？

と権限周りを諸々試験して直していくと
`plugins` をディレクトリごと所有者変更すると直りました汗

```
$ sudo chown -R jenkins:jenkins /var/lib/jenkins/plugins
```

plugin の挙動で何か所有者変更され得るものがあったのか解明せず。

## 同様の事象の記事を見つけたので参照

{% linkPreview https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=764711 _blank %}
