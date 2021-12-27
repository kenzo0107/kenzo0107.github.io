---
layout: post
title: 'go get で 「exec: "bzr": executable file not found in $PATH」エラー対策'
date: 2015-08-19
category: Go
---


## 結論

bzrモジュールインストールした後、再度`go get`して問題なく動作しました。

```
# yum install -y bzr
```



## 概要

EC2のCentOS7で
以下のように `go get` した際に`bzrが見当たらない`というエラーが発生した。

```
$ go get launchpad.net/goamz/aws

[centos@ip-xxx-xx-xx-xx src]$ go get launchpad.net/goamz/aws
go: missing Bazaar command. See http://golang.org/s/gogetcmd
package launchpad.net/goamz/aws: exec: "bzr": executable file not found in $PATH
```

ちょこっとしたつまづきでした。


## ちなみに
`bzr`はgitと同様、分散バージョン管理システムです。

今回インストールしようとしたPackageがBazaarで管理していたから必要になったのでしょう。

以下参照
[Bazaarユーザーリファレンス](http://doc.bazaar.canonical.com/beta/ja/user-reference/index.html)
