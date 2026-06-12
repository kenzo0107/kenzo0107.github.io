---
layout: post
title: Reviving a Deleted Git Branch
date: 2015-12-09
lang: en
translation_id: revive-deleted-git-branch
permalink: en/2015/12/09/revive-deleted-git-branch/
cover: /img/cover/2015-12-09-revive-deleted-git-branch.svg
tags:
- git
---

## Overview

What to do when you force-deleted a branch with the command below, only to realize afterward that you actually needed it.

```
$ git branch -D <branch_name>
```

## How to Recover

1. Check the HEAD change history
2. Create a branch from the HEAD log number

```
$ git reflog
$ git branch <branch_name> HEAD@{num}
```

-

Example:

```
$ git reflog

c95c7e9 HEAD@{0}: merge release: Merge made by the 'recursive' strategy.
ad5bed0 HEAD@{1}: checkout: moving from release to master
ffe45df HEAD@{2}: merge develop: Merge made by the 'recursive' strategy.
6aa536b HEAD@{3}: checkout: moving from develop to release
```

Once you figure out that `HEAD@{3}` above is the commit for the branch you deleted, run:

```
$ git branch hogehoge HEAD@{3}
```

After running the command above, running `git branch` shows that the branch `hogehoge` has been created.

So it's a good idea to commit frequently.
