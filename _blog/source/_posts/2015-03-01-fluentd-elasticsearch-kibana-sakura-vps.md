---
layout: post
title: さくらVPS fluentd + elasticsearch + kibana3
date: 2015-03-01
cover: http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140927/20140927215057.png
---

## ElasticSearch インストール

公式サイト: http://www.elasticsearch.org/blog/apt-and-yum-repositories/

### yum リポジトリ追加

```
rpm --import http://packages.elasticsearch.org/GPG-KEY-elasticsearch
```

### elasticsearch リポジトリ設定ファイル追加

```
cat >> /etc/yum.repos.d/elasticsearch.repo <<'EOF'
[elasticsearch-1.0]
name=Elasticsearch repository for 1.0.x packages
baseurl=http://packages.elasticsearch.org/elasticsearch/1.0/centos
gpgcheck=1
gpgkey=http://packages.elasticsearch.org/GPG-KEY-elasticsearch
enabled=1
EOF
```

### java と elasticsearch インストール

```
yum install elasticsearch java-1.7.0-openjdk
```

### サーバ起動時モジュール自動起動設定

```
chkconfig elasticsearch on
```

### elasticsearch 起動

```
service elasticsearch start
```

### 動作テスト

```console
curl -X GET http://localhost:9200/

// response
{
  "status" : 200,
  "name" : "Hydron",
  "version" : {
    "number" : "1.0.3",
    "build_hash" : "61bfb72d845a59a58cd9910e47515665f6478a5c",
    "build_timestamp" : "2014-04-16T14:43:11Z",
    "build_snapshot" : false,
    "lucene_version" : "4.6"
  },
  "tagline" : "You Know, for Search"
}
```

---

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140927/20140927215745.jpg)

## Kibana インストール

### kibana ユーザ追加

```
useradd kibana
```

### パスワード設定

```
passwd kibana
ユーザー kibana のパスワードを変更。
新しいパスワード: [パスワード入力]
よくないパスワード: 辞書の単語に基づいています
新しいパスワードを再入力してください: [もう一度パスワード入力]
passwd: 全ての認証トークンが正しく更新できました。
```

### kibana のパーミッション設定

```
chmod +x /home/kibana
```

### kibana

```
su - kibana
```

### kibana3 ダウンロード

```
curl -LO https://download.elasticsearch.org/kibana/kibana/kibana-3.0.0milestone5.tar.gz
```

### モジュール解凍

```
tar zxvf kibana-3.0.0milestone5.tar.gz
```

### シンボリックリンク設定

```
ln -s /home/kibana/kibana-3.0.0milestone5 ./kibana
```

### kibana config 編集

- /home/kibana/kibana/config.js

```
// 以下のように設定
elasticsearch: "http://(ドメイン)/es/",
```

### kibana ユーザ解除

```
exit
```

### Elasticsearch への接続用に/es/をリバースプロキシ構成

```
htdigest -c /etc/httpd/conf/htdigest "Required authentication" (Basic認証の設定したいID)
Adding password for okochang in realm Required authentication.
New password: [パスワード入力] (Basic認証の設定したいPW)
Re-type new password: [パスワード入力] (Basic認証の設定したいPW)
```

vim /etc/httpd/conf.d/vhosts.conf

### 設定ファイルのシンタックスチェック

```
httpd -t
```

▼ 実行結果

```
Syntax OK
```

### httpd 再起動

```
service httpd restart
```

### kibana 管理画面

```
http://(ドメイン)/#/dashboard/file/default.json
```

以下のように表示されたら成功

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140927/20140927222357.png)

---

- fluent-plugin-elasticsearch

### gcc, gcc-c インストール

```
yum install gcc gcc-c++ libcurl-devel
```

### fluent-plugin-elasticsearch インストール

```
/usr/lib64/fluent/ruby/bin/fluent-gem install fluent-plugin-elasticsearch --no-ri --no-rdoc
```

```
vim /etc/td-agent/td-agent.conf
```

