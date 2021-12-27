---
layout: post
title: CentOS7 に MySQL 5.6インストール
date: 2015-08-05
---

参照: http://www.kakiro-web.com/linux/mysql-yum-repository-install.html



## MySQLのリポジトリ設定パッケージをダウンロード

```console
$ wget http://dev.mysql.com/get/mysql-community-release-el7-5.noarch.rpm
```

## MySQLのリポジトリのインストール

```console
# rpm -Uvh mysql-community-release-el7-5.noarch.rpm

# MySQL 5.6 のリポジトリ利用
# yum --enablerepo=mysql56-community list | grep mysql

# MySQL 5.6 インストール
# yum --enablerepo=mysql56-community install -y mysql-community-server
```


rpm(Redhat Package Management)コマンドについて以下参照

http://itpro.nikkeibp.co.jp/article/COLUMN/20060227/230875/


## MySQL 起動 / 登録

```console
# systemctl start mysqld.service
# systemctl enable mysqld.service
```


##### DBアクセス

```console
$ mysql -u root

Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 3
Server version: 5.6.25 MySQL Community Server (GPL)

Copyright (c) 2000, 2015, Oracle and/or its affiliates. All rights reserved.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

mysql>
```

上記のようにアクセスできれば成功です。

以上
