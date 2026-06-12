---
layout: post
title: Building a Development Environment on macOS with Boot2Docker
date: 2015-06-28
category: Infrastructure
lang: en
translation_id: boot2docker-on-macosx
permalink: en/2015/06/28/boot2docker-on-macosx/
cover: https://i.imgur.com/vbJj8bW.png
---

# Setting Up a Docker Engine Environment

## Development Environment

* macOS Yosemite 10.3.3
* VirtualBox 4.3.28
* Vagrant 1.7.2

---

The following are required to use Docker:

#### Docker Engine
* Docker client
    - Runs the docker command
* Docker server
    - Runs Docker containers


#### Docker Engine Architecture

* The Docker server and client communicate over RESTful HTTPS

```
                        +---------+ +----------+
                        |Docker   | |Docker    |
                        |Container| |Container |
                        +---------+ +----------+
                              ↑         ↑
+-----------------+       +---------------+
| Docker Client   | ----> | Docker Server |
|(docker Command) |       +---------------+
+-----------------+
```


To set up the above, install the following:

#### Boot2Docker

* Software that lets you set up both the Docker client and the Docker server together

Boot2Docker architecture

* Docker Client
* Linux VM
* Docker Server

```
|               | Docker Server |
|               | Linux VM      |
| Docker Client | VirtualBox    |
+-------------------------------+
|      Mac OSX or Windows       |
```

## Installation Steps

##### From the Boot2Docker official site: <http://boot2docker.io/> click the "MacOSX button"

![Boot2Docker installation](http://i.imgur.com/vbJj8bW.png)

##### Install the Boot2Docker package

![Boot2Docker installer](http://i.imgur.com/wJAXyIF.png)

##### Run the installer
![Imgur](http://i.imgur.com/GHSOGMG.png)

![Imgur](http://i.imgur.com/1BhLI3z.png)


##### Run the following in a terminal or similar

* Create the Linux VM

```
$ boot2docker init
```

* Start the Linux VM

```
$ boot2docker start

Waiting for VM and Docker daemon to start...
...........................ooooooooooooooooo
Started.
Writing /Users/kenzo/.boot2docker/certs/boot2docker-vm/ca.pem
Writing /Users/kenzo/.boot2docker/certs/boot2docker-vm/cert.pem
Writing /Users/kenzo/.boot2docker/certs/boot2docker-vm/key.pem

To connect the Docker client to the Docker daemon, please set:
    export DOCKER_HOST=tcp://192.168.59.103:2376
    export DOCKER_CERT_PATH=/Users/kenzo/.boot2docker/certs/boot2docker-vm
    export DOCKER_TLS_VERIFY=1
```

* Check the Linux VM status

```
$ boot2docker status
running
```

* Set the environment variables

When you start with `boot2docker start`, run the export settings it prints out

```
$ export DOCKER_HOST=tcp://192.168.59.103:2376
$ export DOCKER_CERT_PATH=/Users/kenzo/.boot2docker/certs/boot2docker-vm
$ export DOCKER_TLS_VERIFY=1
```

* Check the overall Docker Engine configuration

```
$ docker info

Containers: 0
Images: 0
Storage Driver: aufs
 Root Dir: /mnt/sda1/var/lib/docker/aufs
 Backing Filesystem: extfs
 Dirs: 0
 Dirperm1 Supported: true
Execution Driver: native-0.2
Logging Driver: json-file
Kernel Version: 4.0.5-boot2docker
Operating System: Boot2Docker 1.7.0 (TCL 6.3); master : 7960f90 - Thu Jun 18 18:31:45 UTC 2015
CPUs: 4
Total Memory: 1.955 GiB
Name: boot2docker
ID: G776:YBRC:OUGN:T7KF:TM43:6BTU:2PVW:HGWW:3CXO:YLCF:23ON:EJVE
Debug mode (server): true
File Descriptors: 9
Goroutines: 15
System Time: 2015-06-28T12:07:33.59750188Z
EventsListeners: 0
Init SHA1:
Init Path: /usr/local/bin/docker
Docker Root Dir: /mnt/sda1/var/lib/docker
```

### Caveat

If the `Storage Driver` shown by `docker info` is `aufs`,

you will not be able to install httpd in a Docker container.

You need to check which Storage Driver is in use beforehand.


## Summary of Dockerfile Best Practices

https://docs.docker.com/articles/dockerfile_best-practices/
