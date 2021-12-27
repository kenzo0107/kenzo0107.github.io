---
layout: post
title: 独自git-hooksをglobal設定
date: 2015-05-02
---

## 概要

ローカルの全git管理の開発環境に適用する。

## やったこと
今回はpre-commitの設定

- PHPのシンタックスチェック
- masterブランチでのcommit禁止
→ masterはmergeしてpushのみ。

※PHPのシンタックスでphpmdを利用しているので phpmdインストールしておく

```console
$ brew install phpmd
```


## 手順

以下、git-hookのREADMEに手順記載しました。

https://github.com/kenzo0107/git-hooks


## 備考

その他、pre-pushで今いるbranchから
同名のリモートbranchにのみpushを許可するなど
諸々まとめたらまた記載します。

以上
