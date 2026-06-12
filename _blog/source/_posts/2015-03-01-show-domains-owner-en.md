---
layout: post
title: How to Check the Owner of a Domain
date: 2015-03-01
lang: en
translation_id: show-domains-owner
permalink: en/2015/03/01/show-domains-owner/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150301/20150301001641.png
---

## Overview

For a request to install an SSL certificate on a domain owned by a client,
we went through the process of applying for and issuing an SSL certificate via thawte's SGC SuperCerts.

To obtain the DUNS number required for that application,
we needed to confirm that the client was the owner of the domain.

The DUNS number can be checked as follows.

{% linkPreview https://kenzo0107.github.io/2015/02/27/2015-02-28-show-duns-number/ %}


## Procedure

You can look it up using the domain search service called WHOIS.

http://whois.jprs.jp/

Access WHOIS from the link above,
and enter the domain name you want to search.
When you click the "Search" button, the owner information is displayed.

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150301/20150301001641.png)

When issuing an SSL certificate with thawte,
you proceed with the CSR issuance procedure based on the information above.


That's all.
