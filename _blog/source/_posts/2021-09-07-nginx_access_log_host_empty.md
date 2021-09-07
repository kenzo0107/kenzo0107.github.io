---
title: Nginx access_log $host が _ になる件調査
date: 2021-09-07
---

Nginx access_log で指定している $host が `_` となるケースがあるので調査したことをまとめます。

## $host とは？

https://www.nginx.com/resources/wiki/#-24host
> $host
>
> This variable is equal to line Host in the header of request or name of the server processing the request if the Host header is not available.
>
> This variable may have a different value from $http_host in such cases: 1) when the Host input header is absent or has an empty value, $host equals to the value of server_name directive; 2) when the value of Host contains port number, $host doesn't include that port number. $host's value is always lowercase since 0.8.17.

リクエストヘッダーの Host と同じ、もしくは、 ホストヘッダーが利用できない場合、リクエスト処理をするサーバ名になる。


## アクセスログ設定

```nginx.conf
    log_format main '$remote_addr - $remote_user [$time_local] '
                    '"$request_method https://$host$request_uri $server_protocol" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent"';
```

`"$request"` でなく、 `"$request_method https://$host$request_uri $server_protocol"` を使用しているのは、`$request` の場合、ホスト情報が記載されない為です。

`$host` を利用したかったのは、複数のホスト名を扱えるサイトを構築した為です。

## Host ヘッダーを空指定してリクエストしてみる

```
curl -H "Host: " "https://example.com/?test=kenzo.tanaka"

<html>
<head><title>400 Bad Request</title></head>
<body>
<center><h1>400 Bad Request</h1></center>
<hr><center>nginx</center>
</body>
</html>
```


ログ確認してみると再現できました。

```
xxx.xxx.xxx.xxx - - [07/Sep/2021:11:16:16 +0900] "GET https://_/?test=kenzo.tanaka HTTP/1.1" 400 150 "-" "-"
```

curl で実行したので User Agent もない。


## 結論

アクセス元 IP が海外が多いのと User-Agent 等がないことから Bot なのでは？と推察しています。
通常ブラウザ操作でヘッダーのホスト情報を指定せずリクエストする様なことはないと思うので、一般ユーザには影響はないかと思いました。

但し、 Bot で攻撃頻度が高く、サーバリソースを逼迫させる様な場合は、IP遮断等、 WAF の設定が必須です。

以上です。
ご参考になれば幸いです。
