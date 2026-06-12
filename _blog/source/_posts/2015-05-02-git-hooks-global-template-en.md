---
layout: post
title: Setting Up Custom git-hooks Globally
date: 2015-05-02
lang: en
translation_id: git-hooks-global-template
permalink: en/2015/05/02/git-hooks-global-template/
cover: /img/cover/2015-05-02-git-hooks-global-template.svg
---

## Overview

This applies to all git-managed development environments locally.

## What I Did
This time, I configured pre-commit.

- PHP syntax check
- Prohibit commits on the master branch
→ master should only be pushed after merging.

* Since I use phpmd for PHP syntax checking, make sure to install phpmd.

```console
$ brew install phpmd
```


## Steps

The steps are documented in the README of git-hook below.

https://github.com/kenzo0107/git-hooks


## Notes

I'll also write up other things later once I've put them together, such as using pre-push to allow pushing only to the remote branch with the same name as the current branch.

That's all.
