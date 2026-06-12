---
layout: post
title: Jenkins is stopped, but the PID file remains
date: 2016-08-15
category: Infrastructure
lang: en
translation_id: jenkins-stopped-due-to-pid-file
permalink: en/2016/08/15/jenkins-stopped-due-to-pid-file/
cover: https://i.imgur.com/fHQQwXo.png
---

The process ID management file is normally deleted when the process stops.
However, if you do something careless—like restarting the server itself while restarting Jenkins—Jenkins-ojisan gets angry.

### Workaround 1

If the PID is simply left behind,
delete the Jenkins PID file.

```console
$ sudo rm /var/run/jenkins.pid
```

### Workaround 2

If the PID does not exist, it is likely a case where
you do not have access permissions to the following directories:

- /var/log/jenkins
- /var/cache/jenkins

Use `chown` / `chmod` to change the owner and permissions so that they become accessible.
