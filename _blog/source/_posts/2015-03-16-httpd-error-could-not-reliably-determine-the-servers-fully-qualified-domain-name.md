---
layout: post
title: "httpd: Could not reliably determine the server's fully qualified domain name, using 127.0.0.1 for ServerName"
date: 2015-03-16
---

## 概要
Apache再起動時に以下のようなエラー文が表示される。
※Apache自体は問題なく再起動できています。


```
service httpd restart

httpd を停止中:                                            [  OK  ]
httpd を起動中: httpd: Could not reliably determine the server's fully qualified domain name, using 127.0.0.1 for ServerName
                                                           [  OK  ]
```


ServerNameに127.0.0.1を使用している[FQDN](http://ja.wikipedia.org/wiki/Fully_Qualified_Domain_Name)を確実に判断できません。


## 原因
/etc/hosts で「127.0.0.1」で設定されているhost名がApache設定ファイルで定義されていない

hogehostについてApache定義ファイルで設定されていない。

```
127.0.0.1      hogehost localhost.localdomain localhost
```

/etc/httpd/conf/httpd.conf
```
#ServerName www.example.com:80
ServerName hogehost:80
```
