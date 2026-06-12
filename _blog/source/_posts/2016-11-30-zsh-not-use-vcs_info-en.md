---
layout: post
title: Solving the zsh vcs_info Not Available Problem
date: 2016-11-30
category: Infrastructure
lang: en
translation_id: zsh-not-use-vcs_info
permalink: en/2016/11/30/zsh-not-use-vcs_info/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161130/20161130152308.png
tags:
  - zsh
---

## Overview

The following error occurs with zsh installed via yum on CentOS 5 systems:

```
precmd: vcs_info: function definition file not found
```

It seems vcs_info cannot be used unless you are on version 4.3.6 or later.

```
vcs_info is available since zsh-beta, version 4.3.6-dev-0+20080929-1 or later
```

- Checking the version

```
$ /bin/zsh --version

zsh 4.2.6 (x86_64-redhat-linux-gnu)
```

So we need to update the zsh version.

## Downloading and building zsh 5.2

```
$ cd /usr/local/src
$ wget https://sourceforge.net/projects/zsh/files/zsh/5.2/zsh-5.2.tar.gz/download
$ tar xvjf zsh-5.2.tar.gz
$ cd zsh-5.2
$ ./configure && make && sudo make install
```

## Checking the installed zsh version

```
$ /usr/local/bin/zsh --version

zsh 5.2 (x86_64-unknown-linux-gnu)
```

## Switching the shell to the newly downloaded zsh

```
$ echo "/usr/local/bin/zsh" | sudo tee -a /etc/shells
$ chsh -s /usr/local/bin/zsh
```

Even so, this error still shows up...

```
precmd: vcs_info: function definition file not found
```

## Delete .zcompdump and re-run zsh

```
$ rm ~/.zcompdump
$ exec zsh
```

.zcompdump is a file that contains the list of definitions for commands and their completion functions.

The error disappeared without issue.
