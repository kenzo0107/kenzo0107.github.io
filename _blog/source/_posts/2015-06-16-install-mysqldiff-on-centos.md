---
layout: post
title: CentOSにmysqldiffインストールし実行確認
date: 2015-06-16
---

### rootユーザに切り替え

```
$ sudo su -
```

### mysqldiff インストール

```
# cd /usr/local/src
# wget http://search.cpan.org/CPAN/authors/id/A/AS/ASPIERS/MySQL-Diff-0.43.tar.gz
# tar zxvf MySQL-Diff-0.43.tar.gz
```

### mysqldiffにlibパスを設定

```
# vi MySQL-Diff-0.43/bin/mysqldiff
```

```
#!/usr/bin/perl -w

use lib '/usr/local/src/MySQL-Diff-0.43/lib';   ←追加

=head1 NAME

```

### Slurpインストール

```
# yum -y install perl-File-Slurp
```

シンボリックリンク
```
# ln -s /usr/local/src/MySQL-Diff-0.43/bin/mysqldiff /usr/local/bin/mysqldiff
```

### mysqldiff実行確認

```
$ mysqldiff
```

db1, db2 を比較

```
$ mysqldiff db1 db2
```
