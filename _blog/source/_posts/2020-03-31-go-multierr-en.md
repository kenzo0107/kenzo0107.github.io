---
title: Combining errors with go.uber.org/multierr
category: Go
tags:
- Go
date: 2020-03-31
lang: en
translation_id: go-multierr
permalink: en/2020/03/31/go-multierr/
cover: /img/cover/2020-03-31-go-multierr.svg
---

I came across this tweet!

{% twitter https://twitter.com/tenntenn/status/1239750083815411712 %}

I wanted to try this out!

So I jumped right in, and one of the things I was really glad to learn about is this!

<!-- more -->

A way to combine multiple errors!

{% gist kenzo0107/f886b4d8e273e4337c9a38eecb5ffff4 %}

I used to roll my own logic to collect the errors that occurred inside a for loop and display them later, but it turns out there was already a package that handles this in a systematic way.

Knowledge update complete.

## References

[Golangのエラー処理とpkg/errors](https://deeeet.com/writing/2016/04/25/go-pkg-errors/)
</content>
</invoke>
