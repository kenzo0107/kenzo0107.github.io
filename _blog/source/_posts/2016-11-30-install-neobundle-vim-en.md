---
layout: post
title: Installing a NeoBundle-Compatible vim on CentOS 5
date: 2016-11-30
lang: en
translation_id: install-neobundle-vim
permalink: en/2016/11/30/install-neobundle-vim/
cover: /img/cover/2016-11-30-install-neobundle-vim.svg
tags:
- vim
---

## Overview

While trying to build vim from source on CentOS 5,
an error occurred when running .configure:

```
no terminal library found
checking for tgetent()... configure: error: NOT FOUND!
      You need to install a terminal library; for example ncurses.
      Or specify the name of the library with --with-tlib.
```

It's complaining that the terminal library is missing.

For reference, here is the flow I used to download and build vim from source.
```
$ wget ftp://ftp.vim.org/pub/vim/unix/vim-7.4.tar.bz2
$ tar xvf vim-7.4.tar.bz2
$ cd vim74
$ ./configure --enable-multibyte --with-features=huge --disable-selinux --prefix='/usr/local/vim-7.4'
$ sudo make install
$ sudo ln -s /usr/local/vim-7.4/bin/vim /usr/bin/vim
```


- Install ncurses-devel and run again

```
$ sudo yum install -y ncurses-devel
```

It went through (;~_~)

The vim installed via yum was a version that doesn't support NeoBundle,
so I chose to build it from source.

Let me know if there's a decent rpm out there!
