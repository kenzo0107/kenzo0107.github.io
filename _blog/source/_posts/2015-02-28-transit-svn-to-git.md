---
layout: post
title: SVN から Git へ過去コミットログを担保した上で移行する
date: 2015-02-28
---

## 概要

リポジトリ管理を SVN から Git 移行する必要があり
その際に利用したコマンドをまとめます。

## 手順

まずリモートに移行先のリポジトリを作成しておきます。

{% gist kenzo0107/a833505ec85829a7a0e6 %}


### 以下コマンドを実行しようとしたら以下エラーが出た場合

```console
$ git pull origin master

Permission denied (publickey).
fatal: Could not read from remote repository.

Please make sure you have the correct access rights
and the repository exists.
```

要約すると、公開鍵のパーミッション拒否されています、ということです。

remote repositoryにどのようにアクセスしようとしているかの確認をします。

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

再度 pull してみてください。

```console
$ git pull origin master
```

## あとがき

Git側がSVNを引き取ることを想定して用意しているという大人な対応に感謝

そもそも何故移行？という方はまずGitを触ってみてください。
