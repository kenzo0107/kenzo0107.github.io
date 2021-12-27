---
layout: post
title: Vagrant+Ansibleでhttpd, MySQL, PHPをソースからインストールし起動確認するまで
date: 2015-05-20
---

## 開発環境

* MacOSX Yosemite 10.10.3
* VirtualBox 4.3.26 r98988
* Vagrant 1.7.2
* Ansible 1.9.1

## 手順

#### 1. Vagrant Box追加

```
$ vagrant box add centos6.5 https://github.com/2creatives/vagrant-centos/releases/download/v6.5.1/centos65-x86_64-20131205.box
```

#### 2. gitリポジトリをclone

```
$ git clone https://github.com/kenzo0107/Vagrant-Ansible
```

#### 3. vagrantからVM起動

```
$ cd Vagrant-Ansible/centos6
$ vagrant up
```

#### 4. ssh-config設定をssh.configへ転記

```
$ vagrant ssh-config > ssh.config
```

#### 5. VM疎通テスト

```
$ ansible default -m ping
```
```
default | success >> {
    "changed": false,
    "ping": "pong"
}
```
上記のようにsuccessと出力されれば成功

#### 6. Ansibleで環境構築実行

```
$ ansible-playbook lamp.yml
```

時折、Timeoutが確認されましたが、
再度実行いただくと問題なく構築されたことを確認してます。

#### 7. Apache起動確認

<http://192.168.33.10>にアクセスし
`Working!`と表示されれば成功

#### 8. phpからMySQLへの接続確認

<http://192.168.33.10/dbtest.php>にアクセスし
`Connect Success: Localhost via UNIX socket`
と表示されれば成功


以上です。
