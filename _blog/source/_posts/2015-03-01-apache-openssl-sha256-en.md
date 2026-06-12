---
layout: post
title: Generating a SHA256 CSR with Apache + OpenSSL
date: 2015-03-01
category: Infrastructure
lang: en
translation_id: apache-openssl-sha256
permalink: en/2015/03/01/apache-openssl-sha256/
cover: /img/cover/2015-03-01-apache-openssl-sha256.svg
tags:
- Apache
- OpenSSL
---

## Verifying the Domain Registrant Information

* If you don't specifically need to designate a domain registrant, skip ahead to "Procedure."

When organizational validation is required, it goes more smoothly if you check the domain registrant information in advance via WHOIS.

[http://whois.jprs.jp/](http://whois.jprs.jp/)

Enter the domain in the search box and search to view the registrant information.



## Procedure for Generating a CSR

{% gist kenzo0107/781b81a6916fbb2b8533 %}

{% gist kenzo0107/781b81a6916fbb2b8533 %}
