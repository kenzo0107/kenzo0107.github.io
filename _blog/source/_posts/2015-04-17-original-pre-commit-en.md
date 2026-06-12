---
layout: post
title: Custom pre-commit Configuration
date: 2015-04-17
lang: en
translation_id: original-pre-commit
permalink: en/2015/04/17/original-pre-commit/
cover: /img/cover/2015-04-17-original-pre-commit.svg
---

## Procedure

{% gist kenzo0107/db07d64898cc4b6418ed %}

You can get the pre-commit hook from here:

https://github.com/kenzo0107/git-hooks


- PHP syntax check (php -l)
- Prohibit commits on master
- The code conversion to PSR compliance via php-cs-fixer is commented out
