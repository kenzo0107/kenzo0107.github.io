---
layout: post
title: MacOSX環境にgoインストールして実行確認まで
date: 2015-05-18
---

## 環境

* MacOSX10.10.3 Yosemite

## インストール手順

#### brewでインストール

```
$ brew install go
```

#### goバージョン確認
```
$ go version
```

#### .bash_profile に追記
※zshの場合、~/.zshrcに追記

```
export GOROOT=/usr/local/opt/go/libexec
export GOPATH=$HOME
export PATH=$PATH:$GOROOT/bin:$GOPATH/bin
```


#### サンプルファイル(hello.go)作成

`vim hello.go`

```
package main

import "fmt"

func main() {
    fmt.Printf("Hello, World\n")
}
```

#### ファイル実行

```
go run hello.go
```


「Hello, World」と表示されれば成功！
Go言語のインストール完了です。

以上
