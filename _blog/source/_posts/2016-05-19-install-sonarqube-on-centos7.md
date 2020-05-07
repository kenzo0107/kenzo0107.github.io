---
layout: post
title: CentOS7にSonarQubeをインストールしアクセス確認まで
date: 2016-05-19
tags:
- SonarQube
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160520/20160520164314.png
---


## 概要

[sonarqube](http://www.sonarqube.org/) は
Java, Python, Ruby, PHP等、複数言語のコードメトリクス集計ができる
優れものです。

以前 MacOSXローカル環境で
Unityプロジェクト C#コードのコードメトリクス抽出方法をまとめました。

{% linkPreview https://kenzo0107.github.io/2014/06/22/2014-06-22-sonarqube-maxosx _blank %}


今回はCentOS7上に構築する方法を以下にまとめました。

## 環境

- CentOS7 64bit
- Java 1.8
- ec2 t.micro

## JDKインストール

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

### 環境変数 JAVA_HOME 設定

.bash_profileでの設定ではユーザにより環境変数が異なるので
全ユーザ共通で設定する場合は /etc/profile.d/ 以下にshellを用意する。

```sh
# echo "export JAVA_HOME=/usr/local/java/latest
export PATH=$PATH:$JAVA_HOME/bin" > /etc/profile.d/javaenv.sh

# echo "export JAVA_HOME=/usr/local/java/latest
export PATH=$PATH:$JAVA_HOME/bin" > /etc/profile.d/javaenv.csh
```

## MySQLインストール

今回は同一サーバにMySQLインストールしています。
別途MySQLサーバを立てる場合は不要です。

```sh
# yum -y install http://dev.mysql.com/get/mysql-community-release-el6-5.noarch.rpm
# yum -y install mysql-community-server
# chown -R mysql:mysql /var/lib/mysql/*
# systemctl start mysqld
# chkconfig mysqld on

// 以下 DB名: sonar, DB User: sonar, DB Pass: sonar で設定
# mysql -u root

mysql> CREATE DATABASE sonar;
mysql> CREATE USER 'sonar'@'localhost' IDENTIFIED by 'sonar';
mysql> GRANT ALL PRIVILEGES ON sonar.* TO 'sonar'@'localhost';
mysql> FLUSH PRIVILEGES;
```

## SonarQube インストール

以下サイトにてダウンロードzipを取得します。
[SonarQube Donwloads](http://www.sonarqube.org/downloads/)

![Imgur](http://i.imgur.com/etIqshd.png)

※ 2016-05-19 時点 最新は ver 5.5

```sh
# mkdir /usr/local/sonarqube
# cd /usr/local/sonarqube
# wget https://sonarsource.bintray.com/Distribution/sonarqube/sonarqube-5.5.zip
# unzip sonarqube-5.5.zip
# ln -s sonarqube-5.5 sonar
```

### 環境変数 SONAR_HOME 設定

```sh
# echo "setenv SONAR_HOME=/usr/local/sonarqube/sonar
setenv PATH=$PATH:$SONAR_HOME/bin/linux-x86-64" > /etc/profile.d/sonarenv.sh

# echo "setenv SONAR_HOME=/usr/local/sonarqube/sonar
setenv PATH=$PATH:$SONAR_HOME/bin/linux-x86-64" > /etc/profile.d/sonarenv.csh
```

## SonarQubeからMySQLを利用できる様に設定

以下ファイルを編集し作成した DBにアクセスできるように設定します。

- /usr/local/sonarqube/sonar/conf/sonar.properties

```sh
sonar.jdbc.username=sonar # DB User
sonar.jdbc.password=sonar # DB Password
sonar.jdbc.url=jdbc:h2:tcp://localhost:9092/sonar # DB url
```

### SonarQubeが利用するjavaコマンド設定

以下ファイルを編集しSonarQubeが利用するjavaコマンドを
インストールしたJDK内のjavaを指定するように変更

- /usr/local/sonarqube/sonar/conf/wrapper.conf

```sh
#wrapper.java.command=java
wrapper.java.command=/usr/local/java/latest/bin/java
```

## SonarQube起動スクリプト設定

```sh
# ln -s /usr/local/sonarqube/sonar/bin/linux-x86-64/sonar.sh /etc/init.d/sonar
# chkconfig --add sonar
# chkconfig sonar on
```

## サーバ再起動

/etc/profile.d に設定した 環境変数を反映させるべくサーバ再起動します。

```sh
# reboot
```

## アクセスして確認

`http://<IPアドレス>:9000`

SonarQube管理ページが表示されればOKです！

<div style="text-align:center;">
<img src="http://i.imgur.com/ZwZct8A.png" width="100%">
</div>


### 再起動後アクセスできない場合

SonarQubeの設定を見直すか、もしくは、

今回利用している ec2 t2.micro のような小メモリの場合
メモリ不足でMySQLが落ちる可能性があります。

以下参照して対応してください。

{% linkPreview https://kenzo0107.github.io/2016/05/20/2016-05-20-mysql-cannot-allocate-memory-for-the-buffer-pool _blank %}

## あとがき

どんなプロジェクトでもここ修正したい！
と思うことは多々あるかと思います。

その際、なんとなくここ使いづらいから直そう！
という曖昧な判断ではなく

先立ってまず全体としてどういう状態にあるか、
を数値でみて判断する、

というプロセスが踏めるようになることを目的に導入しました。

次回はJenkins からの実行方法をまとめます。
