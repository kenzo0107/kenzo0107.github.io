---
layout: post
title: Installing Kibana 4 on CentOS 7
date: 2015-08-20
lang: en
translation_id: install-kibana-on-centos7
permalink: en/2015/08/20/install-kibana-on-centos7/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150820/20150820233520.png
tags:
- Kibana
---


## Prerequisites
- Nginx already installed

## Environment
- CentOS Linux release 7.0.1406 (Core)
- Nginx 1.9.3
- Kibana 4.1.1

## Installing Kibana

```
$ cd /usr/local/src
$ sudo wget https://download.elastic.co/kibana/kibana/kibana-4.1.1-linux-x64.tar.gz
$ sudo tar xvzf kibana-4.1.1-linux-x64.tar.gz
```

## Editing the Kibana Configuration File

```
$ vi /usr/local/src/kibana-4.1.1-linux-x64/config/kibana.yml
```

- Specifying the host

By default it is set to `0.0.0.0`.
This time we build it on the same server, so we set it to localhost and save.

```
- host: "0.0.0.0"
+ host: "localhost"
```

With this setting, Kibana becomes accessible at `localhost`.



## Creating the Kibana Runtime Path

```
$ sudo mkdir -p /opt/kibana
$ sudo cp -R /usr/local/src/kibana-4.1.1-linux-x64/* /opt/kibana/
```

With the above setup, you can run Kibana with the following command.

```
/opt/kibana/bin/kibana
```

The above is good enough, but Kibana stops when the machine is rebooted.
So we create a startup script and register it as a service.

## Creating the Startup Script

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

Save the above.


## Starting / Registering the Service

```
$ sudo systemctl start kibana4
$ sudo systemctl enable kibana4
```


## Installing Nginx

Please refer to the following.

{% linkPreview http://kenzo0107.hatenablog.com/entry/2015/08/20/232126 _blank %}



## Editing the Nginx Configuration File

Use a reverse proxy to forward to the Kibana 4 port (5601).

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

After saving the configuration above, restart Nginx.

```
$ sudo systemctl restart nginx
```


## Accessing and Verifying

If it displays as shown below, everything is working fine.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150820/20150820233520.png" width="100%">
</div>

That's all.



## Reference Articles

[Introduction to Systemd (4) - Configuration files for service-type Units](https://enakai00.hatenablog.com/entry/20130917/1379374797)

#### About the Startup Script - Explanation of Each Item

##### About [Unit]
| *Option*      | *Description*                          |
| :------------ | :------------------------------------- |
| Description   | Description text of the Unit           |
| Documentation | URI of the documentation               |
| Requires      | Prerequisite Units this Unit needs     |
| Wants         | Prerequisite Units this Unit needs     |
| After         | Units that should start before this Unit |
| Before        | Units that should start after this Unit  |


##### About [Install]
| *Option*   | *Description*                                                       |
| :--------- | :------------------------------------------------------------------ |
| WantedBy   | On enable, creates a link in this Unit's .wants directory           |
| RequiredBy | On enable, creates a link in this Unit's .required directory        |
| Also       | Units to enable/disable simultaneously on enable/disable            |
| Alias      | On enable, provides an alias for this Unit                          |






↓ This book was a huge help to me ♪

{% linkPreview https://www.amazon.co.jp/exec/obidos/ASIN/4774169838/kenzo0107-22/ _blank %}
