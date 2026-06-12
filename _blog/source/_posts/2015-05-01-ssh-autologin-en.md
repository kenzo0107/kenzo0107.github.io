---
layout: post
title: Log in to Servers with SSH Autologin -- Stop Typing the ssh Command Every Time
date: 2015-05-01
category: Infrastructure
lang: en
translation_id: ssh-autologin
permalink: en/2015/05/01/ssh-autologin/
cover: /img/cover/2015-05-01-ssh-autologin.svg
---

## Environment
MacOSX 10.10.3 Yosemite


## Overview

When I asked someone to "log in to the server via SSH," I watched them
open Excel or a text file, copy and paste the server information...
Seeing how hard they were working at this, I thought it looked painful,
so I wrote this shell script.


## Steps

I put everything together on GitHub below.
The usage instructions are written in the README.

Add server information to projects.yaml.

https://github.com/kenzo0107/SSHAutoLogin


You can log in by running the shell command like this:

hoge : the abbreviated project name
prd : the environment you want to log in to

```console
$ sh al.sh hoge prd
```

That's all.
