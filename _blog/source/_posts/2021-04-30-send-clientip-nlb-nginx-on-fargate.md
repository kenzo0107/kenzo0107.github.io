---
title: NLB+Fargate でクライアントIP を Fargate に送り届ける
tags:
- AWS
date: 2021-04-30
thumbnail: https://i.imgur.com/4xB6wVP.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

NLB 配下の TargetGroup では、アクセス元のクライアントIP　を変更することなく、Target に渡すことができる機能があります。

上記を利用した IP 制御の実装が可能です。

ですが、NLB + Fargate の構成の場合、Fargate に渡る IP が NLB のプライベート IP になっていることを確認しました。

（EC2 の場合は問題なくクライアントIPが渡っていた）

Nginx で以下の様な設定はしているけど... Why ??
```
    set_real_ip_from  10.10.0.0/16;
    real_ip_header    X-Forwarded-For;
    real_ip_recursive on;
```

## 原因

https://docs.aws.amazon.com/elasticloadbalancing/latest/network/load-balancer-target-groups.html#client-ip-preservation

> If the target group protocol is TCP or TLS, client IP preservation is disabled by default.

NLB は Target Group のプロトコルが TCP or TLS の場合、 クライアント IP はデフォルトで無効化される仕様でした。

上記を補足すると
Fargate は TargetGroup でターゲットタイプ = IP を指定する為、デフォルトでクライアントIPは保持されない、
となります。

EC2 は TargetGroup でインスタンスIDを指定しており、その場合、クライアントIPの保持は有効化されます。

## 対策

以下 AWS ドキュメントにある通り、 proxy protocol v2 を有効化します。

https://docs.aws.amazon.com/elasticloadbalancing/latest/network/load-balancer-target-groups.html#proxy-protocol

### TargetGroup の設定

```
resource "aws_lb_target_group" "app_https" {
  ...
  target_type       = "ip"
  proxy_protocol_v2 = true # proxy protocol を有効化する
  ...
}
```

### Nginx の設定

proxy_protocol リクエストを受け付ける様にする。

```
server {
    listen 443 ssl proxy_protocol;
    server_name _;
```

## 結果

無事 Fargate にクライアントIPを送り届けることができました！


ですが、
Nginx のエラーログレベルを debug にすると
proxy protocol v2 をサポートしてないと言っているのが確認できた。

![](https://i.imgur.com/WRZ3nNp.png)

https://github.com/nginx/nginx/commit/9207cc84b21e94283478cee7a953b1859c4434cb を見る限り、問題なく対応していそう。

Nginx 1.13.11 以降なら対応しているとオフィシャルも言っていて、問題はなさそう。

https://docs.nginx.com/nginx/admin-guide/load-balancer/using-proxy-protocol/
> To accept the PROXY protocol v2, NGINX Plus R16 and later or NGINX Open Source 1.13.11 and later

ログの内容こそ気になるものの、
LB 的には Fargate 宛に client ip を届けており、 nginx で解釈できている様です。
