---
layout: post
title: Raspberry PI3 Model B に docker-compose で Nginx で認証かけて Prometheus + Node Exporter + Grafana + cAdvisor構築
date: 2017-05-01
tags:
- RaspberryPI
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170430/20170430235153.png
---

## 概要

Raspi3に docker-compose で Prometheus による監視機構を作成しました。

{% linkPreview https://github.com/kenzo0107/vagrant-docker/tree/master/docker/prometheus-grafana-on-raspi3 _blank %}

## 環境

- Raspberry Pi 3 Model B (Raspbian GNU/Linux 8) arm7l
- Docker version 17.04.0-ce, build 4845c56
- docker-compose version 1.9.0, build 2585387

## Raspi に docker インストール

```
raspi%$ wget -qO- https://get.docker.com/ | sh
raspi%$ sudo usermod -aG docker pi
raspi%$ sudo gpasswd -a $USER docker
```

## Raspi に docker-compose インストール

```
raspi%$ sudo apt-get update
raspi%$ sudo apt-get install -y apt-transport-https
raspi%$ echo "deb https://packagecloud.io/Hypriot/Schatzkiste/debian/ jessie main" | raspi%sudo tee /etc/apt/sources.list.d/hypriot.list
raspi%$ sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 37BBEE3F7AD95B3F
raspi%$ sudo apt-get update
raspi%$ sudo apt-get install docker-compose
```

- version 確認

```
raspi%$ docker-compose --version
docker-compose version 1.9.0, build 2585387
```

## docker-compose のプロジェクト設定

```
raspi%$ cd ~
raspi%$ git clone https://github.com/kenzo0107/vagrant-docker
raspi%$ cd vagrant-docker/docker/prometheus-grafana-on-raspi3
```

## Nginx Basic 認証設定

```
.htpasswd 作成時のユーザ/パス == GF_SECURITY_ADMIN_USER/GF_SECURITY_ADMIN_PASSWORD
```
である必要があります。

Grafana の認証機能により設定した Basic 認証でログインできる仕組みがあり、
一致しない場合、ログインできず、失敗します。

- grafana/env
```
GF_SECURITY_ADMIN_USER=admin-user
GF_SECURITY_ADMIN_PASSWORD=admin-pass
```

- .htpasswd

```
raspi%$ htpasswd -c nginx/conf/conf.d/.htpasswd admin-user
New password: (「admin-pass」と入力しEnter)
Re-type new password: (「admin-pass」と入力しEnter)
Adding password for user admin-user

raspi%$ cat nginx/conf/conf.d/.htpasswd
admin-user:$apr1$JLxC83lt$uO7aEn9Z59fZtba4EA7C6/
```

## Cron設定

Raspi の温度や電圧を定期取得し Prometheus に読み込ませるファイル(*.prom)作成します。

```
*/5 * * * * <home/to/path>/vagrant-docker/docker/prometheus-grafana-on-raspi3/node-exporter/collector/raspi.sh
```

## docker-compose により Docker 起動

```
raspi%$ docker-compose up -d
```

## Grafana にアクセスしてみる

`http://<your_server_ip>:13000` にアクセスすると .htpasswd で指定したユーザ/パスを求められるので入力します

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170430/20170430235949.png" width="100%">
</div>

その後、Grafana のページが表示されれば成功です。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170501/20170501002430.png" width="100%">
</div>

「Add data Source」をクリックします。

## Data Source 設定

以下の様に設定し「Save & Test」をクリックししSuccessすることを確認します。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170501/20170501002606.png" width="100%">
</div>


## Dashboard.json インポート

左上のアイコンから Dashboards > Import 選択し DockerDashboard.json をインポートします。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170501/20170501003915.png" width="100%">
</div>

## Dashboard 表示

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170501/20170501003051.png" width="100%">
</div>


## ポイント !

### セキュリティ上の観点から外から直接 Grafana を参照させない様にしました。

nginx/conf/conf.d/default.conf
```
server {
    listen       80;

    location / {
        auth_basic "Restricted";
        auth_basic_user_file /etc/nginx/conf.d/.htpasswd;

        proxy_pass                          http://grafana:3000/;
    }
}
```


### image 選びは慎重に。

以下の点で非常にハマりました。

1. Raspberry Pi3 Model B (今回はarm7l)上で動作するか
2. Nginx で Proxy 機能が正しく動作するか

nginx のproxy機能で grafana に繋げても 以下の様に表示されてしまうケースにぶつかりまくりました。

```
{{alert.title}}
```

## 総評

イメージ探しについ時間取ってしまいましたが
自作した方が早かったかもと反省。

今回は自身を監視するという仕組みにしましたが外部から監視し相互に監視し合う体制が必要です。
家庭内稟議が通ればもう一台getしよう！

そして、家庭の為になるものを作ろう！
