---
layout: post
title: Installing MySQL 5.6 on CentOS 7
date: 2015-08-05
lang: en
translation_id: install-mysql5.6-on-centos7
permalink: en/2015/08/05/install-mysql5.6-on-centos7/
cover: /img/cover/2015-08-05-install-mysql5.6-on-centos7.svg
---

Reference: http://www.kakiro-web.com/linux/mysql-yum-repository-install.html



## Download the MySQL repository configuration package

```console
$ wget http://dev.mysql.com/get/mysql-community-release-el7-5.noarch.rpm
```

## Install the MySQL repository

```console
# rpm -Uvh mysql-community-release-el7-5.noarch.rpm

# MySQL 5.6 のリポジトリ利用
# yum --enablerepo=mysql56-community list | grep mysql

# MySQL 5.6 インストール
# yum --enablerepo=mysql56-community install -y mysql-community-server
```


For more about the rpm (Redhat Package Management) command, see the following:

http://itpro.nikkeibp.co.jp/article/COLUMN/20060227/230875/


## Start / register MySQL

```console
# systemctl start mysqld.service
# systemctl enable mysqld.service
```


##### Accessing the database

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

If you can connect as shown above, you have succeeded.

That's all.
