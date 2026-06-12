---
layout: post
title: Handling the os.Open() Warning from gosec
date: 2019-12-09
lang: en
translation_id: gosec-os-open
permalink: en/2019/12/09/gosec-os-open/
cover: /img/cover/2019-12-09-gosec-os-open.svg
category: Go
tags:
  - Go
---

A note on dealing with the os.Open() warning reported by gosec.

<!-- more -->

When gosec encounters code like the following

```go
os.Open(fname)
```

it reports a warning like this:

```go
G304 (CWE-22): Potential file inclusion via variable (Confidence: HIGH, Severity: MEDIUM)
```

Specifying a file path with a variable carries the risk that an unintended file path could be supplied.

## Fix

Use `filepath.Clean()` to sanitize problematic paths.

```go
os.Open(filepath.Clean(fname))
```

That's all.
I hope you find this helpful.
