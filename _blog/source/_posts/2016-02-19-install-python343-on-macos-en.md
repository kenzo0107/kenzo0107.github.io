---
layout: post
title: Installing Python 3.4.3 on macOS
date: 2016-02-19
lang: en
translation_id: install-python343-on-macos
permalink: en/2016/02/19/install-python343-on-macos/
cover: /img/cover/2016-02-19-install-python343-on-macos.svg
tags:
- Python
---

## Overview

{% linkPreview https://www.amazon.co.jp/exec/obidos/ASIN/4774176311/kenzo0107-22/ _blank %}

I was given a wonderful book called "機械学習養成読本" (Machine Learning Training Reader), and I immediately started studying with it.

On page 115, Part 2, Chapter 1,
"Installing Python" didn't go smoothly, so here are my notes.

When you run `pyenv install 3.4.3`, did you get an error like the following?

```
Downloading Python-3.4.3.tgz...
-> https://www.python.org/ftp/python/3.4.3/Python-3.4.3.tgz
Installing Python-3.4.3...
ERROR: The Python ssl extension was not compiled. Missing the OpenSSL lib?

Please consult to the Wiki page to fix the problem.
https://github.com/yyuu/pyenv/wiki/Common-build-problems

BUILD FAILED (OS X 10.11.2 using python-build 20150519)
```

## Environment
- MacOSX El Capitan 10.11.2 (15C50)
- Homebrew 0.9.5

```
$ brew install sqlite3
$ brew install readline
$ brew install openssl
$ brew install pyenv
$ export CFLAGS="-I$(brew --prefix openssl)/include"
$ export LDFLAGS="-L$(brew --prefix openssl)/lib -L$(brew --prefix sqlite3)/lib"
$ export CPPFLAGS="-I$(brew --prefix sqlite3)/include"
$ pyenv install 3.4.3
```

Setting the following variables that are passed to the compiler was the key.

- CFLAGS
- LDFLAGS
- CPPFLAGS

[10.3 Variables Used by Implicit Rules](https://www.gnu.org/software/make/manual/html_node/Implicit-Variables.html)

One thing to be careful about is the Python that comes installed by default on the Mac.
Remove it from Python's PATH (/usr/local/bin).

```
$ which python
/usr/local/bin/python

$ mv /usr/local/bin/python /usr/local/bin/python2.7.10
```

If pip is also already installed, remove it from the PATH in the same way.
```
$ which pip
/usr/local/bin/pip

$ mv /usr/local/bin/pip /usr/local/bin/pip2.7
```

If you haven't exported any other Python PATH,
the path should now point to the Python installed by pyenv.

```
$ which python
/Users/kenzo/.pyenv/shims/python ← If it shows up like this, you're good to go ♪
```
