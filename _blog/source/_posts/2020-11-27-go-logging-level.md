---
title: Go logrus でログ出力レベルを変更する
category: Go
tags:
- Go
date: 2020-11-27
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

# 概要

Go の [sirupsen/logrus](https://github.com/sirupsen/logrus) が便利でよかったので、備忘録として残しておきます。

Go でツール作成時にデバッグしたい時にレベルをさくっと変更したい時があり、その際に利用しています。

## 実際に動かすとわかりやすい。

[Go Playground](https://play.golang.org/p/1ew_HBa1H7a)

```go
package main

import (
	log "github.com/sirupsen/logrus"
)

func main() {
	log.SetLevel(log.FatalLevel)

	log.Trace("1")
	log.Debug("2")
	log.Info("3")
	log.Warn("4")
	log.Error("5")
	log.Fatal("6")
	log.Panic("7")
}
```

以上です。
参考になれば幸いです。
