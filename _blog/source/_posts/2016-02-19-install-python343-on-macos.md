---
layout: post
title: MacOSX python 3.4.3 インストール
date: 2016-02-19
tags:
- Python
---

## 概要

{% linkPreview https://www.amazon.co.jp/exec/obidos/ASIN/4774176311/kenzo0107-22/ _blank %}

機械学習養成読本という素晴らしい本を頂き早速学習を深めています。

115ページ 第2部 第1章
「Pythonのインストール」がすんなりいかなかったのでメモです。

`pyenv install 3.4.3` を実行すると以下のようなエラー出ませんでしたか？

```
Downloading Python-3.4.3.tgz...
-> https://www.python.org/ftp/python/3.4.3/Python-3.4.3.tgz
Installing Python-3.4.3...
ERROR: The Python ssl extension was not compiled. Missing the OpenSSL lib?

Please consult to the Wiki page to fix the problem.
https://github.com/yyuu/pyenv/wiki/Common-build-problems

BUILD FAILED (OS X 10.11.2 using python-build 20150519)
```

## 環境
- MacOSX ElCapitan 10.11.2（15C50）
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

以下コンパイラに渡す変数の設定が肝でした。

- CFLAGS
- LDFLAGS
- CPPFLAGS

[10.3 Variables Used by Implicit Rules](https://www.gnu.org/software/make/manual/html_node/Implicit-Variables.html)

気をつければいけないのはMacにデフォルトでインストールされているPython
Python のPATH(/usr/local/bin)から外す

```
$ which python
/usr/local/bin/python

$ mv /usr/local/bin/python /usr/local/bin/python2.7.10
```

pip もインストール済みであるならば同様にパスから外す。
```
$ which pip
/usr/local/bin/pip

$ mv /usr/local/bin/pip /usr/local/bin/pip2.7
```

他にPythonのPATHをexportしていなければ
pyenv でインストールしたPythonにパスが通るはずです。

```
$ which python
/Users/kenzo/.pyenv/shims/python ←このように表示されればOK♪
```
