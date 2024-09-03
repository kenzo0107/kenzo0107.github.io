---
title: asdf で ruby の最新バージョンが見つからない時
date: 2024-09-03
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

asdf で ruby の最新バージョンを利用したかったけど、リストになくて困った時の話です。

```console
$ asdf list all ruby

...
3.1.0
3.1.1
3.1.2
3.1.3
3.2.0-dev
3.2.0-preview1
3.2.0-preview2
3.2.0-preview3
3.2.0-rc1
3.2.0
3.3.0-dev
...
```

3.3.0 以上を利用したいのに出てこない💦

<!-- more -->

## 対策: asdf ruby plugin をアップデートする


[asdf-ruby - Use](https://github.com/asdf-vm/asdf-ruby?tab=readme-ov-file#use) を参考に
plugin をアップデートします。

```console
$ asdf plugin-update ruby

Updating ruby to master
From https://github.com/asdf-vm/asdf-ruby
   16bc8ac..d6eb414  master     -> master
   16bc8ac..d6eb414  master     -> origin/master
Already on 'master'
Your branch is up to date with 'origin/master'.
```

## 再度バージョンのリストを表示してみる

```console
$ asdf list all ruby

...
3.3.0-rc1
3.3.0
3.3-dev
3.3.1
3.3.2
3.3.3
3.3.4
3.3.5
3.4.0-preview1
3.4-dev
...
```

無事インストールできました。

```console
$ asdf install ruby 3.3.5
```

以上
参考になれば幸いです。