```
## Input
<source>
  type tail
  path /var/log/httpd/access_log
  format /^(?<date>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \w{3}) (?<processing_time>[^ ]*) (?<remote>[^ ]*) (?<user>[^ ]*) \[(?<method>.*)\] (?<status>[^ ]*) (?<size>[^ ]*) \[(?<referer>[^ ]*)\] \[(?<agent>.*)\]/
  pos_file /var/log/td-agent/tmp/apache.access.log.pos
  tag apache.access
</source>

## Output
<match apache.access>
  type copy
  <store>
    type file
    path /var/log/td-agent/apache.access
    time_slice_format %Y%m%d
    time_format %Y%m%dT%H%M%S%z
  </store>
  <store>
    type forward
    send_timeout 60s
    recover_wait 10s
    heartbeat_interval 1s
    <server>
      name (fluentdサーバ)
      host (fluentdサーバIP)
      port (Port)
    </server>
  </store>
  <store>
    type elasticsearch
    host (elasticsearchサーバIP)
    port (Port)
    type_name access_log
    logstash_format true
    logstash_prefix apache_access
    logstash_dateformat %Y%m
    flush_interval 10s
  </store>
</match>
```

<hr>

## fluentd インストール事前準備

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140927/20140927210105.jpg)

- ユーザ毎のリソース制限ファイル修正

* /etc/security/limits.conf

以下追記

```
root soft nofile 65536
root hard nofile 65536
```

▼ リソース属性

<table>
<tr><td>noproc</td><td>最大プロセス数</td></tr>
<tr><td>nofile</td><td>オープンできる最大ファイル数</td></tr>
<tr><td>maxlogin</td><td>最大ログイン数</td></tr>
<tr><td>data</td><td>最大データサイズ</td></tr>
<tr><td>fsize</td><td>最大ファイルサイズ</td></tr>
<tr><td>as</td><td>最大メモリ空間サイズ</td></tr>
<tr><td>priority</td><td>ユーザ実行の優先度</td></tr>
<tr><td>stack</td><td>ユーザ実行の最大スタック</td></tr>
<tr><td>rss</td><td>ユーザ実行プロセスのメモリサイズ</td></tr>
<tr><td>core</td><td>コアファイルの最大値</td></tr>
</table>

### カーネルパラメータ設定

- /etc/sysctl.conf

```
// 以下追記
net.ipv4.tcp_tw_recycle = 1
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 10240    65535
```

### 再起動

```
reboot
```

## Apatch 設定

### テスト用のログファイルとして Apache のアクセスログを使用

```
grep "custom" /etc/httpd/conf/httpd.conf
```

▼ 実行結果

```
LogFormat "%{%Y-%m-%d %T %Z}t %D %a %u [%r] %s %b [%{Referer}i] [%{User-Agent}i]" custom
CustomLog logs/access_log custom
```

### td-agent にアクセス出来る様にログディレクトリ権限修正

```
chmod 755 /var/log/httpd
```

<hr>

## td-agent のインストール

```
curl -L http://toolbelt.treasuredata.com/sh/install-redhat.sh | sh
```

### td-agent 設定

- /etc/td-agent/td-agent.conf

```
<match log.**>
  # fluentd-plugin-elasticsearch利用
  type elasticsearch

  # Kibanaで利用するためにindexの形式整備
  logstash_format true

  # index の prefix 指定
  logstash_prefix demo-log

  # 転送先の Elasticsearch
  hosts localhost:9200

  # Elasticsearchに書き込む際、ドキュメントtype指定
  type_name application-log

  # buffer設定 - メモリバッファ利用
  buffer_type memory

  # チャンクサイズ 1MB
  buffer_chunk_limit 1m

  # チャンクキュー最大サイズ 128
  buffer_queue_limit 128

  # 指定秒毎にバッファをflush - 指定秒数毎にElasticsearchへの書き込みリクエスト発
行
  flush_interval 2s

  # flush失敗時、最大リトライ回数
  retry_limit 17
</match>
```

```
// tmpディレクトリ作成
mkdir /var/log/td-agent/tmp
// 所有者修正
chown td-agent.td-agent /var/log/td-agent/tmp
// サーバ起動時設定
chkconfig td-agent on
// 起動
service td-agent start
```

## 参考サイト

- http://okochang.hatenablog.jp/entry/2014/03/17/223805
- http://fluentular.herokuapp.com/
- http://okochang.hatenablog.jp/entry/2014/03/21/191523
