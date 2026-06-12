---
layout: post
title: Installing Docker and Docker Compose on Vagrant (Ubuntu)
date: 2017-04-13
category: Infrastructure
lang: en
translation_id: install-docker-and-docker-compose-on-vagrant
permalink: en/2017/04/13/install-docker-and-docker-compose-on-vagrant/
tags:
  - Docker
  - Vagrant
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170413/20170413222957.png
---

## Overview

This is a summary of the steps I used to install Docker and Docker Compose on Vagrant (Ubuntu), which I set up for building a development environment.

## Creating the Vagrantfile

I've kept it pretty simple.

- Vagrantfile

```ruby
# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/trusty64"
  config.vm.network "private_network", ip: "192.168.35.101"
end
```

You can also install Docker Compose with `vagrant provision`, but since provisioning that relies on Vagrant can't be reused in other environments, I'll take the approach of installing it on the OS itself.

## Starting the VM

```
MacOS%$ vagrant up
...
wait a while
...

MacOS%$ vagrant ssh

// SSH login successful
vagrant%$
```

## Checking the Vagrant Ubuntu Environment Info

```
vagrant%$ lsb_release -a

No LSB modules are available.
Distributor ID: Ubuntu
Description:    Ubuntu 14.04.5 LTS
Release:        14.04
Codename:       trusty
```

## Checking the Kernel Version

```
vagrant%$ uname -r
3.13.0-116-generic
```

A kernel version lower than 3.10 risks causing bugs, so that's a no-go. Use a box with a higher kernel version instead.

## Uninstalling Old Versions

```
vagrant%$ sudo apt-get remove docker docker-engine
```

## Installing the extra Packages

This is to allow Docker to use the [aufs](http://docs.docker.jp/engine/userguide/storagedriver/aufs-driver.html) storage driver.

```
vagrant%$ sudo apt-get update
vagrant%$ sudo apt-get -y install \
    wget \
    linux-image-extra-$(uname -r) \
    linux-image-extra-virtual
```

## Installing Docker

```
// Install Docker
vagrant%$ wget -qO- https://get.docker.com/ | sh

// Check the Docker version
vagrant%$ docker --version
Docker version 17.04.0-ce, build 4845c56

// Add the vagrant user to the docker group (you can confirm it takes effect once you log out and log back in)
vagrant%$ sudo usermod -aG docker vagrant
```

## Installing Docker Compose

```
vagrant%$ curl -L "https://github.com/docker/compose/releases/download/1.12.0/docker-compose-$(uname -s)-$(uname -m)" >  ~/docker-compose

// Grant execute permission
vagrant%$ chmod +x ~/docker-compose

// Move it into the execution path
vagrant%$ sudo mv docker-compose /usr/bin/

// Check the Docker Compose version
vagrant%$ docker-compose --version
docker-compose version 1.12.0, build b31ff33
```

## Log Out Once and Log Back In

```
vagrant%$ exit
MacOS%$ vagrant ssh
vagrant%$
```

## Adjusting Memory and Swap Usage

To reduce memory overhead and performance degradation when Docker is not in use, you need to configure GRUB (GRand Unified Bootloader).

- grub configuration

```
vagrant%$ sudo vi /etc/default/grub

# GRUB_CMDLINE_LINUX=""
GRUB_CMDLINE_LINUX="cgroup_enable=memory swapaccount=1"
```

- Update GRUB (GRand Unified Bootloader)

```
vagrant%$ sudo update-grub

// Reboot just to be safe
vagrant%$ sudo reboot
```

That completes the setup ♪

## Let's Try It Out Right Away

As a quick tutorial, let's spin up an nginx container.

```
vagrant%$ docker run --rm -p 80:80 nginx:mainline-alpine

Unable to find image 'nginx:mainline-alpine' locally
mainline-alpine: Pulling from library/nginx
709515475419: Already exists
4b21d71b440a: Pull complete
c92260fe6357: Pull complete
ed383a1b82df: Pull complete
Digest: sha256:5aadb68304a38a8e2719605e4e180413f390cd6647602bee9bdedd59753c3590
Status: Downloaded newer image for nginx:mainline-alpine
```

## Accessing from a Browser

Access it from a browser on your local Mac.

[http://192.168.35.101](http://192.168.35.101)

* 192.168.35.101 ... the private IP specified in Vagrant

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170413/20170413224153.png" width="100%">
</div>

The Welcome page was displayed without any problems.

You can see that an access log like the following is output to the earlier log.

```
192.168.35.1 - - [13/Apr/2017:10:45:46 +0000] "GET / HTTP/1.1" 304 0 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36" "-"
```

We can now access it through MacOS → Vagrant → Docker ♪

## Addendum

I've placed the Box I created this time on Vagrant Cloud.

https://atlas.hashicorp.com/kenzo0107/boxes/ubuntu14.04.5LTS-docker-dockercompose/

Based on this setup, I'd like to write about building various environments going forward ♪

## References

- [Using the AUFS storage driver](http://docs.docker.jp/engine/userguide/storagedriver/aufs-driver.html)
- [Docker run reference](http://docs.docker.jp/engine/reference/run.html)
