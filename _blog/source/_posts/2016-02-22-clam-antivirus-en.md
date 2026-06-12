---
layout: post
title: Installing Clam AntiVirus
date: 2016-02-23
category: Infrastructure
lang: en
translation_id: clam-antivirus
permalink: en/2016/02/22/clam-antivirus/
cover: /img/cover/2016-02-22-clam-antivirus.svg
tags:
- Security
- AntiVirus
---

## Clam Antivirus

Clam Antivirus, commonly abbreviated as ClamAV, is an open-source virus scanner that runs on Unix-like operating systems.

[http://www.clamav.net](http://www.clamav.net)

[wiki - Clam_AntiVirus](https://ja.wikipedia.org/wiki/Clam_AntiVirus)

I personally rented a Sakura VPS, installed some middleware, and was checking that it worked. Before I knew it, the server was hit by a DoS attack and I got a notice saying "We are going to shut down your server." That scare is what led me to install this.

## Installation Steps

Either of the following two methods works fine. Installing via yum is easier, since it comes with a startup script and places everything on the path for you.

- Via yum

```
# yum install clamav clamav-update
```

- Build from source

```
# cd /usr/local/src
# wget http://www.clamav.net/downloads/production/clamav-0.99.tar.gz
# tar zxf clamav-0.99.tar.gz
# cd clamav-0.99
# ./configure --enable-milter
# make
# make install
```

## Updating the Configuration File

/etc/clamd.conf

```
// To update the definition file, uncomment "User clam"
# sed -i 's/^User\s\+clam$/#\0/' /etc/clamd.conf

// Apply the updates
# freshclam
```

## Startup Configuration

```
// Start
# service clamd start

// Configure automatic startup
# chkconfig clamd on
```

## Verifying Execution

```
# clamscan --infected --remove --recursive

----------- SCAN SUMMARY -----------
Known viruses: 4269611
Engine version: 0.99
Scanned directories: 2
Scanned files: 8
Infected files: 0
Data scanned: 0.20 MB
Data read: 0.10 MB (ratio 1.92:1)
Time: 10.934 sec (0 m 10 s)
```

| *Option*    | *Explain*                                  |
| ----------- | ------------------------------------------ |
| --infected  | Show only the virus-infected files         |
| --remove    | Delete the virus-infected files            |
| --recursive | Scan subdirectories recursively            |

You can check each option with `clamscan -h`.

## However

This only installs a virus scanning tool. Since technology advances day by day and there is no guarantee you won't be compromised, always keep an eye on security trends.
