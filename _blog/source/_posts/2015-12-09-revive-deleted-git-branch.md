---
layout: post
title: Git で削除したブランチを復活させる
date: 2015-12-09
tags:
- git
---

## 概要

以下コマンドでブランチを強制的に削除した後、やっぱり必要だったのに、となったときの対処

```
$ git branch -D <branch_name>
```

## 復活手順


1. HEADの変更履歴を確認する
2. HEADのログ番号からブランチ名作成

```
$ git reflog
$ git branch <branch_name> HEAD@{num}
```

-

例)

```
$ git reflog

c95c7e9 HEAD@{0}: merge release: Merge made by the 'recursive' strategy.
ad5bed0 HEAD@{1}: checkout: moving from release to master
ffe45df HEAD@{2}: merge develop: Merge made by the 'recursive' strategy.
6aa536b HEAD@{3}: checkout: moving from develop to release
```

上記のHEAD@{3}が消してしまったブランチに対してのcommitだ！
とわかれば、

```
$ git branch hogehoge HEAD@{3}
```

上記コマンド完了後、
`git branch`すると branch `hogehoge`が作成されたことがわかる。

なので、commitはこまめにしておくと良いです。
