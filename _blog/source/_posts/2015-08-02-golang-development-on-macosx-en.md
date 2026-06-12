---
layout: post
title: Setting Up a Go Development Environment on Mac OS X
date: 2015-08-02
category: Go
lang: en
translation_id: golang-development-on-macosx
permalink: en/2015/08/02/golang-development-on-macosx/
cover: https://i.imgur.com/EZZA6Kl.png
---

## Environment
- Mac OS X 10.10.4 Yosemite
- Go 1.4
- Eclipse Mars Release (4.5.0)

## Overview

`As of 2015-08-01`

I had been considering using IntelliJ for Go development, but
since it didn't support Go version 1.4,
I'll set up `GoClipse` in Eclipse to get features like code completion working.

## Installing Go

```
$ brew install go
```

### If you haven't installed brew yet, see the following

https://kenzo0107.github.io/2015/02/27/2015-02-28-install-homebrew-on-macosx/


## Checking the Go Version

```
$ go version
go version go1.4.2 darwin/amd64
```

## Setting Environment Variables

Personally I use `~/.zshrc`, but if you don't have it,
add the following to something like `~/.bash_profile`.

```
# go
if [ -x "`which go`" ]; then
  export GOPATH=$HOME/go
  export PATH=$PATH:$GOPATH/bin
fi
```

By the way, `-x` checks whether a file is executable.
In other words, "if [ -x "`which go`"]" checks whether the `which go` command can be executed.

In the current local environment, typing `which go`
gives the following.

```
$ which go
/usr/local/bin/go
```



### GOPATH
- This becomes your workspace. You will create your projects under this directory.
- This is where things are stored when you run `go install` or `go get`.


### Checking Go Environment Information
```
$ go env

GOARCH="amd64"
GOBIN=""
GOCHAR="6"
GOEXE=""
GOHOSTARCH="amd64"
GOHOSTOS="darwin"
GOOS="darwin"
GOPATH="/Users/kenzo/go"
GORACE=""
GOROOT="/usr/local/Cellar/go/1.4.2/libexec"
GOTOOLDIR="/usr/local/Cellar/go/1.4.2/libexec/pkg/tool/darwin_amd64"
CC="clang"
GOGCCFLAGS="-fPIC -m64 -pthread -fno-caret-diagnostics -Qunused-arguments -fmessage-length=0 -fno-common"
CXX="clang++"
CGO_ENABLED="1"
```

* When you install `go` with `brew`, GOROOT is located under `/usr/local/Cellar/`.

### Applying the Environment Variable Settings

#### For `.zshrc`

```
$ source .zshrc
```

#### For `.bash_profile`

```
$ source .bash_profile
```


## Installing GoClipse

### Click `Help > Install New Software...` in the top menu of Eclipse

![](http://i.imgur.com/EZZA6Kl.png)


### Configuring the GoClipse Software Location

- Enter <http://goclipse.github.io/releases/> as the Location and click OK
- Check GoClipse and click the `Next >` button to proceed with the installation.

![](http://i.imgur.com/4cCZdui.png)


### Select GoClipse and Install

- Check GoClipse and click the `Next >` button to proceed with the installation.

![](http://i.imgur.com/LLWGqTa.png)


- Go will now appear as a Perspective.

![](http://i.imgur.com/KQtlpMz.png)



## Configuring the GoClipse Paths

![](http://i.imgur.com/oBj3F5z.png)



That's all.
