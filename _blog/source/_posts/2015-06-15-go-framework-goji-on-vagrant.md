---
layout: post
title: Vagrant + Ansible で go実行環境構築し、フレームワーク(goji)で簡易的なCRUD処理実行
date: 2015-06-15
---

## 環境

- MacOSX Yosemite 10.10.3
- Virtual Box 4.3.28
- Vagrant 1.7.2
- Ansible 1.9.1

## go実行構築環境

VagrantへAnsibleで以下環境構築します。

Linux(Centos6.5) + Nginx + MySQL + Go

```
$ git clone https://github.com/kenzo0107/Vagrant-Ansible
$ cd Vagrant-Ansible/centos6/lnmg
$ vagrant up
$ vagrant ssh-config > ssh.config
$ ansible-playbook lnmg.yml
```

### sshログインしてgoのバージョン確認します。
```
$ vagrant ssh
[vagrant@vagrant-centos65 ~]$ go version
go version go1.4.1 linux/amd64
```


### DB: testdb作成
```
[vagrant@vagrant-centos65 ~]$ mysql -u root
mysql> create database testdb
mysql> quit
```



## Go SampleProject ダウンロード

### プロジェクトtree

```
go_project
├── db
│   └── migrate.go
├── go-sql-driver
│   └── mysql
├── jinzhu
│   └── gorm
├── lib
│   └── pq
├── models
│   └── user.go
├── route
├── route.go
├── user_controller.go
├── views
│   └── user
│       ├── exit.html
│       ├── index.html
│       └── new.html
├── wcl48
│   └── valval
└── zenazn
    └── goji
```

- vagrant にsshログインしgo getでgo_projectインストール

```
$ vagrant ssh
[vagrant@vagrant-centos65 ~]$ go get github.com/kenzo0107/go_project
```

- project内のgoのbinaryファイルのrouteを実行

```
[vagrant@vagrant-centos65 ~]$ cd ~/go/src/github.com/kenzo0107/go_project
[vagrant@vagrant-centos65 ~]$ ./route
<span style="color: #0000cc">2015/06/14 14:27:07.749545 Starting Goji on [::]:8000</span>
```


* ユーザ入力ページへアクセス

[http://192.168.33.11:8000/user/index]



```
~/go/src/github.com/kenzo0107/go_project/routeは
go build route.go user_controller.goにより生成されたbinaryファイルです。
```


## 参考

* http://qiita.com/masahikoofjoyto/items/b2e6c2cad447e48f91ee
