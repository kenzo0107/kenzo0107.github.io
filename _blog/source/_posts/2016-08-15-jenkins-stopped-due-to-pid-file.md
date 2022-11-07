---
layout: post
title: jenkins が停止していますが PID ファイルが残っています
date: 2016-08-15
cover: https://i.imgur.com/fHQQwXo.png
---

プロセス ID の管理ファイルは通常停止すれば削除されます。
但し、Jenkins 再起動時に サーバそのものを再起動させたとか、
野暮なことをすると Jenkins おじさんが怒ります。

### 対策 1

PID が素直に残っているのであれば
Jenkins PID ファイルを削除

```console
$ sudo rm /var/run/jenkins.pid
```

### 対策 2

PID が存在しない、という場合には
以下ディレクトリにアクセス権限がないパターン

- /var/log/jenkins
- /var/cache/jenkins

chown / chmod で所有者・パーミッション変更してアクセス可能な状態にしましょう。
