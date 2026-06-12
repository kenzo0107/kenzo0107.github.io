---
layout: post
title: Issuing a Free SSL Certificate and Scoring an A+ on Security! ~Apache Edition~
date: 2016-02-25
lang: en
translation_id: get-a-plus-ssl-quality
permalink: en/2016/02/25/get-a-plus-ssl-quality/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160224/20160224185554.png
tags:
- SSL
- Apache
---

## Overview

With the upcoming version upgrade of the Veritrans module,
an SSL certificate issued with SHA256 became mandatory.

When running the Veritrans module upgrade test in our test environment,
the need to install an SSL certificate arose.

While we couldn't go so far as to install the same paid SSL as in production,
we needed to build something close to it, so we issued and installed a free SSL certificate.

I've summarized the above procedure below.

## Environment

We are using AWS Marketplace: CentOS 6 (x86_64) - with Updates HVM.

- CentOS release 6.7 (Final)
- Apache 2.4.12


## Procedure

### Generating the CSR

As preparation, generate the CSR on the server where the SSL certificate will be installed.

Please refer to the following for how to generate a SHA256-compatible CSR.

{% linkPreview http://kenzo0107.hatenablog.com/entry/2015/03/01/010130 _blank %}


### Registering with StartCom

#### Click Sign-up in the header menu

[StartSSL](https://startssl.com/)

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160224/20160224185554.png" width="100%">
</div>

#### Fill in the required fields and click the "send verification code" button

A verification code will be sent to the registered email address.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160224/20160224185554.png" width="100%">
</div>

#### You'll receive an email like this.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160224/20160224190645.png" width="100%">
</div>

#### Enter the verification code to complete registration

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160224/20160224190947.png" width="100%">
</div>




### SSL Issuance Procedure

#### Select the free version

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160224/20160224191318.png" width="100%">
</div>

#### Select the SSL for Web Server

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160225/20160225103836.png" width="100%">
</div>

#### Domain Validation

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160225/20160225103958.png" width="100%">
</div>

#### Enter the domain of the server where the SSL certificate will be installed

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160225/20160225104510.png" width="100%">
</div>

#### Verification by email

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160225/20160225105201.png" width="100%">
</div>

You need to make it possible to <b>receive mail at the email address specified by StartSSL</b>.

The following article was helpful for setting up mail reception on an EC2 instance. Thank you.

[Receiving mail with postfix on AWS](https://github.com/mechamogera/MyTips/wiki/AWS%E4%B8%8A%E3%81%AEpostfix%E3%81%A7%E3%83%A1%E3%83%BC%E3%83%AB%E3%82%92%E5%8F%97%E4%BF%A1%E3%81%97%E3%81%A6%E3%81%BF%E3%82%8B)

> One caveat regarding the article above:
> running `yum update` right after creating the instance is fine,
> but sometimes running `yum update` on AWS can cause a kernel panic.
> Perhaps it was because I had reinstalled Python from source instead of via yum, and did various other things...
>
> I haven't been able to fully track down the cause, but for instances that have been running for years, I'd like to refrain from running yum update.

##### When mail reception isn't set up properly

- Constantly tail /var/log/maillog to check the logs.

- If you already have a receivable email address, change the destination with aliases.
postmaster@(domain) → root@(domain)

- If you get Permission denied in the mailbox and
can't save received mail, forcibly change the mail directory as follows.

```
/etc/postfix/main.cf

- home_mailbox = Maildir/
+ home_mailbox = ../home/ec2-user/Maildir/
```

#### Proceed to ordering the SSL certificate

Once verification by email is cleared, proceed to ordering the SSL certificate.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160225/20160225114419.png" width="100%">
</div>

#### Creating the credentials

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160225/20160225114811.png" width="100%">
</div>

After entering the information, (domain).zip will be downloaded.
* Since the web server is Apache this time, we'll refer to ApacheServer.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160225/20160225115225.png" width="100%">
</div>

Upload the following two files inside ApacheServer in the extracted zip file to a directory of your choice.

- 1_root_bundle.crt
- 2_(domain).crt

This time, the upload destination directory will be the path where server.key and so on reside (/etc/httpd/conf/ssl.csr/).


#### Configuring ssl.conf

Installing an SSL certificate means
having Apache load it via the specified directives in its configuration file.

The main settings are as follows.

| *Item*                  | *Value*                                   | *Explain*                         |
| ----------------------- | ----------------------------------------- |
| SSLCertificateChainFile | /etc/httpd/conf/ssl.csr/1_root_bundle.crt | Intermediate certificate          |
| SSLCertificateFile      | /etc/httpd/conf/ssl.csr/2_(domain).crt    | SSL server certificate            |
| SSLCertificateKeyFile   | /etc/httpd/conf/ssl.csr/server.key        | Private key paired with the SSL server certificate |


The following URL suggests the optimal configuration method based on each web server and openssl version.

[https://ssl-config.mozilla.org/](https://ssl-config.mozilla.org/)

/etc/httpd/conf.d/ssl.conf

```
LoadModule ssl_module modules/mod_ssl.so

Listen 443

AddType application/x-x509-ca-cert .crt
AddType application/x-pkcs7-crl    .crl

SSLPassPhraseDialog  builtin


SSLSessionCache         shmcb:/var/cache/mod_ssl/scache(512000)
SSLSessionCacheTimeout  300


#SSLMutex default
Mutex default ssl-cache

SSLRandomSeed startup file:/dev/urandom  256
SSLRandomSeed connect builtin
#SSLRandomSeed startup file:/dev/random  512
#SSLRandomSeed connect file:/dev/random  512
#SSLRandomSeed connect file:/dev/urandom 512

SSLCryptoDevice builtin

<VirtualHost _default_:443>

  DocumentRoot "/var/www/html"
  ServerName (domain):443

  ErrorLog /var/log/ssl_error_log
  TransferLog /var/log/ssl_access_log
  LogLevel warn

  SSLEngine on
  SSLCertificateFile /etc/httpd/conf/ssl.csr/2_(domain).crt
  SSLCertificateKeyFile /etc/httpd/conf/ssl.csr/server.key
  SSLCertificateChainFile /etc/httpd/conf/ssl.csr/1_root_bundle.crt


  <Files ~ "\.(cgi|shtml|phtml|php3?)$">
    SSLOptions +StdEnvVars
  </Files>
  <Directory "/var/www/cgi-bin">
    SSLOptions +StdEnvVars
  </Directory>


  SetEnvIf User-Agent ".*MSIE.*" \
         nokeepalive ssl-unclean-shutdown \
         downgrade-1.0 force-response-1.0

  CustomLog logs/ssl_request_log \
          "%t %h %{SSL_PROTOCOL}x %{SSL_CIPHER}x \"%r\" %b"

  <Directory "/var/www/html">
    AllowOverride All
    Options -Indexes +FollowSymLinks +Includes +ExecCGI
    Order allow,deny
    Allow from all
  </Directory>

</VirtualHost>

SSLProtocol all -SSLv2 -SSLv3

SSLCipherSuite ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA:ECDHE-ECDSA-DES-CBC3-SHA:ECDHE-RSA-DES-CBC3-SHA:EDH-RSA-DES-CBC3-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:DES-CBC3-SHA:!DSS

SSLHonorCipherOrder on

SSLCompression off
SSLSessionTickets off

```

> No performance tuning has been done at all.
> Please note that this is strictly about installing the SSL certificate.

#### Checking the syntax of the config file

```
// Syntax check
# httpd -t

// If there are no syntax errors, it will be displayed as follows.
Syntax OK
```

If a syntax error occurs, the relevant location will be displayed, so check it again.
However, just because there are no syntax errors doesn't guarantee that no error will occur when Apache reloads,
so just in case, it's a good idea to prepare a command that can immediately revert things.

For example,
renaming ssl.conf to ssl.conf.bk so that Apache won't treat it as a configuration file.

#### Reloading the Apache config file

```
# service httpd reload
Reloading httpd:             [  OK  ]
```

#### Accessing from a browser

I accessed it with Chrome.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160225/20160225122555.png" width="100%">
</div>

- Detailed authentication information

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160225/20160225123052.png" width="100%">
</div>




#### Security check

You can run a diagnosis at the following site.
[QUALYS SSL LABS](https://www.ssllabs.com/ssltest/index.html)

I got an "A"!

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160225/20160225130720.png" width="100%">
</div>


By the way,
if it's a site where always using https communication is fine, configure it as follows

```
<VirtualHost *:443>
  ...
  Header always set Strict-Transport-Security "max-age=15768000"
  ...
</VirtualHost>
```

and I was able to get an "A+"!

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160225/20160225131401.png" width="100%">
</div>

Always-on https is secure, but it also depends on the site's specifications, so it varies by situation.

That's all.
