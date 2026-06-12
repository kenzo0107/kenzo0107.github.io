---
layout: post
title: Uploading Files by Wrapping sftp in a Shell Script
date: 2016-05-10
category: Infrastructure
lang: en
translation_id: sftp-via-shell
permalink: en/2016/05/10/sftp-via-shell/
cover: /img/cover/2016-05-10-sftp-via-shell.svg
tags:
- sftp
---

## Overview

A third party providing a data analytics service instructed us
to store files on a specified server and path, in a specified format.

They also added:
"Please use `sftp` as the only allowed protocol."

Since we also needed to run this on a schedule,
we looked into whether it could be written as a shell script,
and put together the following.

## shell

{% gist kenzo0107/a2f7525b6e201daa632c4dec36a9a1ba %}


### Point

- Using `expect` to feed the password ahead of time to the sftp command, which is normally interactive

- Specifying `bachmode no` with the `-o` option to avoid the following error

```
Permission denied (publickey,password).
Connection closed
```

- The `-b` option lets you write the processing to run after the sftp login into a batch file

In our case, we needed to run the shell script on a schedule via Jenkins or cron,
so we made it possible to explicitly specify the contents of the batch file.

That's all.
