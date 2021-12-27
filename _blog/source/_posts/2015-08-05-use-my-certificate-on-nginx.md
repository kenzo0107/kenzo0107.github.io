---
layout: post
title: NginxにオレオレSSL証明書インストール
date: 2015-08-05
---


## 環境
- AWS EC2 : t2.micro
- OS : CentOS Linux release 7.1.1503 (Core)
- Nginx: 1.8.0
- OpenSSL: 1.0.1e-fips 11 Feb 2013

## 前提
- Nginxがインストール済みである。

## 事前にパスワード作成

```
$ cat /dev/urandom | LC_CTYPE=C tr -dc '[:alnum:]' | head -c 40
v6biM9MMByBO0SWFitcbnyF0VUsJLbZsizpP7K15
```

40文字のランダムな半角英数字が生成されます。

証明書作成時に必要となるパスワードです。
絶対忘れないようにしてください。



> 以下ec2インスタンスのパブリック DNSを

> `ec2-xx-xx-xx-xx.ap-northeast-1.compute.amazonaws.com`

> として話を進めます。

---


## KEY ファイル作成

sha256(略してsha2)で作成します。

```
# mkdir -p /etc/nginx/conf
# cd /etc/nginx/conf
# openssl genrsa -des3 -out server.key 2048 -sha256
Enter pass phrase for server.key: v6biM9MMByBO0SWFitcbnyF0VUsJLbZsizpP7K15
```

## CSR ファイル作成

```
# openssl req -new -sha256 -key server.key -out server.csr
Enter pass phrase for server.key: v6biM9MMByBO0SWFitcbnyF0VUsJLbZsizpP7K15

You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [XX]:JP
State or Province Name (full name) []:Tokyo
Locality Name (eg, city) [Default City]:Setagaya-ku
Organization Name (eg, company) [Default Company Ltd]:UmiyamaShouji inc.
Organizational Unit Name (eg, section) []:Production
Common Name (eg, your name or your server's hostname) []:ec2-xx-xx-xx-xx.ap-northeast-1.compute.amazonaws.com
Email Address []: (空白のままEnter)

Please enter the following 'extra' attributes
to be sent with your certificate request
A challenge password []: (空白のままEnter)
An optional company name []: (空白のままEnter)
```

##### 確認

```
$ ls -al
total 8
drwxr-xr-x. 2 root root  40 Aug  5 13:43 .
drwxr-xr-x. 3 root root  17 Aug  5 13:32 ..
-rw-r--r--. 1 root root 729 Aug  5 13:43 server.csr
-rw-r--r--. 1 root root 963 Aug  5 13:37 server.key
```

## RSA key作成

```
# openssl rsa -in server.key -out server.key
Enter pass phrase for server.key: v6biM9MMByBO0SWFitcbnyF0VUsJLbZsizpP7K15
```

## CRT作成

```
# openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt

Signature ok
subject=/C=JP/ST=Tokyo/L=Setagaya-ku/O=UmiyamaShouji inc./OU=Production/CN=ec2-xx-xx-xx-xx.ap-northeast-1.compute.amazonaws.com
Getting Private key
```

## ssl.conf作成


#### example_ssl.conf をコピーし ssl.conf 作成

```
# cd /etc/nginx/conf.d
# cp example_ssl.conf ssl.conf
```

#### ssl.conf編集

```
# vi ssl.conf
```

```
# HTTPS server
#
server {
    listen       443 ssl;
    server_name  ec2-xx-xx-xx-xx.ap-northeast-1.compute.amazonaws.com;
    ssl on;
    ssl_certificate        conf/server.crt;
    ssl_certificate_key conf/server.key;

# 以下随時設定
#    ssl_session_cache shared:SSL:1m;
#    ssl_session_timeout  5m;

#    ssl_ciphers  HIGH:!aNULL:!MD5;
#    ssl_prefer_server_ciphers   on;

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }
}
```

## Nginx再起動

```
# systemctl restart nginx
```

### もしこんなエラーが出たら

```
nginx[2246]: nginx: [emerg] SSL_CTX_use_PrivateKey_file("/etc/nginx/conf/server.key") failed (SSL: error:0906406D:PEM routines:PEM_def_callback:problems getting password error:0906A068:PEM routines:PEM_do_header:bad password read error:140B0009:SSL routines:SSL_CTX_use_PrivateKey_file:PEM lib)
```

server.keyのパスフレーズにより読み込みができないというエラーです。
バックアップを作成してパスフレーズを解除してください。
完了したら再起動して確認してください。

```
$ sudo cp server.key server.key.bk
$ sudo openssl rsa -in server.key -out server.key
$ systemctl restart nginx
```

## 動作確認

- Safari等で <https://ec2-xx-xx-xx-xx.ap-northeast-1.compute.amazonaws.com> へアクセス
- 作成した証明書情報確認

以下参考までに
[http://kenzo0107.hatenablog.com/entry/2015/08/05/144733:embed:cite]
