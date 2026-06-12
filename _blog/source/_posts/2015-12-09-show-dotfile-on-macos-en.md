---
layout: post
title: Showing Dotfiles on macOS (Better Late Than Never)
date: 2015-12-09
lang: en
translation_id: show-dotfile-on-macos
permalink: en/2015/12/09/show-dotfile-on-macos/
tags:
  - macos
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20151209/20151209101926.png
---

## Overview

A setting to apply when you want to view dotfiles in Finder.

## Environment

- MacOSX Yosemite 10.10.3

## Steps

### Open Terminal and run the following command

```
$ defaults write com.apple.finder AppleShowAllFiles -boolean true
```

### Restart the Finder app

```
$ killall Finder
```

The dotfiles should now be visible.

## If you want to revert

### Run the following command in Terminal

```
$ defaults delete com.apple.finder AppleShowAllFiles
```

### Restart

```
$ killall Finder
```

That's all.
