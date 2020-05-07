---
layout: post
title: CentOS 5系 Neobundle 対応 vim をインストール
date: 2016-11-30
tags:
- vim
---

## 概要

CentOS 5 に vim をソースからビルドしようとした所
.configure 実行時にエラー発生

```
no terminal library found
checking for tgetent()... configure: error: NOT FOUND!
      You need to install a terminal library; for example ncurses.
      Or specify the name of the library with --with-tlib.
```

terminal library がないと怒られている。

ちなみにこんな流れで vim をソースからダウンロードしビルドしようとしました。
```
$ wget ftp://ftp.vim.org/pub/vim/unix/vim-7.4.tar.bz2
$ tar xvf vim-7.4.tar.bz2
$ cd vim74
$ ./configure --enable-multibyte --with-features=huge --disable-selinux --prefix='/usr/local/vim-7.4'
$ sudo make install
$ sudo ln -s /usr/local/vim-7.4/bin/vim /usr/bin/vim
```


- ncurses-devel インストールし再度実行

```
$ sudo yum install -y ncurses-devel
```

通りました (;~_~)

yum でインストールする vim だと Neobundle が利用不可バージョンだった為
ソースからビルドする選択にしました。

程よい rpm があれば教えてください！
