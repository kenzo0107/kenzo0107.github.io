---
layout: post
title: Golang 簡易パフォーマンス測定
date: 2016-11-21
category: Go
tags:
- Go
---

## 概要

簡易的なパフォーマンス測定覚書です。
よく使うので備忘録的に保存。

```go
package main

import (
	"fmt"
	"runtime"
	"time"
)

func main() {
	// CPU数
	cpus := runtime.NumCPU()

	// 開始時メモリ
	var startMemory runtime.MemStats
	runtime.ReadMemStats(&startMemory)

	// 開始時間
	start := time.Now()


	// do something


	// 経過時間
	elapsed := time.Since(start)

	// 終了時メモリ
	var endMemory runtime.MemStats
	runtime.ReadMemStats(&endMemory)

	fmt.Printf("実行時間: %f 秒 \n", elapsed.Seconds())
	fmt.Printf("CPU: %d \n", cpus)
	fmt.Printf("Memory All: %f MB \n", float64(endMemory.Alloc-startMemory.Alloc)/float64(1024*1024))
}
```
