---
layout: post
title: zsh vcs_info が使えない問題解決
date: 2016-11-30
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20161130/20161130152308.png
tags:
  - zsh
---

## 概要

CentOS5 系で yum でインストールした zsh で以下エラー発生

```
precmd: vcs_info: function definition file not found
```

Version 4.3.6 以上でないと vcs_info は利用できないそう

```
vcs_info is available since zsh-beta, version 4.3.6-dev-0+20080929-1 or later
```

- バージョン確認

```
$ /bin/zsh --version

zsh 4.2.6 (x86_64-redhat-linux-gnu)
```

なので zsh バージョンアップデートする必要があります。

## zsh 5.2 ダウンロード ビルド

```
$ cd /usr/local/src
$ wget https://sourceforge.net/projects/zsh/files/zsh/5.2/zsh-5.2.tar.gz/download
$ tar xvjf zsh-5.2.tar.gz
$ cd zsh-5.2
$ ./configure && make && sudo make install
```

## インストールされた zsh バージョン確認

```
$ /usr/local/bin/zsh --version

zsh 5.2 (x86_64-unknown-linux-gnu)
```

## 新たにダウンロードした zsh にシェル変更

```
$ echo "/usr/local/bin/zsh" | sudo tee -a /etc/shells
$ chsh -s /usr/local/bin/zsh
```

それでも、まだ出てくるこのエラー。。

```
precmd: vcs_info: function definition file not found
```

## .zcompdump を削除し zsh を実行し直す

```
$ rm ~/.zcompdump
$ exec zsh
```

.zscompdump はコマンドやその補間関数の定義一覧が記載されているファイルです。

無事エラーが消えました。
