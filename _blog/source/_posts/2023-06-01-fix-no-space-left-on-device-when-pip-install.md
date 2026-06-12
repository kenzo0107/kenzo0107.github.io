---
title: 'fix: Could not install packages due to an EnvironmentError: [Errno 28] No space left on device'
date: 2023-06-01
lang: ja
translation_id: fix-no-space-left-on-device-when-pip-install
cover: /img/cover/2023-06-01-fix-no-space-left-on-device-when-pip-install.svg
category: RaspberryPI
---

RPi 4B で以下エラーで詰まった時の備忘録です。

```
$ pip3 install xxx

Could not install packages due to an EnvironmentError: [Errno 28] No space left on device
```

一時的に tmp ディレクトリを指定してからインストールを再度実行することで回避してみます。

```
$ mkdir $HOME/tmp
$ export TMPDIR=$HOME/tmp

$ pip3 install xxx
```

これでうまくいきました ♪

以上
参考になれば幸いです。
