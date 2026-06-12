---
layout: post
title: Installing httpd, MySQL, and PHP from source with Vagrant + Ansible and verifying startup
date: 2015-05-20
categories:
  - [Database]
  - [Infrastructure]
lang: en
translation_id: install-php-httpd-mysql-on-vagrant
permalink: en/2015/05/20/install-php-httpd-mysql-on-vagrant/
cover: /img/cover/2015-05-20-install-php-httpd-mysql-on-vagrant.svg
---

## Development environment

* MacOSX Yosemite 10.10.3
* VirtualBox 4.3.26 r98988
* Vagrant 1.7.2
* Ansible 1.9.1

## Steps

#### 1. Add the Vagrant Box

```
$ vagrant box add centos6.5 https://github.com/2creatives/vagrant-centos/releases/download/v6.5.1/centos65-x86_64-20131205.box
```

#### 2. Clone the git repository

```
$ git clone https://github.com/kenzo0107/Vagrant-Ansible
```

#### 3. Start the VM with Vagrant

```
$ cd Vagrant-Ansible/centos6
$ vagrant up
```

#### 4. Write the ssh-config settings to ssh.config

```
$ vagrant ssh-config > ssh.config
```

#### 5. Connectivity test for the VM

```
$ ansible default -m ping
```
```
default | success >> {
    "changed": false,
    "ping": "pong"
}
```
If `success` is output as shown above, the test passed.

#### 6. Run the environment setup with Ansible

```
$ ansible-playbook lamp.yml
```

Occasionally a timeout occurred, but
running it again completed the setup without any problems.

#### 7. Verify that Apache is running

Access <http://192.168.33.10> and
if `Working!` is displayed, it succeeded.

#### 8. Verify the connection from PHP to MySQL

Access <http://192.168.33.10/dbtest.php> and
if `Connect Success: Localhost via UNIX socket`
is displayed, it succeeded.


That's all.
