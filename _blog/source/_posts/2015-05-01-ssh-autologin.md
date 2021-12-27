---
layout: post
title: SSH autologin でサーバログイン 〜毎回sshコマンドいちいち打つのはやめよう〜
date: 2015-05-01
---

## 環境
MacOSX 10.10.3 Yosemite


## 概要

サーバへSSHでログインして、と伝えると
Excelやらテキストを開いてサーバ情報をコピペしてはっつけて...
と頑張っている人をみてこれはしんどそうだなぁ
と思って作ったシェルです。


## 手順

以下gitにまとめました。
使い方はREADMEに書いておきました。

サーバ情報はprojects.yamlに追記していきます。

https://github.com/kenzo0107/SSHAutoLogin


以下のような具合にシェルコマンド実行すればログインできます。

hoge : プロジェクトの省略名
prd : ログインしたい環境

```console
$ sh al.sh hoge prd
```

以上
