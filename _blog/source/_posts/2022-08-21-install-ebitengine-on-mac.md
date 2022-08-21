---
title: ebitengine インストール時に Xcode ライセンスに同意しておきましょう
date: 2022-08-21
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

## 概要

[公式 ebitengine インストール](https://ebiten.org/documents/install.html?os=darwin) の通り、
MacOS で ebitengine 導入時に一手間あったので備忘録

## 実行環境

```
$ sw_vers

ProductName:    macOS
ProductVersion: 11.6.3
BuildVersion:   20G415
```

## ebiten 導入時にエラー

```console
$ go get github.com/hajimehoshi/ebiten/v2

# github.com/go-gl/glfw/v3.3/glfw

You have not agreed to the Xcode license agreements, please run 'sudo xcodebuild -license' from within a Terminal window to review and agree to the Xcode license agreements.
# github.com/hajimehoshi/ebiten/v2/internal/graphicsdriver/metal/mtl

You have not agreed to the Xcode license agreements, please run 'sudo xcodebuild -license' from within a Terminal window to revi
ew and agree to the Xcode license agreements.
```

上記エラー文の通り、Xcode ライセンスに同意します。

```console
$ sudo xcodebuild -license

...

By typing 'agree' you are agreeing to the terms of the software license agreements. Type 'print' to print them or anything else
to cancel, [agree, print, cancel] (agree と入力し実行)
```

## 再度実行

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

できた ♪

以上
参考になれば幸いです。
