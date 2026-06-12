---
layout: post
title: "httpd: Could not reliably determine the server's fully qualified domain name, using 127.0.0.1 for ServerName"
date: 2015-03-16
category: Infrastructure
lang: en
translation_id: httpd-error-could-not-reliably-determine-the-servers-fully-qualified-domain-name
permalink: en/2015/03/16/httpd-error-could-not-reliably-determine-the-servers-fully-qualified-domain-name/
cover: /img/cover/2015-03-16-httpd-error-could-not-reliably-determine-the-servers-fully-qualified-domain-name.svg
---

## Overview
When restarting Apache, an error message like the following is displayed.
* Note: Apache itself restarts without any problems.


```
service httpd restart

httpd を停止中:                                            [  OK  ]
httpd を起動中: httpd: Could not reliably determine the server's fully qualified domain name, using 127.0.0.1 for ServerName
                                                           [  OK  ]
```


It means that the [FQDN](http://ja.wikipedia.org/wiki/Fully_Qualified_Domain_Name), which uses 127.0.0.1 for ServerName, cannot be reliably determined.


## Cause
The host name configured for "127.0.0.1" in /etc/hosts is not defined in the Apache configuration file.

hogehost is not configured in the Apache configuration file.

```
127.0.0.1      hogehost localhost.localdomain localhost
```

/etc/httpd/conf/httpd.conf
```
#ServerName www.example.com:80
ServerName hogehost:80
```
