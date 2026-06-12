---
layout: post
title: Installing a Self-Signed SSL Certificate on Nginx
date: 2015-08-05
lang: en
translation_id: use-my-certificate-on-nginx
permalink: en/2015/08/05/use-my-certificate-on-nginx/
cover: /img/cover/2015-08-05-use-my-certificate-on-nginx.svg
---


## Environment
- AWS EC2 : t2.micro
- OS : CentOS Linux release 7.1.1503 (Core)
- Nginx: 1.8.0
- OpenSSL: 1.0.1e-fips 11 Feb 2013

## Prerequisites
- Nginx is already installed.

## Create a password in advance

```
$ cat /dev/urandom | LC_CTYPE=C tr -dc '[:alnum:]' | head -c 40
v6biM9MMByBO0SWFitcbnyF0VUsJLbZsizpP7K15
```

This generates a random 40-character alphanumeric string.

This is the password you will need when creating the certificate.
Make absolutely sure you don't forget it.



> In the following, the EC2 instance's public DNS is

> `ec2-xx-xx-xx-xx.ap-northeast-1.compute.amazonaws.com`

> and we will proceed on that assumption.

---


## Create the KEY file

We create it with sha256 (sha2 for short).

```
# mkdir -p /etc/nginx/conf
# cd /etc/nginx/conf
# openssl genrsa -des3 -out server.key 2048 -sha256
Enter pass phrase for server.key: v6biM9MMByBO0SWFitcbnyF0VUsJLbZsizpP7K15
```

## Create the CSR file

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

##### Verify

```
$ ls -al
total 8
drwxr-xr-x. 2 root root  40 Aug  5 13:43 .
drwxr-xr-x. 3 root root  17 Aug  5 13:32 ..
-rw-r--r--. 1 root root 729 Aug  5 13:43 server.csr
-rw-r--r--. 1 root root 963 Aug  5 13:37 server.key
```

## Create the RSA key

```
# openssl rsa -in server.key -out server.key
Enter pass phrase for server.key: v6biM9MMByBO0SWFitcbnyF0VUsJLbZsizpP7K15
```

## Create the CRT

```
# openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt

Signature ok
subject=/C=JP/ST=Tokyo/L=Setagaya-ku/O=UmiyamaShouji inc./OU=Production/CN=ec2-xx-xx-xx-xx.ap-northeast-1.compute.amazonaws.com
Getting Private key
```

## Create ssl.conf


#### Copy example_ssl.conf to create ssl.conf

```
# cd /etc/nginx/conf.d
# cp example_ssl.conf ssl.conf
```

#### Edit ssl.conf

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

## Restart Nginx

```
# systemctl restart nginx
```

### If you get an error like this

```
nginx[2246]: nginx: [emerg] SSL_CTX_use_PrivateKey_file("/etc/nginx/conf/server.key") failed (SSL: error:0906406D:PEM routines:PEM_def_callback:problems getting password error:0906A068:PEM routines:PEM_do_header:bad password read error:140B0009:SSL routines:SSL_CTX_use_PrivateKey_file:PEM lib)
```

This error means the server.key could not be loaded because of its passphrase.
Create a backup and then remove the passphrase.
Once done, restart and verify.

```
$ sudo cp server.key server.key.bk
$ sudo openssl rsa -in server.key -out server.key
$ systemctl restart nginx
```

## Verify operation

- Access <https://ec2-xx-xx-xx-xx.ap-northeast-1.compute.amazonaws.com> in Safari or a similar browser.
- Check the information of the certificate you created.

For reference:
[http://kenzo0107.hatenablog.com/entry/2015/08/05/144733:embed:cite]
