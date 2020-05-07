---
layout: post
title: CentOS7 に Nginx インストール
date: 2015-08-20
tags:
- nginx
---

Kibana構築用に書いときました。

## 環境
- CentOS7

## Nginxインストール

- Nginx用リポジトリ作成

```
# vim /etc/yum.repos.d/nginx.repo
```

- 以下追記

```
[nginx]
name=nginx repo
baseurl=http://nginx.org/packages/mainline/centos/7/$basearch/
gpgcheck=0
enabled=1
```

#### Nginx モジュールインストール

```
$ sudo yum install --enablerepo=nginx nginx
```

##### サービス登録

サーバ起動時・再起動時にNginxが起動するようにします。

```
$ sudo systemctl disable httpd
$ sudo systemctl enable nginx
$ sudo systemctl start nginx
$ systemctl status nginx

nginx.service - nginx - high performance web server
   Loaded: loaded (/usr/lib/systemd/system/nginx.service; enabled)
   Active: active (running) since Mon 2015-08-03 06:07:44 UTC; 2s ago
     Docs: http://nginx.org/en/docs/
  Process: 12642 ExecStart=/usr/sbin/nginx -c /etc/nginx/nginx.conf (code=exited, status=0/SUCCESS)
  Process: 12641 ExecStartPre=/usr/sbin/nginx -t -c /etc/nginx/nginx.conf (code=exited, status=0/SUCCESS)
 Main PID: 12645 (nginx)
   CGroup: /system.slice/nginx.service
           ├─12645 nginx: master process /usr/sbin/nginx -c /etc/nginx/nginx....
           └─12646 nginx: worker process

Aug 03 06:07:44 ip-172-31-19-253 systemd[1]: Starting nginx - high performan....
Aug 03 06:07:44 ip-172-31-19-253 nginx[12641]: nginx: the configuration file...k
Aug 03 06:07:44 ip-172-31-19-253 nginx[12641]: nginx: configuration file /et...l
Aug 03 06:07:44 ip-172-31-19-253 systemd[1]: Failed to read PID from file /r...t
Aug 03 06:07:44 ip-172-31-19-253 systemd[1]: Started nginx - high performanc....
Hint: Some lines were ellipsized, use -l to show in full.
```

## アクセス確認

http://<IPアドレス or ドメイン>

以下のように表示されればOK

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150820/20150820232103.png" width="100%">
</div>

以上です。
