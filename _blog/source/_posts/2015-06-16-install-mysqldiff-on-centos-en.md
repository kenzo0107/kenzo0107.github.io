---
layout: post
title: Installing and Running mysqldiff on CentOS
date: 2015-06-16
category: Database
lang: en
translation_id: install-mysqldiff-on-centos
permalink: en/2015/06/16/install-mysqldiff-on-centos/
cover: /img/cover/2015-06-16-install-mysqldiff-on-centos.svg
---

### Switch to the root user

```
$ sudo su -
```

### Install mysqldiff

```
# cd /usr/local/src
# wget http://search.cpan.org/CPAN/authors/id/A/AS/ASPIERS/MySQL-Diff-0.43.tar.gz
# tar zxvf MySQL-Diff-0.43.tar.gz
```

### Set the lib path for mysqldiff

```
# vi MySQL-Diff-0.43/bin/mysqldiff
```

```
#!/usr/bin/perl -w

use lib '/usr/local/src/MySQL-Diff-0.43/lib';   ←add this line

=head1 NAME

```

### Install Slurp

```
# yum -y install perl-File-Slurp
```

Symbolic link
```
# ln -s /usr/local/src/MySQL-Diff-0.43/bin/mysqldiff /usr/local/bin/mysqldiff
```

### Verify mysqldiff execution

```
$ mysqldiff
```

Compare db1 and db2

```
$ mysqldiff db1 db2
```
