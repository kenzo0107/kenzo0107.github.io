---
layout: post
title: No Password Needed! SSH Login with Public Key Authentication
date: 2016-04-05
lang: en
translation_id: ssh-login-without-password
permalink: en/2016/04/05/ssh-login-without-password/
tags:
  - ssh
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160405/20160405163215.jpg
---

## Overview

When you use rsync from Jenkins or crontab,
running it over SSH can prompt for a password
and interrupt the process.

To avoid this, I explicitly configured SSH so that you can access it
without being asked for a password by using public key authentication.

Here is a summary.

## Environment

- Let the global IP of the source server A be 192.168.11.200.
- Let the global IP of the destination server B be 192.168.11.201.

The goal is to SSH log in from server A to server B using public key authentication.

The steps are as follows.

## Source Server A

### Create the public key

```sh
[host A]# mkdir ~/.ssh
[host A]# ssh-keygen -t rsa

Generating public/private rsa key pair.
Enter file in which to save the key (/var/lib/pgsql/.ssh/id_rsa):　←何も入力せず[Enter]を押す
Enter passphrase (empty for no passphrase):　←何も入力せず[Enter]キーを押す
Enter same passphrase again:　←何も入力せず[Enter]キーを押す
Your identification has been saved in <home>/.ssh/id_dsa.
Your public key has been saved in <home>/.ssh/id_rsa.pub.
The key fingerprint is:
7e:38:5c:9f:f3:e2:67:eb:ce:c6:07:83:48:c8:85:ec

[host A]# ls -l
合計 12
-rw------- 1 hogehoge hogehoge 668  5月 25 15:11 id_rsa　←作成された秘密鍵
-rw-r--r-- 1 hogehoge hogehoge 610  5月 25 15:11 id_rsa.pub　←作成された公開鍵

[host A]# cat id_rsa.pub
<中身をコピーする>
```

## Destination Server B

### Save the source server's public key into authorized_keys

```sh
[host B]# cd ~
[host B]# chmod 755 .
[host B]# mkdir .ssh
[host B]# chmod 700 .ssh
[host B]# cd .ssh
[host B]# vi id_rsa.pub
<接続元サーバでコピーした公開鍵の内容をペースト>

[host B]# ls id_rsa.pub
id_rsa.pub

[host B]# cat id_rsa.pub >> authorized_keys
[host B]# chmod 600 authorized_keys
│-rw------- 1 hogehoge hogehoge 796  4月  5 15:50 authorized_keys
```

### Configure access permission for the source server

- Edit /etc/hosts.allow and allow the source IP.

```sh
[host B]# vi /etc/hosts.allow
```

```sh
#
# hosts.allow   This file describes the names of the hosts which are
#               allowed to use the local INET services, as decided
#               by the '/usr/sbin/tcpd' server.
#
sshd: xxx.x.xx.xx xxx.x.xxx. xx.xx.x. xx.xx.xxx.xx
sshd: xxx.xx.xxx.xx
sshd: 192.168.11.200 ← 追加
```

### Configure public key authentication

- Save a backup

```sh
[host B]# cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bk
```

- Edit

```sh
[host B]# vi /etc/ssh/sshd_config
```

```sh
#PubkeyAuthentication yes    ← コメントアウトを外す
#AuthorizedKeysFile   .ssh/authorized_keys   ← コメントアウトを外す
↓
PubkeyAuthentication yes
AuthorizedKeysFile   .ssh/authorized_keys
```

- Check the diff

```sh
[host B]# diff /etc/ssh/sshd_config.bk /etc/ssh/sshd_config

< #PubkeyAuthentication yes
< #AuthorizedKeysFile   .ssh/authorized_keys
---
> PubkeyAuthentication yes
> AuthorizedKeysFile    .ssh/authorized_keys
```

- Check the sshd configuration

```sh
[host B]# sshd -t
// 何も出力されなければ構文上問題なし。
// 但し存在しないパスを指定するなどまではチェックしないので注意。
```

- Restart sshd

```sh
[host B (CentOS7)]# systemctl restart sshd
[host B (CentOS6)]# service sshd restart
```

That completes the setup on the destination server.

## SSH from source server A without a password

```sh
[host A]# ssh 192.168.11.201
Last login: Tue Apr  5 16:02:08 2016 from xxx.xx.xxx.xxx
```

Login successful!

## When login fails

- Investigate the logs.

You will see that the authentication failed because the
permissions or ownership are not right.

```sh
# tail -f /var/log/secure

Authentication refused: bad ownership or modes for directory <homeディレクトリ>
```

## Afterword

With the default `sshd_config` settings below,
both password authentication and key authentication will pass.

```sh
#PubkeyAuthentication yes
#AuthorizedKeysFile   .ssh/authorized_keys
PasswordAuthentication yes
```

According to infrastructure-focused companies and word on the street,
many companies leave both authentication methods enabled by default.

That's all.
