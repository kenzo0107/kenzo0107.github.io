---
layout: post
title: Let's Use zsh on macOS X!
date: 2015-04-24
category: Infrastructure
lang: en
translation_id: lets-use-zsh
permalink: en/2015/04/24/lets-use-zsh/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150430/20150430115842.png
---

## Benefits
- Adds completion features in the terminal
- Completes commands and file paths, even handling case conversion between uppercase and lowercase

## Steps

### Check whether zsh is available
```console
$ cat /etc/shells
...

/etc/zsh
```

If it isn't, install it with brew

```console
$ brew install zsh
$ sudo sh -c 'echo $(which zsh) >> /etc/shells'
```

### Switch your shell to zsh

```console
$ chpass -s /bin/zsh
Password: (enter your password)
```

Default shell setting
```console
$ chsh -s /bin/zsh
```

I use the following personal `.zshrc` settings.

https://github.com/kenzo0107/dotfiles

Download the above and place
`.zshrc`
in your home directory (~/).

Since it's managed with git, it's also fine to create a link like this.

```console
$ ln .zshrc ~/.zshrc
```

Load the zsh configuration file
```console
$ source .zshrc
```

When you restart the terminal, you can confirm that the settings have been applied, as shown below.

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150430/20150430115842.png)
