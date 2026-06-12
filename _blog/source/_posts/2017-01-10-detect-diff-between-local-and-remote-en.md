---
layout: post
title: I Built a Tool to Detect Files That Differ Between a Remote and Local Server
date: 2017-01-10
lang: en
translation_id: detect-diff-between-local-and-remote
permalink: en/2017/01/10/detect-diff-between-local-and-remote/
category: Go
tags:
  - Go
cover: http://i.imgur.com/4tGwrRf.png
---

## Overview

I built a tool in Golang that detects information about files that differ between a remote server and a local server.

{% linkPreview https://github.com/kenzo0107/diffrelo _blank %}

## What This Tool Does, in 3 Lines

1. Based on your local workspace, download files from the remote server into the execution directory by specifying a directory and file extensions
2. Copy files from the local workspace into the execution directory
3. Check for differences between the files obtained in steps 1 and 2

## Intended Use Case

- When the synchronization status between a remote file server and your local workspace is unclear

That is the only case.
It rarely happens in a well-maintained deployment environment.

But it happens surprisingly often.

<div style="text-align:center;">
<img src="http://i.imgur.com/HqjRw7c.png" width="100%">
</div>

It is cases like these:

- The person in charge left the company and nothing was handed over (>\_<)
- It was a small tool, so it wasn't under Git management (>\_<)
- Another vendor has access to the server and sometimes edits it without notice (>\_<)

I happened to be assigned to projects that fell into the cases above, and I built this for myself to avoid causing regressions or introducing bugs.

## A Note

By default, the target extensions are php, tpl, js, css, and html.
At work I deal with PHP projects a lot, so... m(\_ \_)m

## Afterword

I originally wrote it in Python, but switching to Go improved performance by about 4 to 5 times!

As for concurrency, Python does have [multiprocessing](http://docs.python.jp/2/library/multiprocessing.html), but I felt Go was easier to write.

## By the Way

In implementing this, I read the following article.
The basics of Go syntax and environment setup, as well as the semaphore-aware design, were very helpful.
