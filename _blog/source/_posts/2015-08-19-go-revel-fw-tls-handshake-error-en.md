---
layout: post
title: 'Resolving the Golang Revel Framework Error "server.go:1775: http: TLS handshake error from 127.0.0.1:36799: tls: first record does not look like a TLS handshake"'
date: 2015-08-19
lang: en
translation_id: go-revel-fw-tls-handshake-error
permalink: en/2015/08/19/go-revel-fw-tls-handshake-error/
cover: /img/cover/2015-08-19-go-revel-fw-tls-handshake-error.svg
category: Go
tags:
  - Go
---

## Conclusion

This error occurred when starting the app with `http.ssl = true` in any mode other than [prod].
For that reason, I decided to start the app with `http.ssl = false` in any mode other than [prod].

## Overview

In the test environment, I added a `[test] mode` to `app.conf`,
created a self-signed SSL certificate there, and tried to verify the behavior of the https link.

However, although the app did start, I could not access it at all (yikes).

Since I could access it in dev mode, I compared the differences between the two and arrived at the conclusion above.

## Error Details

When I start Revel and access the URL, the TLS handshake fails and I cannot access the site, as shown below.

```
$ revel run myapp test

...
...

INFO  2015/08/19 14:48:38 harness.go:165: Listening on :9000
2015/08/19 14:48:40 server.go:1775: http: TLS handshake error from 127.0.0.1:36799: tls: first record does not look like a TLS handshake
```
