---
title: When asdf can't find the latest Ruby version
date: 2024-09-03
lang: en
translation_id: asdf-plugin-update-ruby
permalink: en/2024/09/03/asdf-plugin-update-ruby/
cover: /img/cover/2024-09-03-asdf-plugin-update-ruby.svg
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

This is a note about what to do when the Ruby version you want isn't in asdf's list.

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

I wanted to use 3.3.0 or later, but it doesn't show up 💦

<!-- more -->

## Fix: update the asdf ruby plugin


Following [asdf-ruby - Use](https://github.com/asdf-vm/asdf-ruby?tab=readme-ov-file#use),
update the plugin.

```console
$ asdf plugin-update ruby

Updating ruby to master
From https://github.com/asdf-vm/asdf-ruby
   16bc8ac..d6eb414  master     -> master
   16bc8ac..d6eb414  master     -> origin/master
Already on 'master'
Your branch is up to date with 'origin/master'.
```

## List the versions again

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

It installed without any trouble.

```console
$ asdf install ruby 3.3.5
```

That's it.
I hope this helps.
