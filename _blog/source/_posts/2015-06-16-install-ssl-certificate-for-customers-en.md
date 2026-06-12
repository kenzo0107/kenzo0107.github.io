---
layout: post
title: What I Did to Install an SSL Certificate When Building a Website for a Client
date: 2015-06-16
category: Infrastructure
lang: en
translation_id: install-ssl-certificate-for-customers
permalink: en/2015/06/16/install-ssl-certificate-for-customers/
cover: /img/cover/2015-06-16-install-ssl-certificate-for-customers.svg
---

## Overview

While building a website ordered by a client, I needed to install an SSL certificate. This post summarizes the steps I followed at that time.

## Prerequisites

Since free SSL or self-signed SSL certificates raise security concerns, I decided to obtain a certificate from thawte, which issues SSL certificates with a high market share.
I also obtained the client's approval regarding the cost.

[thawte](http://www.jp-thawte.com/)

thawte is the world's second largest certificate authority by market share, providing various server authentication and code signing certificates to customers around the world.

## ToDo

1. Check the domain owner information with WHOIS
2. Confirm the DUNS number held by the client
3. Issue a CSR
4. Apply for SGC Super Certs
5. Install the SSL certificate

## Steps

### 1. Check the domain owner information with WHOIS

{% linkPreview https://kenzo0107.github.io/2015/02/28/2015-03-01-show-domains-owner/ %}

WHOIS displays the owner information for the domain you search.
Save this information.
It will be used later when issuing the CSR.


### 2. Confirm the DUNS number held by the client

{% linkPreview https://kenzo0107.hatenablog.com/entry/2015/02/28/231623 %}


### 3. Issue a CSR

{% linkPreview https://kenzo0107.hatenablog.com/entry/2015/03/01/010130 %}



### 4. Apply for SGC Super Certs

{% linkPreview https://kenzo0107.github.io/2015/06/15/2015-06-16-sgc-supercerts/ %}


### 5. Install the SSL certificate

{% linkPreview https://kenzo0107.github.io/2015/06/15/2015-06-16-install-ssl-certificate/ %}
