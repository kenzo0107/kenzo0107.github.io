---
layout: post
title: jenkins が停止していますが PID ファイルが残っています
date: 2016-08-15
thumbnail: https://i.imgur.com/fHQQwXo.png
---


プロセスIDの管理ファイルは通常停止すれば削除されます。
但し、Jenkins 再起動時に サーバそのものを再起動させたとか、
野暮なことをすると Jenkins おじさんが怒ります。

### 対策 1
PIDが素直に残っているのであれば
Jenkins PIDファイルを削除

```console
$ sudo rm /var/run/jenkins.pid
```


### 対策2

PIDが存在しない、という場合には
以下ディレクトリにアクセス権限がないパターン

- /var/log/jenkins
- /var/cache/jenkins

chown / chmod で所有者・パーミッション変更してアクセス可能な状態にしましょう。
