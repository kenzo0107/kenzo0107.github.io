---
title: 'warning: reattach-to-user-namespace: unsupported new OS, trying as if it were 10.10'
date: 2022-01-04
---

macOS を Catalina から BigSur にアップグレードしたところ、ターミナル起動で以下 warning が見られる様になりました。

```console
warning: reattach-to-user-namespace: unsupported new OS, trying as if it were 10.10
```

シンプルにアップグレードしたら解決しました。

```console
$ brew upgrade reattach-to-user-namespace

Running `brew update --preinstall`...
...

```

という備忘録でした。

以上、参考になれば幸いです。
