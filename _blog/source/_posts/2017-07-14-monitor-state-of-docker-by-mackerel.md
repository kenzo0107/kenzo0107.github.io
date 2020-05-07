---
layout: post
title: Mackerel で Docker の起動状態確認
date: 2017-07-14
tags:
- Docker
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170714/20170714223239.png
---

## 概要

Docker コンテナがいつの間にか Exit していた！
なんてことを防ぐ為の Mackerel Agent の設定です。

## mackerel-plugin-docker-state インストール

```sh
$ sudo mkdir -p /etc/mackerel-agent/conf.d
$ sudo curl https://raw.githubusercontent.com/ABCanG/mackerel-plugin-docker-state/master/mackerel-plugin-docker-state -o /etc/mackerel-agent/conf.d/mackerel-plugin-docker-state
$ sudo chmod +x /etc/mackerel-agent/conf.d/mackerel-plugin-docker-state
$ sudo cat <<'EOF'>/etc/mackerel-agent/conf.d/docker-state.conf
[plugin.metrics.docker-state]
command = "/etc/mackerel-agent/conf.d/mackerel-plugin-docker-state"
EOF
```


## mackerel-agent.conf に include 設定追加

- /etc/mackerel-agent/mackerel-agent.conf

```sh
pidfile = "/var/run/mackerel-agent.pid"
root = "/var/lib/mackerel-agent"
verbose = false
apikey = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
diagnostic = true

roles = ["xxxxxxxx:xxx"]

# include conf.d/*.conf
include = "/etc/mackerel-agent/conf.d/*.conf"

...
...
```

## Mackrel Agent 再起動

```sh
$ sudo service mackerel-agent restart
```

## グラフ確認

しばらくするとグラフが表示されます。
※0 or 1 のみのグラフなので積み重ねグラフの方が見やすかったです

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170714/20170714222015.png" width="100%">
</div>

※上記グラフではコンテナ2つが起動しています。

## 新規監視ルールを作成

running で検索すると出てきます。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170714/20170714223652.png" width="100%">
</div>

3分間の平均が1 より低くなったら
コンテナが停止(Exit)と見なし通知する様にしました。


## 総評

今回たまたま Mackerel の入ったサービスを触る機会を頂きました。

Mackerel の様なマネージドサービスを利用するメリットは
監視サーバを監視しないで良い、
という省運用コストだなぁと改めて実感。
