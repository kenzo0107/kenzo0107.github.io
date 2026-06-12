---
layout: post
title: Building a LAMP Environment with Vagrant + Chef
date: 2014-05-30
category: Infrastructure
lang: en
translation_id: vagrant-chef
permalink: en/2014/05/30/vagrant-chef/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140530/20140530224409.png
tags:
  - Vagrant
  - Chef
---

## Purpose

Use Vagrant and Chef to build a LAMP environment in a local virtual machine.

## Background

When you're working on a shared server, you might think
<span style="color: #e2241a">"I'd love to upgrade MySQL and run some performance tests"</span>,
but doing so would inconvenience everyone else, and you can't just get a new server bought for you.
In situations like that,
you can try things out in a local environment.

That's why I introduced this setup.

## Environment

- MacOSX Mavericks
- Vagrant
- VirtualBox

## Prerequisites

The following must be installed:

- Vagrant
- VirtualBox
- Chef
- knife-solo

↑ For the installation steps, I referred to the dotinstall lessons listed in the "Afterword" at the very bottom.

## 1. Initialize knife-solo

```sh
$ knife configure
```

You'll be asked a bunch of questions, but basically you can just hit [Enter] repeatedly without any problems.

## 2. Add a BOX

A BOX is <b>the base image file used when launching a virtual machine</b>.

Add a box named <b>centos64</b>.

```sh
$ vagrant box add centos64 http://developer.nrel.gov/downloads/vagrant-boxes/CentOS-6.4-i386-v20131103.box
```

* If you want to match the server environment you're using, it's a good idea to log in to your server and run the following to check its environment information.

```sh
$ uname -a
```

You can choose a box URL from the following site.
[http://www.vagrantbox.es/](http://www.vagrantbox.es/)

## 3. Initialize the Virtual Environment

```sh
$ mkdir [vagrant用ディレクトリ]
$ cd  [vagrant用ディレクトリ]
$ vagrant init centos64
```

On success, you'll see that a <b>Vagrantfile</b> has been created.

```sh
$ ls
$ Vagrantfile
```

## 4. Edit the Vagrantfile

Configure the private network so that you can access it from your local environment.

This is access from MacOS → VirtualBox.

Just uncomment the line as shown below!

```sh
#config.vm.network :private_network, ip: "192.168.33.10"
config.vm.network :private_network, ip: "192.168.33.10"
```

## 5. Start the Virtual Environment

Run the following in the directory that contains the Vagrantfile.

```sh
$ vagrant up
```

Running the following shows "running(virtualbox)", which lets you confirm that it's up and running.

```sh
$ vagrant status
```

```sh
Current machine states:

default                   running (virtualbox)

The VM is running. To stop this VM, you can run `vagrant halt` to
shut it down forcefully, or you can run `vagrant suspend` to simply
suspend the virtual machine. In either case, to restart it again,
simply run `vagrant up`.
```

Log in with the following.

```sh
$ vagrant ssh
```

After logging in, run the following when you want to log out.

```sh
$ exit
```

## 6. Create an ssh Alias

```sh
$ vagrant ssh-config --host [sshエイリアス] >> ~/.ssh/config
```

You can then access it with the following.

```sh
$ ssh [sshエイリアス]
```

You can also confirm that it has been written to the ssh config by running the following.

```sh
$ cat ~/.ssh/config
```

## 7. Create a Chef Repository

I think the following structure is easy to manage, so let's create it like this.

```
 |
 +---  [vagrant用ディレクトリ]
 |
 +---  [chef-repo]
```

Move one level up from the [vagrant directory] and run the following.

```sh
$ knife solo init [Chefのリポジトリ名]
```

## 8. Make the Virtual Machine Chef-ready

```sh
$ cd [Chefのリポジトリ名]
$ knife solo prepare [sshエイリアス]
```

## 9. Create a cookbook

```sh
$ knife cookbook create [cookbook名] -o site_cookbooks/
```

## 10. Describe the Environment Settings to Build in the cookbook

```sh
$ vim [Chefのリポジトリ名]/[cookbook名]/recipe/default.rb
```

## 11. Specify the recipe to Run

```sh
$ vim [Chefのリポジトリ名]/nodes/[sshエイリアス名].json
```

```json
{
  "run_list": ["recipe[[cookbook名]]"]
}
```

## 12. Create a Template

```sh
$ vim [Chefリポジトリ名]\[cookbookの名前]\template\default\index.html.erb
```

Feel free to edit the contents of index.html.erb however you like.

As an example:

```html
<h1>Hello, World</h1>
```

## 13. Apply the cookbook to the Vagrant Virtual Environment

```sh
$ knife solo cook [sshエイリアス名]
```

## 13. Access the Web Server of the Virtual Environment You Configured

Access [http://192.168.33.10](http://192.168.33.10) in your browser.

Confirm that the following is displayed in the browser!

```sh
Hello, World
```

Also, when you access the virtual environment, you can confirm that the following file has been created, so give it a try.

```sh
$ vagrant ssh
$ cd /var/www/html/
$ ls

index.html
```

## Afterword

Going through the following dotinstall lessons first makes this easier to get into.

- [essons/basic_vagrant](http://dotinstall.com/lessons/basic_vagrant)
- [lessons/basic_chef](http://dotinstall.com/lessons/basic_chef)
