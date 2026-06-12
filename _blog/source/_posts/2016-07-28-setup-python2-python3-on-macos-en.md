---
layout: post
title: Building Python 2 and Python 3 Virtual Environments on Mac OS X
date: 2016-07-28
category: Python
lang: en
translation_id: setup-python2-python3-on-macos
permalink: en/2016/07/28/setup-python2-python3-on-macos/
tags:
  - Python
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160728/20160728142804.jpg
---

## Background

By default, Mac OS X ships with Python 2.

Since Python 2.7 is only supported until 2020,
I decided I should get familiar with Python 3
and set up a Python 3 environment.

That said,
there were cases where things like [dlib](http://dlib.net/) wouldn't configure properly unless I used Python 2
(although this may also have been my own mistake),
so I decided to keep both around and build virtual environments for each.

## Environment

```
$ sw_vers

ProductName:    Mac OS X
ProductVersion: 10.11.5
BuildVersion:   15F34
```

## Installing Homebrew

Please refer to the official site below.

[Homebrew Ja](http://brew.sh/index_ja.html)

## Installing Python 2 and 3

As of 2016/07/28, python = 2.7.10, python3 = 3.4.3

```
$ brew install python python3 pyenv
```

## Configuration File

Add the following to .bashrc or .zshrc.

Here we'll assume .bashrc.

```shell
$ vi ~/.bashrc
```

```shell
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
```

- Reload the configuration

```
$ source ~/.bashrc
```

## Installing virtualenv

```
sudo easy_install virtualenv
```

## Building the Virtual Environments

- Building a virtual environment with Python 2

```
$ which python

/usr/local/bin/python2.7
```

```
$ virtualenv -p /usr/local/bin/python2.7 ~/py2env
```

- Building a virtual environment with Python 3

```
$ which python3

/usr/local/bin/python3
```

```
$ virtualenv -p /usr/local/bin/python3 ~/py3env
```

## Switching Between Virtual Environments

- Switch to the Python 2.7 virtual environment

```
$ source ~/py2env/bin/active
```

- Switch to the Python 3.4 virtual environment

```
$ source ~/py3env/bin/active
```

A bit late to the party, but that's my memo-style summary.
