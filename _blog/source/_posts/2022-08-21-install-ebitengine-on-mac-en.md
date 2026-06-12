---
title: Agree to the Xcode License When Installing ebitengine
date: 2022-08-21
category: Go
lang: en
translation_id: install-ebitengine-on-mac
permalink: en/2022/08/21/install-ebitengine-on-mac/
cover: https://i.imgur.com/4It5iQF.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

## Overview

Following the [official ebitengine install guide](https://ebiten.org/documents/install.html?os=darwin),
I ran into an extra step while setting up ebitengine on macOS, so here is a quick note.

<!-- more -->

## Environment

```
$ sw_vers

ProductName:    macOS
ProductVersion: 11.6.3
BuildVersion:   20G415
```

## Error When Installing ebiten

```console
$ go get github.com/hajimehoshi/ebiten/v2

# github.com/go-gl/glfw/v3.3/glfw

You have not agreed to the Xcode license agreements, please run 'sudo xcodebuild -license' from within a Terminal window to review and agree to the Xcode license agreements.
# github.com/hajimehoshi/ebiten/v2/internal/graphicsdriver/metal/mtl

You have not agreed to the Xcode license agreements, please run 'sudo xcodebuild -license' from within a Terminal window to revi
ew and agree to the Xcode license agreements.
```

As the error message states, agree to the Xcode license.

```console
$ sudo xcodebuild -license

...

By typing 'agree' you are agreeing to the terms of the software license agreements. Type 'print' to print them or anything else
to cancel, [agree, print, cancel] (type 'agree' and press Enter)
```

## Run Again

```console
$ go get github.com/hajimehoshi/ebiten/v2
go get: added github.com/go-gl/glfw/v3.3/glfw v0.0.0-20220320163800-277f93cfa958
go get: added github.com/gofrs/flock v0.8.1
go get: added github.com/hajimehoshi/ebiten/v2 v2.3.7
go get: added github.com/jezek/xgb v1.0.0
go get: added golang.org/x/exp v0.0.0-20190731235908-ec7cb31e5a56
go get: added golang.org/x/image v0.0.0-20220321031419-a8550c1d254a
go get: added golang.org/x/mobile v0.0.0-20220518205345-8578da9835fd
go get: added golang.org/x/sync v0.0.0-20210220032951-036812b2e83c
go get: added golang.org/x/sys v0.0.0-20220408201424-a24fb2fb8a0f
```

```console
$ go run -tags=example github.com/hajimehoshi/ebiten/v2/examples/rotate
```

![](https://i.imgur.com/4It5iQF.png)

It works! ♪

That's all.
I hope this is helpful.
