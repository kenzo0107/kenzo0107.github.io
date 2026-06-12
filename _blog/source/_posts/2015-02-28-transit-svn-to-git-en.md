---
layout: post
title: Migrating from SVN to Git While Preserving Past Commit Logs
date: 2015-02-28
category: Git
lang: en
translation_id: transit-svn-to-git
permalink: en/2015/02/28/transit-svn-to-git/
cover: /img/cover/2015-02-28-transit-svn-to-git.svg
---

## Overview

I needed to migrate repository management from SVN to Git,
so this post summarizes the commands I used in the process.

## Procedure

First, create the destination repository on the remote.

{% gist kenzo0107/a833505ec85829a7a0e6 %}


### If you get the following error when trying to run the command below

```console
$ git pull origin master

Permission denied (publickey).
fatal: Could not read from remote repository.

Please make sure you have the correct access rights
and the repository exists.
```

In short, the permission for your public key was denied.

Let's check how it is trying to access the remote repository.

```
[core]
        repositoryformatversion = 0
        filemode = true
        bare = false
        logallrefupdates = true
        ignorecase = true
        precomposeunicode = true
[svn-remote "svn"]
        url = http://www.svn.rubygroupe.jp/svn/hogehoge
        fetch = trunk:refs/remotes/svn/trunk
        branches = branches/*:refs/remotes/svn/*
        tags = tags/*:refs/remotes/svn/tags/*
[remote "origin"]
#        url = git@github.com:xxxxxxxxx.git
        <span style="color: #ff0000">url = https://github.com:xxxxxxxxx.git</span>
        fetch = +refs/heads/*:refs/remotes/origin/*
```

Try pulling again.

```console
$ git pull origin master
```

## Afterword

I'm grateful for Git's mature approach of being prepared to take over from SVN.

If you're wondering why you'd migrate in the first place, just try getting your hands on Git first.
