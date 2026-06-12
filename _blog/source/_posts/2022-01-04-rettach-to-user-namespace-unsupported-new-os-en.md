---
title: 'warning: reattach-to-user-namespace: unsupported new OS, trying as if it were 10.10'
date: 2022-01-04
lang: en
translation_id: rettach-to-user-namespace-unsupported-new-os
permalink: en/2022/01/04/rettach-to-user-namespace-unsupported-new-os/
cover: /img/cover/2022-01-04-rettach-to-user-namespace-unsupported-new-os.svg
---

After upgrading macOS from Catalina to Big Sur, I started seeing the following warning whenever I launched the terminal.

```console
warning: reattach-to-user-namespace: unsupported new OS, trying as if it were 10.10
```

A simple upgrade fixed it.

```console
$ brew upgrade reattach-to-user-namespace

Running `brew update --preinstall`...
...

```

Just a quick note to self.

I hope this helps.
