---
layout: post
title: Eclipse でGoコードデバッグツールgdb設定  on MacOSX
date: 2015-08-02
---

## 概要

goのデバックモジュール GDBをインストールします。
ただMacのセキュリティ上の理由からGDBを利用するには
証明書を作成する必要があります。

## 環境

- MacOSX 10.10.4 Yosemite
- Go 1.4
- Eclipse Mars Release (4.5.0)
- gdb 7.9

## GDB インストール

```
$ brew install homebrew/dupes/gdb
```

## GDB バージョン確認

```
$ gdb --version
GNU gdb (GDB) 7.9
Copyright (C) 2015 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.  Type "show copying"
and "show warranty" for details.
This GDB was configured as "x86_64-apple-darwin14.1.0".
Type "show configuration" for configuration details.
For bug reporting instructions, please see:
<http://www.gnu.org/software/gdb/bugs/>.
Find the GDB manual and other documentation resources online at:
<http://www.gnu.org/software/gdb/documentation/>.
For help, type "help".
Type "apropos word" to search for commands related to "word".
```

## 証明書 作成

![](http://i.imgur.com/bJO8cHQ.png)

![](http://i.imgur.com/dcBnMms.png)

![](http://i.imgur.com/Mk8qGkr.png)

![](http://i.imgur.com/EzrYhhh.png)

![](http://i.imgur.com/AXq2bJZ.png)

![](http://i.imgur.com/ilTj6Ay.png)

![](http://i.imgur.com/TG0Zz26.png)

![](http://i.imgur.com/7kKxXgX.png)

![](http://i.imgur.com/dJ3gEKT.png)

![](http://i.imgur.com/pV6cirH.png)

![](http://i.imgur.com/Bzb91th.png)


##  `gdb` に `gdb-cert` の署名を適用

```
$ codesign -s gdb-cert /usr/local/Cellar/gdb/7.9/bin/gdb        [master]
gdb-cert: ambiguous (matches "gdb-cert" and "gdb-cert" in /Library/Keychains/System.keychain)
```

## taskgated プロセスをkill

```
$ sudo killall taskgated
```

MacOSX 再起動後以下確認

## 以下のように `C/C++` に `GDB` が表示される

![](http://i.imgur.com/lOqwPt6.png)

以上
