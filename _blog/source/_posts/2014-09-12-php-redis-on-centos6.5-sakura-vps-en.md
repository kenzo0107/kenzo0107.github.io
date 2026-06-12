---
layout: post
title: Installing Redis on Sakura VPS CentOS 6.5 and Running It from PHP
date: 2014-09-12
lang: en
translation_id: php-redis-on-centos6.5-sakura-vps
permalink: en/2014/09/12/php-redis-on-centos6.5-sakura-vps/
cover: /img/cover/2014-09-12-php-redis-on-centos6.5-sakura-vps.svg
---

## Redis - (pronounced "Redis") Remote Dictionary Server

A tool that lets you build a Key Value Store.

## Environment

+ Sakura VPS CentOS 6.5 Final
+ Redis 2.8.19 (latest Stable as of February 2015)
+ PHP 5.4.34

## Steps

+ Install Redis
+ Configure Redis
+ Test setting and retrieving Redis data
+ Register Redis with chkconfig
+ Install phpredis
+ Add redis.so to php.ini
+ Restart httpd
+ Call from PHP and verify behavior



Prepare for the Redis installation

```
$ sudo su
# yum -y install gcc make
```

Install Redis
* Download the compressed archive → extract → compile

```
# cd /usr/local/src
# wget http://redis.googlecode.com/files/redis-2.2.12.tar.gz

--2014-09-12 14:59:10--  http://redis.googlecode.com/files/redis-2.2.12.tar.gz
redis.googlecode.com をDNSに問いあわせています... 74.125.204.82, 2404:6800:4008:c04::52
redis.googlecode.com|74.125.204.82|:80 に接続しています... 接続しました。
HTTP による接続要求を送信しました、応答を待っています... 200 OK
長さ: 455240 (445K) [application/x-gzip]
`redis-2.2.12.tar.gz' に保存中

100%[==================================================================>] 455,240      555K/s 時間 0.8s
2014-09-12 14:59:12 (555 KB/s) - `redis-2.2.12.tar.gz' へ保存完了 [455240/455240]
```


Extract and build the archive

```
# tar xzvf redis-2.2.12.tar.gz
# cd redis-2.2.12
# make && make install
```



Back up the config file

```
# cp -p redis.conf  redis.conf.org
```

Edit redis.conf

```
# vi redis.conf
```

Changes to redis.conf

```
# daemon
#daemonize no
daemonize yes

# logfile
#logfile stdout
logfile /var/log/redis.log

#loglevel
#loglevel verbose
loglevel notice
```



Start the Redis server

```
# redis-server redis.conf
```

Start the client

```
# src/redis-cli
```


Quick test of the Redis configuration
Set data

```
# set tanaka test
```

Retrieve data

```
# get tanaka
"test"
```



Create a startup script (under init.d)

```console
sudo cp /usr/local/src/redis-2.2.12/utils/redis_init_script /etc/init.d/redis
```

Copy the config file

```console
$ sudo mkdir /etc/redis
$ sudo cp /usr/local/src/redis-2.2.12/redis.conf /etc/redis/6379.conf
```

Edit the config file

```console
$ sudo vim /etc/redis/6379.conf
```

```
#daemonize no   デーモン化の設定を有効化。
daemonize yes

# pidfile /var/run/redis.pid   起動シェルの設定にあわせる。
pidfile /var/run/redis_6379.pid

# logfile stdout   ログファイル出力を、標準出力からファイルに変更
logfile /var/log/redis.log

# dir ./   working directoryにdumpファイルが生成されるらしいので、変更します。
dir /usr/local/redis/
```

Create the directory that will be used later

```console
sudo mkdir /usr/local/redis/
```

Register it in the chkconfig list so it starts at boot

```console
# /sbin/chkconfig --add redis
# /sbin/chkconfig redis on
```


service redis does not support chkconfig

The error above is printed when there is a space immediately after the `#`, so remove that space.

```console
$ cat /etc/init.d/redis

# as it does use of the /proc filesystem.

REDISPORT=6379
EXEC=/usr/local/bin/redis-server
CLIEXEC=/usr/local/bin/redis-cli

PIDFILE=/var/run/redis_${REDISPORT}.pid
CONF="/etc/redis/${REDISPORT}.conf"

...
...
```

The first line, `# as it does use of the /proc filesystem.`, is the cause.
Delete this line.


After making the change above, register it in the chkconfig list once more.

* If possible, reboot and verify that it starts.

```console
# reboot
# sudo su -
# cd redis-2.2.12
# src/redis-cli
```

Install phpredis
// Fetch the source with git

{% gist kenzo0107/f66ce275bf1a2647d8c8 %}


** Edit php.ini

```
[redis]
extension=redis.so
```

Check that redis has been added as a PHP module

```console
$ php -m | grep redis

redis
```

Restart apache to apply the php.ini update
```
service httpd restart
```

Verify that the following example displays correctly

```
<?php
$redis = new Redis();

$redis->connect("127.0.0.1",6379);
$tmp = "redis (^-^)";
$redis->set("test_key",$tmp);
$res = $redis->get("test_key");

var_dump($res);
?>
```
