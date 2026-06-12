---
title: 'black "ImportError: cannot import name _unicodefun from click" Error Fix'
date: 2022-05-25
category: Python
lang: en
translation_id: black-fix-cannot-import-name-unicodefun-from-click
permalink: en/2022/05/25/black-fix-cannot-import-name-unicodefun-from-click/
cover: /img/cover/2022-05-25-black-fix-cannot-import-name-unicodefun-from-click.svg
tags:
  - Python
---

I ran into the following error with the Python auto-formatting tool [black](https://github.com/psf/black), so here is a summary of how I dealt with it.

<!-- more -->

```
$ black . --check --skip-string-normalization

Traceback (most recent call last):
...
ImportError: cannot import name '_unicodefun' from 'click' ...
...
```

Referring to the resource below, I confirmed that upgrading black to the latest version [22.3.0](https://pypi.org/project/black/22.3.0/) resolves the issue.

{% linkPreview https://github.com/psf/black/issues/2964 %}

The root cause is that an internal module of black installs click (version 8.1.3 in my own environment), and the problem stems from a bug in it.

That's all.
I hope this is helpful.
