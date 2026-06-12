---
layout: post
title: Sakura VPS fluentd + elasticsearch + kibana3
date: 2015-03-01
lang: en
translation_id: fluentd-elasticsearch-kibana-sakura-vps
permalink: en/2015/03/01/fluentd-elasticsearch-kibana-sakura-vps/
cover: http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140927/20140927215057.png
---

## Installing ElasticSearch

Official site: http://www.elasticsearch.org/blog/apt-and-yum-repositories/

### Add the yum repository

```
rpm --import http://packages.elasticsearch.org/GPG-KEY-elasticsearch
```

### Add the elasticsearch repository configuration file

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

### Install java and elasticsearch

```
yum install elasticsearch java-1.7.0-openjdk
```

### Configure the module to start automatically on server boot

```
chkconfig elasticsearch on
```

### Start elasticsearch

```
service elasticsearch start
```

### Operation test

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

## Installing Kibana

### Add the kibana user

```
useradd kibana
```

### Set the password

```
passwd kibana
Changing password for user kibana.
New password: [enter password]
BAD PASSWORD: it is based on a dictionary word
Retype new password: [enter password again]
passwd: all authentication tokens updated successfully.
```

### Set permissions for kibana

```
chmod +x /home/kibana
```

### kibana

```
su - kibana
```

### Download kibana3

```
curl -LO https://download.elasticsearch.org/kibana/kibana/kibana-3.0.0milestone5.tar.gz
```

### Extract the module

```
tar zxvf kibana-3.0.0milestone5.tar.gz
```

### Set up the symbolic link

```
ln -s /home/kibana/kibana-3.0.0milestone5 ./kibana
```

### Edit the kibana config

- /home/kibana/kibana/config.js

```
// Configure as follows
elasticsearch: "http://(domain)/es/",
```

### Leave the kibana user

```
exit
```

### Configure /es/ as a reverse proxy for connecting to Elasticsearch

```
htdigest -c /etc/httpd/conf/htdigest "Required authentication" (the ID you want to set for Basic authentication)
Adding password for okochang in realm Required authentication.
New password: [enter password] (the password you want to set for Basic authentication)
Re-type new password: [enter password] (the password you want to set for Basic authentication)
```

vim /etc/httpd/conf.d/vhosts.conf

### Syntax-check the configuration file

```
httpd -t
```

▼ Result

```
Syntax OK
```

### Restart httpd

```
service httpd restart
```

### kibana admin screen

```
http://(domain)/#/dashboard/file/default.json
```

If it displays as shown below, you have succeeded.

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140927/20140927222357.png)

---

- fluent-plugin-elasticsearch

### Install gcc, gcc-c++

```
yum install gcc gcc-c++ libcurl-devel
```

### Install fluent-plugin-elasticsearch

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
      name (fluentd server)
      host (fluentd server IP)
      port (Port)
    </server>
  </store>
  <store>
    type elasticsearch
    host (elasticsearch server IP)
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

## Preparation before installing fluentd

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140927/20140927210105.jpg)

- Edit the per-user resource limit file

* /etc/security/limits.conf

Append the following

```
root soft nofile 65536
root hard nofile 65536
```

▼ Resource attributes

<table>
<tr><td>noproc</td><td>Maximum number of processes</td></tr>
<tr><td>nofile</td><td>Maximum number of files that can be opened</td></tr>
<tr><td>maxlogin</td><td>Maximum number of logins</td></tr>
<tr><td>data</td><td>Maximum data size</td></tr>
<tr><td>fsize</td><td>Maximum file size</td></tr>
<tr><td>as</td><td>Maximum memory address space size</td></tr>
<tr><td>priority</td><td>Priority of the user's processes</td></tr>
<tr><td>stack</td><td>Maximum stack of the user's processes</td></tr>
<tr><td>rss</td><td>Memory size of the user's processes</td></tr>
<tr><td>core</td><td>Maximum core file size</td></tr>
</table>

### Configure kernel parameters

- /etc/sysctl.conf

```
// Append the following
net.ipv4.tcp_tw_recycle = 1
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 10240    65535
```

### Reboot

```
reboot
```

## Apache configuration

### Use Apache's access log as the test log file

```
grep "custom" /etc/httpd/conf/httpd.conf
```

▼ Result

```
LogFormat "%{%Y-%m-%d %T %Z}t %D %a %u [%r] %s %b [%{Referer}i] [%{User-Agent}i]" custom
CustomLog logs/access_log custom
```

### Fix the log directory permissions so td-agent can access them

```
chmod 755 /var/log/httpd
```

<hr>

## Installing td-agent

```
curl -L http://toolbelt.treasuredata.com/sh/install-redhat.sh | sh
```

### td-agent configuration

- /etc/td-agent/td-agent.conf

```
<match log.**>
  # Use fluentd-plugin-elasticsearch
  type elasticsearch

  # Format the index for use with Kibana
  logstash_format true

  # Specify the index prefix
  logstash_prefix demo-log

  # Destination Elasticsearch
  hosts localhost:9200

  # Specify the document type when writing to Elasticsearch
  type_name application-log

  # buffer settings - use a memory buffer
  buffer_type memory

  # Chunk size 1MB
  buffer_chunk_limit 1m

  # Maximum chunk queue size 128
  buffer_queue_limit 128

  # Flush the buffer every specified number of seconds - issues a write request to Elasticsearch every specified number of seconds
  flush_interval 2s

  # Maximum number of retries when a flush fails
  retry_limit 17
</match>
```

```
// Create the tmp directory
mkdir /var/log/td-agent/tmp
// Fix the owner
chown td-agent.td-agent /var/log/td-agent/tmp
// Configure startup at server boot
chkconfig td-agent on
// Start
service td-agent start
```

## References

- http://okochang.hatenablog.jp/entry/2014/03/17/223805
- http://fluentular.herokuapp.com/
- http://okochang.hatenablog.jp/entry/2014/03/21/191523
