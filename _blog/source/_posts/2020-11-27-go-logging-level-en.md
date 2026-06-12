---
title: Changing the Logging Level with Go logrus
category: Go
tags:
- Go
date: 2020-11-27
lang: en
translation_id: go-logging-level
permalink: en/2020/11/27/go-logging-level/
cover: /img/cover/2020-11-27-go-logging-level.svg
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

# Overview

Go's [sirupsen/logrus](https://github.com/sirupsen/logrus) is so handy that I'm writing this down as a memo.

When building tools in Go, there are times when I want to quickly change the level for debugging, and this is what I use for that.

## It's easier to understand by actually running it.

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

That's all.
I hope this is helpful.
