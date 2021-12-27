---
layout: post
title: MacOSXにgoをインストール
date: 2015-04-12
---

## 概要

golangのとっかかりとして簡単に
- Googleが開発した言語
- 動的型付け (Like Python)
- 分散処理が得意
などなど

Wiki参照

http://ja.wikipedia.org/wiki/Go_%28%E3%83%97%E3%83%AD%E3%82%B0%E3%83%A9%E3%83%9F%E3%83%B3%E3%82%B0%E8%A8%80%E8%AA%9E%29



## 手順
brew をインストールしていない場合は以下参照してください。

{% linkPreview https://kenzo0107.github.io/2015/02/27/2015-02-28-install-homebrew-on-macosx/ %}

### brewからinstall

{% gist kenzo0107/a283dac2ac3fee108fa0 %}


* hello.go

{% gist kenzo0107/e4350b16fc0648e1303b %}


### ビルド

```
go build hello.go
```

### 実行

```
./hello
```

Hello, World
として表示されればOK !!
