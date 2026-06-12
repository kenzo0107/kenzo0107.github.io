---
layout: post
title: 'Fixing the "exec: "bzr": executable file not found in $PATH" error on go get'
date: 2015-08-19
lang: en
translation_id: go-get-executable-file-not-found
permalink: en/2015/08/19/go-get-executable-file-not-found/
cover: /img/cover/2015-08-19-go-get-executable-file-not-found.svg
category: Go
---


## Conclusion

After installing the bzr module, I ran `go get` again and it worked without any problems.

```
# yum install -y bzr
```



## Overview

On CentOS 7 running on EC2,
when I ran `go get` as shown below, I got an error saying `bzr could not be found`.

```
$ go get launchpad.net/goamz/aws

[centos@ip-xxx-xx-xx-xx src]$ go get launchpad.net/goamz/aws
go: missing Bazaar command. See http://golang.org/s/gogetcmd
package launchpad.net/goamz/aws: exec: "bzr": executable file not found in $PATH
```

It was a minor stumbling block.


## By the way
`bzr`, like git, is a distributed version control system.

The package I was trying to install this time was managed with Bazaar, which is presumably why it was required.

See the following for reference:
[Bazaar User Reference](http://doc.bazaar.canonical.com/beta/ja/user-reference/index.html)
