---
layout: post
title: Installing Go on MacOSX and Verifying It Runs
date: 2015-05-18
lang: en
translation_id: install-go-macosx
permalink: en/2015/05/18/install-go-macosx/
cover: /img/cover/2015-05-18-install-go-macosx.svg
---

## Environment

* MacOSX 10.10.3 Yosemite

## Installation Steps

#### Install with brew

```
$ brew install go
```

#### Check the Go version
```
$ go version
```

#### Add to .bash_profile
*If you use zsh, add this to ~/.zshrc instead

```
export GOROOT=/usr/local/opt/go/libexec
export GOPATH=$HOME
export PATH=$PATH:$GOROOT/bin:$GOPATH/bin
```


#### Create a sample file (hello.go)

`vim hello.go`

```
package main

import "fmt"

func main() {
    fmt.Printf("Hello, World\n")
}
```

#### Run the file

```
go run hello.go
```


If "Hello, World" is displayed, you've succeeded!
The Go installation is complete.

That's all.
