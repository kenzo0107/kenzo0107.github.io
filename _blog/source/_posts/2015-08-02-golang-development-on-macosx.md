---
layout: post
title: Go言語 開発整備 on MacOSX
date: 2015-08-02
---

## 環境
- MacOSX 10.10.4 Yosemite
- Go 1.4
- Eclipse Mars Release (4.5.0)

## 概要

`2015-08-01時点`

IntelliJでgo開発を検討していましたが
Go言語Ver 1.4 をサポートしていなかったので
Eclipseに `GoClipse` を入れて補間機能等を整備します。

## Go インストール

```
$ brew install go
```

### brewをインストールしていない場合は以下参照

https://kenzo0107.github.io/2015/02/27/2015-02-28-install-homebrew-on-macosx/


## Go バージョン確認

```
$ go version
go version go1.4.2 darwin/amd64
```

## 環境変数設定

個人的には `~/.zshrc` 利用していますが、ない場合は
 `~/.bash_profile` などに以下を追記してください。

```
# go
if [ -x "`which go`" ]; then
  export GOPATH=$HOME/go
  export PATH=$PATH:$GOPATH/bin
fi
```

ちなみに  `-x` は実行可能か判定しています。
すなわち「if [ -x "`which go`"]」 は `which go` というコマンドが実行できるかを判定しています。

現状ローカル環境で `which go` と入力すると
以下のようになります。

```
$ which go
/usr/local/bin/go
```



### GOPATH
- Workspaceになります。プロジェクトはこちらに作っていくことになります。
- `go install`, `go get` した際の保存場所になります。


### go 環境情報確認
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

※ `brew`で`go`をインストールした場合、GOROOTは `/usr/local/Cellar/` 配下となります。

### 環境変数設定反映

#### `.zshrc`  の場合

```
$ source .zshrc
```

#### `.bash_profile` の場合

```
$ source .bash_profile
```


## GoClipseインストール

### Eclipse の上部メニューの `Help > Install New Software...` クリック

![](http://i.imgur.com/EZZA6Kl.png)


### GoClipse Software Location設定

- <http://goclipse.github.io/releases/> をLocationに入力しOK
- GoClipseにチェックを入れ `Next >`ボタンクリックでインストールを進めてください。

![](http://i.imgur.com/4cCZdui.png)


### GoClipse を選択しインストール

- GoClipseにチェックを入れ `Next >`ボタンクリックでインストールを進めてください。

![](http://i.imgur.com/LLWGqTa.png)


- Perspective に Go が表示されるようになります。

![](http://i.imgur.com/KQtlpMz.png)



## GoClipse 各パス設定

![](http://i.imgur.com/oBj3F5z.png)



以上
