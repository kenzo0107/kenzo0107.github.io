---
layout: post
title: Building a Go Runtime Environment with Vagrant + Ansible and Running Simple CRUD with the goji Framework
date: 2015-06-15
categories:
  - [Go]
  - [Infrastructure]
lang: en
translation_id: go-framework-goji-on-vagrant
permalink: en/2015/06/15/go-framework-goji-on-vagrant/
cover: /img/cover/2015-06-15-go-framework-goji-on-vagrant.svg
---

## Environment

- MacOSX Yosemite 10.10.3
- Virtual Box 4.3.28
- Vagrant 1.7.2
- Ansible 1.9.1

## Building the Go Runtime Environment

We will provision the following environment on Vagrant using Ansible.

Linux(Centos6.5) + Nginx + MySQL + Go

```
$ git clone https://github.com/kenzo0107/Vagrant-Ansible
$ cd Vagrant-Ansible/centos6/lnmg
$ vagrant up
$ vagrant ssh-config > ssh.config
$ ansible-playbook lnmg.yml
```

### Log in via ssh and check the Go version.
```
$ vagrant ssh
[vagrant@vagrant-centos65 ~]$ go version
go version go1.4.1 linux/amd64
```


### DB: Create testdb
```
[vagrant@vagrant-centos65 ~]$ mysql -u root
mysql> create database testdb
mysql> quit
```



## Downloading the Go SampleProject

### Project tree

```
go_project
├── db
│   └── migrate.go
├── go-sql-driver
│   └── mysql
├── jinzhu
│   └── gorm
├── lib
│   └── pq
├── models
│   └── user.go
├── route
├── route.go
├── user_controller.go
├── views
│   └── user
│       ├── exit.html
│       ├── index.html
│       └── new.html
├── wcl48
│   └── valval
└── zenazn
    └── goji
```

- Log in to vagrant via ssh and install go_project with go get

```
$ vagrant ssh
[vagrant@vagrant-centos65 ~]$ go get github.com/kenzo0107/go_project
```

- Run the Go binary file `route` inside the project

```
[vagrant@vagrant-centos65 ~]$ cd ~/go/src/github.com/kenzo0107/go_project
[vagrant@vagrant-centos65 ~]$ ./route
<span style="color: #0000cc">2015/06/14 14:27:07.749545 Starting Goji on [::]:8000</span>
```


* Access the user input page

[http://192.168.33.11:8000/user/index]



```
~/go/src/github.com/kenzo0107/go_project/routeは
go build route.go user_controller.goにより生成されたbinaryファイルです。
```


## References

* http://qiita.com/masahikoofjoyto/items/b2e6c2cad447e48f91ee
