---
layout: post
title: Setting Up the Go Debugger gdb in Eclipse on MacOSX
date: 2015-08-02
lang: en
translation_id: setting-for-gdb
permalink: en/2015/08/02/setting-for-gdb/
cover: https://i.imgur.com/bJO8cHQ.png
---

## Overview

We will install GDB, the debugging module for Go.
However, due to security reasons on the Mac, using GDB
requires creating a certificate.

## Environment

- MacOSX 10.10.4 Yosemite
- Go 1.4
- Eclipse Mars Release (4.5.0)
- gdb 7.9

## Installing GDB

```
$ brew install homebrew/dupes/gdb
```

## Checking the GDB Version

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

## Creating the Certificate

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


##  Applying the `gdb-cert` Signature to `gdb`

```
$ codesign -s gdb-cert /usr/local/Cellar/gdb/7.9/bin/gdb        [master]
gdb-cert: ambiguous (matches "gdb-cert" and "gdb-cert" in /Library/Keychains/System.keychain)
```

## Killing the taskgated Process

```
$ sudo killall taskgated
```

After restarting MacOSX, verify the following.

## `GDB` Appears Under `C/C++` as Shown Below

![](http://i.imgur.com/lOqwPt6.png)

That's all.
