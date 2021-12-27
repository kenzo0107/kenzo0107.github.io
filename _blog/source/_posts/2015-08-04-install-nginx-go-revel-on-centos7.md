---
layout: post
title: CentOS7 に Nginx + Go + Revel インストール・動作確認
date: 2015-08-04
---

## 環境

- EC2 t2.micro
- CentOS Linux release 7.1.1503 (Core)
- Go version go1.4.2 linux/amd64



以下手順です。

## 事前準備

#### EC2 インスタンスへSSHログイン

```
$ ssh -i aws.pem centos@xxx.xxx.xxx.xx
```

#### root権限へ変更

```
$ sudo su -
```

#### yumパッケージ インストール

```
# yum update
# yum install -y vim wget '*mercurial*' tree
```

#### 最新のGitインストール

Git が1.8以前の場合 `go get` が正しく動作しない事象が確認されている為、Gitを最新バージョンにします。

※ 2015-08-03 時点 git version 2.5.0

https://kenzo0107.github.io/2016/02/22/2016-02-23-install-latest-git-on-centos/


## Goインストール

#### インストール

```
# cd /usr/local/src
# wget https://golang.org/dl/go1.4.2.linux-amd64.tar.gz
# tar -C /usr/local/ -xzf go1.4.2.linux-amd64.tar.gz
```

#### Go用 WorkSpace 作成

- このディレクトリでソースを管理します。
- `go get` や `go install`した際はこのディレクトリに追加されます。

```
# mkdir -p /var/golang
```

#### rootユーザにてGo実行パス設定

- /root/.bashrc に以下追記

```
export GOROOT=/usr/local/go
export GOBIN=$GOROOT/bin
export GOPATH=/var/golang

export PATH=$PATH:$GOBIN
```

- 設定反映

```
# source /root/.bashrc
```

- 反映されたか確認

```
# which go
/usr/local/go/bin/go

# go version
go version go1.4.2 linux/amd64
```

上記のようにコマンドを実行し表示されれば問題ありません。


#### centosユーザにも同様にGo実行パス設定

```
# su - centos
```

- /home/centos/.bashrc も同様に追記


```
export GOROOT=/usr/local/go
export GOBIN=$GOROOT/bin
export GOPATH=/var/golang

export PATH=$PATH:$GOBIN
```

- 設定反映

```
$ source /home/centos/.bashrc
```

- 反映されたか確認

```
$ which go
/usr/local/go/bin/go

$ go version
go version go1.4.2 linux/amd64
```

上記のようにコマンドを実行し表示されれば問題ありません。


## Revel インストール

Revelフレームワーク と Revelコマンド を `go get` でインストールします。

```
$ go get github.com/revel/revel
$ go get github.com/revel/cmd/revel
```

## Nginxインストール

- Nginx用リポジトリ作成

```
# vim /etc/yum.repo.d/nginx.repo
```

- 以下追記

```
[nginx]
name=nginx repo
baseurl=http://nginx.org/packages/rhel/$releasever/$basearch/
gpgcheck=0
enabled=1
```

#### Nginx モジュールインストール

```
# yum install -y nginx
```

##### 起動時設定

サーバ起動時・再起動時にNginxが立ち上がるようにします。

```
# systemctl disable httpd
# systemctl enable nginx
# systemctl start nginx
# systemctl status nginx

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

#### Nginx 設定ファイル修正

```
# vim /etc/nginx/conf.d/default.conf
```

```
server {
    listen       80;
    server_name  ec2-xx-xx-xx-xxx.ap-northeast-1.compute.amazonaws.com;

    location / {
        proxy_pass      http://127.0.0.1:9000;
    }
```

## Revel でアプリケーション作成・実行

- 「myapp」というプロジェクトを revelコマンドで作成

```
# revel new myapp
```

- 実行

```
# revel run myapp
```

- 実行結果

※セキュリティグループでhttpでアクセスできるように設定してください。

![](http://i.imgur.com/GSsmnDt.png)
