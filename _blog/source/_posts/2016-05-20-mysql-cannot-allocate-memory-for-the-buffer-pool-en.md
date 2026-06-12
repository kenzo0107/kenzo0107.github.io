---
layout: post
title: 'Troubleshooting MySQL Crashes: Cannot allocate memory for the buffer pool'
date: 2016-05-20
lang: en
translation_id: mysql-cannot-allocate-memory-for-the-buffer-pool
permalink: en/2016/05/20/mysql-cannot-allocate-memory-for-the-buffer-pool/
tags:
  - MySQL
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160520/20160520103201.jpg
---

## Overview

After installing and starting MySQL and SonarQube on an AWS E2 instance,
I ran into an issue where MySQL kept crashing.

Checking the logs revealed the following errors:

- /var/log/mysqld.log

```sh
InnoDB: mmap(137363456 bytes) failed; errno 12
[ERROR] InnoDB: Cannot allocate memory for the buffer pool
[ERROR] Plugin 'InnoDB' init function returned error.
[ERROR] Plugin 'InnoDB' registration as a STORAGE ENGINE
[ERROR] Unknown/unsupported storage engine: InnoDB
[ERROR] Aborting
```

```
Cannot allocate memory for the buffer pool

Cannot allocate memory to the buffer pool
```

In short, there isn't enough memory to allocate.
So let's create some memory.

## Solution 1. Create a swap area

### Create the swap area

```sh
// Create an empty file
# dd if=/dev/zero of=/swapfile bs=1M count=1024

// Configure the created empty file as a swap area
# mkswap /swapfile

// Enable the swap area
# swapon /swapfile
```

### Verify the swap area

```sh
# free

              total        used        free      shared  buff/cache   available
Mem:        1015472      833592       66456        1456      115424       54708
Swap:       1048572      491136      557436   ← Confirm that the Swap entry has been added
```

### Restart mysql

```sh
# systemctl restart mysqld
```

## Solution 2. Increase the innodb_buffer_pool_size allocation

### Check the currently configured innodb_buffer_pool_size

```sh
$ mysql -u <user> -p<pass> <db>  -e "SHOW VARIABLES LIKE 'innodb_buffer_pool_size'"

+-------------------------+-----------+
| Variable_name           | Value     |
+-------------------------+-----------+
| innodb_buffer_pool_size | 118835956 |
+-------------------------+-----------+
```

You can see that it is below the 137363456 from the error log.
Let's increase this allocated memory.

### Find the location of my.cnf

The files are searched from left to right, and the first my.cnf that exists is used.
/etc/my.cnf → /etc/mysql/my.cnf → /usr/etc/my.cnf → ~/.my.cnf

```sh
# mysql --help | grep my.cnf
                      order of preference, my.cnf, $MYSQL_TCP_PORT,
/etc/my.cnf /etc/mysql/my.cnf /usr/etc/my.cnf ~/.my.cnf
```

### Add memory

In my case,
there was no innodb_buffer_pool_size setting in my.cnf,
so I added it.

- my.cnf

```sh
[mysqld]
...
...

# Added the following
innodb_buffer_pool_size = 256M

[mysqld_safe]
...
...
```

### Restart mysql

```sh
# systemctl restart mysqld
```

### Verify that it has increased

```sh
$ mysql -u <user> -p<pass> <db>  -e "SHOW VARIABLES LIKE 'innodb_buffer_pool_size'"

+-------------------------+-----------+
| Variable_name           | Value     |
+-------------------------+-----------+
| innodb_buffer_pool_size | 268435456 |
+-------------------------+-----------+
```

The error log that had been occurring is now gone.
