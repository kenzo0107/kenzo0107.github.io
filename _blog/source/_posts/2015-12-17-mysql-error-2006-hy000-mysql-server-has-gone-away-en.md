---
layout: post
title: "MySQL Troubleshooting - ERROR 2006 (HY000) at line ***: MySQL server has gone away"
date: 2015-12-17
category: Database
lang: en
translation_id: mysql-error-2006-hy000-mysql-server-has-gone-away
permalink: en/2015/12/17/mysql-error-2006-hy000-mysql-server-has-gone-away/
cover: /img/cover/2015-12-17-mysql-error-2006-hy000-mysql-server-has-gone-away.svg
tags:
- MySQL
---

## Overview
The error in the title occurred while importing a database.

The cause is that the import size was too large.

The default value for the import data size is `1M`.

You can check it with the following command.

```
mysql> show variables like 'max_allowed_packet';
```

## Solutions

There are two approaches.
- Configure from the mysql command line (temporary)
- Configure in my.cnf (permanent)


### Raise it temporarily from the mysql command line

This requires no restart and has minimal impact.
However, since the value reverts to the default after a restart,
if you need a permanent fix
you must configure it in my.cnf and restart mysqld.

Example) Set it to 10MB

```
mysql> set global max_allowed_packet = 1000000;
```

### Configure my.cnf to raise `max_allowed_packet`

##### Locating the my.cnf path

```
# mysql --help | grep my.cnf
                      order of preference, my.cnf, $MYSQL_TCP_PORT,
/etc/my.cnf /etc/mysql/my.cnf /usr/etc/my.cnf ~/.my.cnf
```

It searches for my.cnf in the following order.
`/etc/my.cnf` → `/etc/mysql/my.cnf` → `/usr/etc/my.cnf` → `~/.my.cnf`

Since this differs per environment, determine which config file to use, including whether it actually exists.

In most cases `/etc/my.cnf` is the common one.



##### Configure it under [mysqld] in my.cnf.

Let's try setting it to 10MB.

```
[mysqld]
max_allowed_packet=10MB
```

Once configured as above, the settings take effect after a restart.


## Verification

Let's verify that the setting has been applied.

```
mysql> show variables like 'max_allowed_packet';

+--------------------+----------+
| Variable_name      | Value    |
+--------------------+----------+
| max_allowed_packet | 10485760 |
+--------------------+----------+
```



That's all.
