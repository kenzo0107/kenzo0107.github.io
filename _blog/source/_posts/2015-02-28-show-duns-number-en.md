---
layout: post
title: How to Look Up a DUNS Number
date: 2015-02-28
category: Infrastructure
lang: en
translation_id: show-duns-number
permalink: en/2015/02/28/show-duns-number/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150228/20150228215352.png
---

## Overview

When applying for a "SGC Super Certs" certificate at thawte,
a DUNS number is required, so
we needed to confirm whether the client
held a DUNS number.

http://www.tsr-net.co.jp/service/product/get_a_duns_number/


The steps to look up a DUNS number are described below.

<span style="color: #ff0000">Note that the following procedure must be carried out by the client themselves.</span>
The reason is that when the client performs the lookup, the inquiry is free of charge.
When done by a third party, it costs 3,000 yen. (As of 2015/02/23)


## How to Look Up a DUNS Number

### Access the https://duns-number-jp.dnb.com/search/jpn/login.asp:title=Tokyo Shoko Research page.
Click the red "Search for a DUNS Number" button in the center.

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150228/20150228215352.png)



### Search by the client's company name or address.

Search using the domain owner found via WHOIS.

As an example, we'll use the owner information for Ameblo "ameblo.jp".

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150228/20150228223332.png)



### In the search results, click the "DUNS" image button for the matching entry

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150228/20150228224451.png)



### The license agreement page is displayed

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150228/20150228225036.png)



### Near the page footer, click the "Agree" button

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150228/20150228225224.png)



### The application form is displayed, so enter the required information and click the "Confirm" button

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150228/20150228230551.png)



### Click the "Send" button

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150228/20150228230922.png)

Check the email address entered above for the DUNS number notification.





The following is the DUNS number information format reported to us by the client.

```
[受付番号]　***
[対象企業]　***
[ DUNS# ]　***
[ 自／他 ]　自社
```

Based on the above, thawte proceeds with the SSL certificate issuance procedure.

If the phone number registered by the client is incorrect or no longer in use,
the SSL application procedure will be rejected.

This actually happened to us (sweat).

When asking the client to confirm, although it may seem a bit forward,
it's a good idea to also verify that the phone number is still usable.

That's all.
