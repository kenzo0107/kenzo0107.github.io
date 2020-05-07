---
layout: post
title: Kibana4 インストール on CentOS7
date: 2015-08-20
tags:
- kibana
---


## 前提
- Nginx インストール済み

## 環境
- CentOS Linux release 7.0.1406 (Core)
- Nginx 1.9.3
- Kibana 4.1.1

## Kibana インストール

```
$ cd /usr/local/src
$ sudo wget https://download.elastic.co/kibana/kibana/kibana-4.1.1-linux-x64.tar.gz
$ sudo tar xvzf kibana-4.1.1-linux-x64.tar.gz
```

## Kibana 設定ファイル修正

```
$ vi /usr/local/src/kibana-4.1.1-linux-x64/config/kibana.yml
```

- host指定

デフォルトでは `0.0.0.0` となっています。
今回は同サーバに構築するので localhost とし保存します。

```
- host: "0.0.0.0"
+ host: "localhost"
```

上記の設定により、kibanaが`localhost`にアクセスできるようになります。



## Kibana 実行パス作成

```
$ sudo mkdir -p /opt/kibana
$ sudo cp -R /usr/local/src/kibana-4.1.1-linux-x64/* /opt/kibana/
```

上記設定により以下コマンドでkibana実行可能になります。

```
/opt/kibana/bin/kibana
```

上記でも十分ですが、再起動した際にはkibanaは停止してしまいます。
なので、起動スクリプトを作成し、サービス登録します。

## 起動スクリプト作成

```
$ sudo vi /etc/systemd/system/kibana4.service
```

- kibana4.service

```
[Service]
ExecStart=/opt/kibana/bin/kibana
Restart=always
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=kibana4
User=root
Group=root
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

上記保存します。


## 起動/サービス登録

```
$ sudo systemctl start kibana4
$ sudo systemctl enable kibana4
```


## Nginx インストール

以下参考にしてください。

{% linkPreview http://kenzo0107.hatenablog.com/entry/2015/08/20/232126 _blank %}



## Nginx設定ファイル修正

リーバスプロキシでKibana4用ポート(5601)へ向ける。

```
$ sudo vi /etc/nginx/conf.d/default.conf
```

```
server {
    listen       80;
    server_name  ec2-xx-xx-xxx-xxx.ap-northeast-1.compute.amazonaws.com;

    auth_basic "Restricted Access";
    auth_basic_user_file /etc/nginx/htpasswd.users;

    location / {
        proxy_pass http://localhost:5601;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

}
```

以上設定保存後、Nginx再起動

```
$ sudo systemctl restart nginx
```


## アクセスして確認

以下のように表示されれば問題ありません。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150820/20150820233520.png" width="100%">
</div>

以上



## 参考記事

[Systemd入門(4) - serviceタイプUnitの設定ファイル](https://enakai00.hatenablog.com/entry/20130917/1379374797)

#### 起動スクリプトについて 各項目説明

##### [Unit] について
| *オプション*  | *説明*                           |
| :------------ | :------------------------------- |
| Description   | Unitの説明文                     |
| Documentation | ドキュメントのURI                |
| Requires      | このUnitが必要とする前提Unit     |
| Wants         | このUnitが必要とする前提Unit     |
| After         | このUnitより先に起動するべきUnit |
| Before        | このUnitより後に起動するべきUnit |


##### [Install] について
| *オプション* | *説明*                                                |
| :----------- | :---------------------------------------------------- |
| WantedBy     | enable時にこのUnitの.wantsディレクトリにリンク作成    |
| RequiredBy   | enable時にこのUnitの.requiredディレクトリにリンク作成 |
| Also         | enable/disable時に同時にenable/disableするUnit        |
| Alias        | enable時にこのUnitの別名を用意                        |







↓この本とってもお世話になりました♪

{% linkPreview https://www.amazon.co.jp/exec/obidos/ASIN/4774169838/kenzo0107-22/ _blank %}
