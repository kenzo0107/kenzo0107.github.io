---
layout: post
title: "MySQL Troubleshooting - ERROR 1045 (28000): Access denied for user 'root'@'localhost' (using password: NO)"
date: 2016-01-15
category: Database
lang: en
translation_id: mysql-error-1045-28000-access-denied-for-user
permalink: en/2016/01/15/mysql-error-1045-28000-access-denied-for-user/
cover: /img/cover/2016-01-15-mysql-error-1045-28000-access-denied-for-user.svg
tags:
- MySQL
---

## Overview

I was using MAMP locally on Mac OS X, and one day a wrong operation triggered the following error,
so I've put together how I dealt with it.

```
$ mysql -u root
ERROR 1045 (28000): Access denied for user 'root'@'localhost' (using password: NO)
```

This happens when, for example, you accidentally remove the root user's access privileges in your local environment.

## Solution

```
// stop mysql
$ service mysqld stop

// the root user's access privileges have been lost
// → start mysql in safe mode with the option to skip (ignore) the grant tables
$ mysqld_safe --skip-grant-tables &

// access as the root user
$ mysql -u root

// empty the current privilege table
mysql> TRUNCATE TABLE mysql.user;
Query OK, 0 rows affected (0.00 sec)

// apply the privileges
mysql> FLUSH PRIVILEGES;
Query OK, 0 rows affected (0.01 sec)

// grant the root user full access privileges to all DBs on localhost
mysql> GRANT ALL PRIVILEGES on *.* to root@localhost IDENTIFIED BY '(root's password)' WITH GRANT OPTION;
Query OK, 0 rows affected (0.01 sec)

// apply the privileges
mysql> flush privileges;
Query OK, 0 rows affected (0.00 sec)

// check the privilege settings
mysql> SELECT host, user FROM mysql.user;

// stop the mysql CLI mode (Ctrl+c also works)
mysql> quit;

// kill the mysql-related processes started in safe mode
$ ps aux | grep mysql | grep -v grep | awk '{print "kill -9", $2}'|sh

// start mysql
$ service mysqld start

// access mysql as the root user
$ mysql -u root -p(root's password)
mysql>

```

When the root user loses its privileges and you're at your wit's end, `safe_mode` comes in handy in such a pinch.

That's all.
