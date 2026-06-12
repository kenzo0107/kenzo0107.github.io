---
layout: post
title: "Handling the error key_read: uudecode error when you thought you ran cat id_rsa.pub >> authorized_keys"
date: 2016-07-29
lang: en
translation_id: error-key-read-uudecode
permalink: en/2016/07/29/error-key-read-uudecode/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160729/20160729111616.png
tags:
- ssh
---

```
$ tail -f /var/log/secure
```

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160729/20160729111616.png" width="100%">
</div>

## Conclusion

A "/n" had gotten mixed in.
Removing the "/n" resolved the problem.

I may have accidentally introduced it while doing some editing.
