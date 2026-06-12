---
layout: post
title: Simple Performance Measurement in Golang
date: 2016-11-21
lang: en
translation_id: monitoring-performance-of-go
permalink: en/2016/11/21/monitoring-performance-of-go/
cover: /img/cover/2016-11-21-monitoring-performance-of-go.svg
category: Go
tags:
  - Go
---

## Overview

A quick note on simple performance measurement.
I use it often, so I'm saving it here as a memo.

```go
package main

import (
	"fmt"
	"runtime"
	"time"
)

func main() {
	// Number of CPUs
	cpus := runtime.NumCPU()

	// Memory at start
	var startMemory runtime.MemStats
	runtime.ReadMemStats(&startMemory)

	// Start time
	start := time.Now()


	// do something


	// Elapsed time
	elapsed := time.Since(start)

	// Memory at end
	var endMemory runtime.MemStats
	runtime.ReadMemStats(&endMemory)

	fmt.Printf("実行時間: %f 秒 \n", elapsed.Seconds())
	fmt.Printf("CPU: %d \n", cpus)
	fmt.Printf("Memory All: %f MB \n", float64(endMemory.Alloc-startMemory.Alloc)/float64(1024*1024))
}
```
