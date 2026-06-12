---
layout: post
title: Open a Specified File in Sublime Text 2 from the Terminal
date: 2015-04-10
category: Infrastructure
lang: en
translation_id: open-sublimetext2-via-termianl
permalink: en/2015/04/10/open-sublimetext2-via-termianl/
cover: /img/cover/2015-04-10-open-sublimetext2-via-termianl.svg
---

## Environment

* MacOSX 10.10.2
* SublimeText2 2.0.2

## Symbolic Link

```console
$ sudo ln -s /Applications/Sublime\ Text\ 2.app/Contents/SharedSupport/bin/subl /usr/bin/subl
```

## Open a Specified File in Sublime Text

```console
$ subl filename
```
