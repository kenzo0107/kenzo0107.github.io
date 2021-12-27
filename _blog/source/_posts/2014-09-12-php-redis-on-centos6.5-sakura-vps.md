---
layout: post
title: さくらVPS CentOS6.5にRedisを導入しphpで動かすまで
date: 2014-09-12
---

## Redis - ( レディス ) Remote Dictionary Server

Key Value Storeを構築できるツール

## 環境

+ さくらVPS CentOS6.5 Final
+ Redis 2.8.19 (2015/2月時点の最新Stable)
+ PHP 5.4.34

## 手順

+ Redisインストール
+ Redis設定
+ Redisデータ設定・取得テスト
+ chkconfig にRedis登録
+ phpredisインストール
+ php.iniにredis.so追加
+ httpd再起動
+ phpからcallして挙動確認



Redisインストール準備

```
$ sudo su
# yum -y install gcc make
```

Redisインストール
※圧縮ファイルをダウンロード→解凍→コンパイル

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


圧縮ファイルの解凍/ビルド

```
# tar xzvf redis-2.2.12.tar.gz
# cd redis-2.2.12
# make && make install
```



設定ファイルバックアップ

```
# cp -p redis.conf  redis.conf.org
```

redis.conf 編集

```
# vi redis.conf
```

redis.conf変更内容

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



redisサーバ起動

```
# redis-server redis.conf
```

クライアント起動

```
# src/redis-cli
```


redis設定の簡易テスト
データ設定

```
# set tanaka test
```

データ取得

```
# get tanaka
"test"
```



起動スクリプト作成 （init.dに作成）

```console
sudo cp /usr/local/src/redis-2.2.12/utils/redis_init_script /etc/init.d/redis
```

設定ファイルをコピー

```console
$ sudo mkdir /etc/redis
$ sudo cp /usr/local/src/redis-2.2.12/redis.conf /etc/redis/6379.conf
```

設定ファイル編集

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

後々仕様するディレクトリを作成しておく

```console
sudo mkdir /usr/local/redis/
```

起動時に起動する様、chkconfigリストに登録

```console
# /sbin/chkconfig --add redis
# /sbin/chkconfig redis on
```


service redis does not support chkconfig

「#」のすぐ後にスペースが入っていると上記エラーが出力されるので、スペースを削除する。

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

一行目の `# as it does use of the /proc filesystem.` が原因です。
この行を削除しましょう。


上記設定後、再度chkconfigリストに登録設定してください。

※可能であればrebootして起動確認

```console
# reboot
# sudo su -
# cd redis-2.2.12
# src/redis-cli
```

phpredisインストール
//gitでソースを取得

{% gist kenzo0107/f66ce275bf1a2647d8c8 %}


** php.ini編集

```
[redis]
extension=redis.so
```

redisがphpのモジュールとして追加されているか確認

```console
$ php -m | grep redis

redis
```

php.iniの更新を反映する為、apache 再起動
```
service httpd restart
```

以下例文で表示されるか確認

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
