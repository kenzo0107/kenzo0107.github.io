---
layout: post
title: パスワードなし！公開鍵認証でSSHログイン
date: 2016-04-05
tags:
  - ssh
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160405/20160405163215.jpg
---

## 概要

rsync を Jenkins や crontab で利用する場合
SSH 経由で実行する際、
パスワードを求められ処理が中断してしまうということがあるかと思います。

その為、SSH で公開鍵認証という方法でパスワードを求めることなく
SSH アクセスできる様な設定を明示的にしました。

以下まとめます。

## 環境

- 接続元サーバ A の global IP を 192.168.11.200 とします。
- 接続先サーバ B の global IP を 192.168.11.201 とします。

サーバ A → サーバ B へ 公開鍵認証で SSH ログインを目的とします。

以下手順です。

## 接続元サーバ A

### 公開鍵作成

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

## 接続先サーバ B

### 接続元サーバの公開鍵を authorized_keys に保存

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

### 接続元サーバのアクセス許可設定

- /etc/hosts.allow を編集し 接続元 IP 許可設定する。

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

### 公開鍵認証許可設定

- バックアップ保存

```sh
[host B]# cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bk
```

- 修正

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

- 差分確認

```sh
[host B]# diff /etc/ssh/sshd_config.bk /etc/ssh/sshd_config

< #PubkeyAuthentication yes
< #AuthorizedKeysFile   .ssh/authorized_keys
---
> PubkeyAuthentication yes
> AuthorizedKeysFile    .ssh/authorized_keys
```

- sshd configure チェック

```sh
[host B]# sshd -t
// 何も出力されなければ構文上問題なし。
// 但し存在しないパスを指定するなどまではチェックしないので注意。
```

- sshd リスタート

```sh
[host B (CentOS7)]# systemctl restart sshd
[host B (CentOS6)]# service sshd restart
```

以上で接続先サーバでの準備完了しました。

## 接続元サーバ A から パスワードなしで SSH 接続する

```sh
[host A]# ssh 192.168.11.201
Last login: Tue Apr  5 16:02:08 2016 from xxx.xx.xxx.xxx
```

ログイン成功！

## ログイン失敗する場合

- ログを調査しましょう。

権限や所有権がよろしくない、
ということで認証失敗理由がわかります。

```sh
# tail -f /var/log/secure

Authentication refused: bad ownership or modes for directory <homeディレクトリ>
```

## あとがき

以下デフォルトの `sshd_config` の設定の場合
パスワード認証と鍵認証、どちらも認証パス可能です。

```sh
#PubkeyAuthentication yes
#AuthorizedKeysFile   .ssh/authorized_keys
PasswordAuthentication yes
```

インフラ専門の会社さんや街の噂では
デフォルトでどちらも認証 OK にしている企業さん多いという話でした。

以上です。
