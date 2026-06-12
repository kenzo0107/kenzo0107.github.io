---
layout: post
title: Installing SonarQube on CentOS7 and Verifying Access
date: 2016-05-19
lang: en
translation_id: install-sonarqube-on-centos7
permalink: en/2016/05/19/install-sonarqube-on-centos7/
tags:
  - SonarQube
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160520/20160520164314.png
---

## Overview

[sonarqube](http://www.sonarqube.org/) is
a great tool that can aggregate code metrics for multiple languages such as
Java, Python, Ruby, and PHP.

Previously, I wrote up how to extract code metrics for the C# code of a
Unity project in a local Mac OS X environment.

{% linkPreview https://kenzo0107.github.io/2014/06/22/2014-06-22-sonarqube-maxosx _blank %}

This time, I have summarized below how to set it up on CentOS7.

## Environment

- CentOS7 64bit
- Java 1.8
- ec2 t.micro

## Installing the JDK

```sh
# cd /usr/local
# wget --no-check-certificate --no-cookies --header "Cookie: oraclelicense=accept-securebackup-cookie" "http://download.oracle.com/otn-pub/java/jdk/8u45-b14/jdk-8u45-linux-x64.tar.gz"
```

```sh
# tar xvf jdk-8u45-linux-x64.tar.gz
```

```sh
# ln -s jdk1.8.0_45 latest
```

### Setting the JAVA_HOME Environment Variable

Setting it in .bash_profile makes the environment variable differ per user,
so to configure it commonly for all users, place a shell script under /etc/profile.d/.

```sh
# echo "export JAVA_HOME=/usr/local/java/latest
export PATH=$PATH:$JAVA_HOME/bin" > /etc/profile.d/javaenv.sh

# echo "export JAVA_HOME=/usr/local/java/latest
export PATH=$PATH:$JAVA_HOME/bin" > /etc/profile.d/javaenv.csh
```

## Installing MySQL

This time, I am installing MySQL on the same server.
If you are running a separate MySQL server, this is not necessary.

```sh
# yum -y install http://dev.mysql.com/get/mysql-community-release-el6-5.noarch.rpm
# yum -y install mysql-community-server
# chown -R mysql:mysql /var/lib/mysql/*
# systemctl start mysqld
# chkconfig mysqld on

// Below, configure with DB name: sonar, DB User: sonar, DB Pass: sonar
# mysql -u root

mysql> CREATE DATABASE sonar;
mysql> CREATE USER 'sonar'@'localhost' IDENTIFIED by 'sonar';
mysql> GRANT ALL PRIVILEGES ON sonar.* TO 'sonar'@'localhost';
mysql> FLUSH PRIVILEGES;
```

## Installing SonarQube

Get the download zip from the following site.
[SonarQube Donwloads](http://www.sonarqube.org/downloads/)

![Imgur](http://i.imgur.com/etIqshd.png)

* As of 2016-05-19, the latest is ver 5.5

```sh
# mkdir /usr/local/sonarqube
# cd /usr/local/sonarqube
# wget https://sonarsource.bintray.com/Distribution/sonarqube/sonarqube-5.5.zip
# unzip sonarqube-5.5.zip
# ln -s sonarqube-5.5 sonar
```

### Setting the SONAR_HOME Environment Variable

```sh
# echo "setenv SONAR_HOME=/usr/local/sonarqube/sonar
setenv PATH=$PATH:$SONAR_HOME/bin/linux-x86-64" > /etc/profile.d/sonarenv.sh

# echo "setenv SONAR_HOME=/usr/local/sonarqube/sonar
setenv PATH=$PATH:$SONAR_HOME/bin/linux-x86-64" > /etc/profile.d/sonarenv.csh
```

## Configuring SonarQube to Use MySQL

Edit the following file to configure access to the database you created.

- /usr/local/sonarqube/sonar/conf/sonar.properties

```sh
sonar.jdbc.username=sonar # DB User
sonar.jdbc.password=sonar # DB Password
sonar.jdbc.url=jdbc:h2:tcp://localhost:9092/sonar # DB url
```

### Configuring the java Command Used by SonarQube

Edit the following file and change it so that the java command used by SonarQube
points to the java inside the JDK you installed.

- /usr/local/sonarqube/sonar/conf/wrapper.conf

```sh
#wrapper.java.command=java
wrapper.java.command=/usr/local/java/latest/bin/java
```

## Configuring the SonarQube Startup Script

```sh
# ln -s /usr/local/sonarqube/sonar/bin/linux-x86-64/sonar.sh /etc/init.d/sonar
# chkconfig --add sonar
# chkconfig sonar on
```

## Rebooting the Server

Reboot the server to apply the environment variables configured under /etc/profile.d.

```sh
# reboot
```

## Accessing and Verifying

`http://<IP address>:9000`

If the SonarQube admin page is displayed, you are all set!

<div style="text-align:center;">
<img src="http://i.imgur.com/ZwZct8A.png" width="100%">
</div>

### If You Cannot Access After Rebooting

Review the SonarQube settings, or alternatively,

with a low-memory instance like the ec2 t2.micro used here,
MySQL may crash due to insufficient memory.

Refer to the following to address it.

{% linkPreview https://kenzo0107.github.io/2016/05/20/2016-05-20-mysql-cannot-allocate-memory-for-the-buffer-pool _blank %}

## Afterword

In any project, there are surely many things you want to fix here and there!

At that time, rather than making a vague judgment like "this feels hard to use, so let's fix it,"

the goal of introducing this was to be able to follow a process of first looking at
the overall state of things as numbers and making decisions based on that.

Next time, I will summarize how to run it from Jenkins.
