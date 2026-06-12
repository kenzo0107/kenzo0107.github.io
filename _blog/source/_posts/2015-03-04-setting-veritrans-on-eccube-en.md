---
layout: post
title: Configuring VeriTrans on EC-CUBE
date: 2015-03-04
category: Infrastructure
lang: en
translation_id: setting-veritrans-on-eccube
permalink: en/2015/03/04/setting-veritrans-on-eccube/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150304/20150304132031.png
---

## Prerequisites
A completed VeriTrans contract is required.

Note that there are separate module settings for testing and production.
The key points are summarized below.

## Points to note
The production VeriTrans payment module
<span style="color: #ff0000">starts incurring charges from the moment VeriTrans is activated</span>.

The general flow is to consider the following:

+ Receive the test module information for the staging environment from the operations team and configure it.
+ Request activation of the production VeriTrans roughly 1 to 2 weeks before the service launch, then configure the production module.



## Procedure
### From the admin panel, click Owner's Store > Purchased Products List.

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150304/20150304132031.png)


### Click the "Get Purchased Products List" button.

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150304/20150304140744.png)

### If the module has not been downloaded, click the download link on the VeriTrans row.

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150304/20150304141016.png)

- If the download fails, check the logs.

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150304/20150304141043.png)


- Click Log Management > Details.

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150304/20150304141056.png)


- Check the log status.
<b><span style="color: #ff0000">This is usually caused by a lack of write permissions, so grant write permissions.</span></b>

```console
$ chmod -R 0777 (EC-CUBEパス)/data/downloads
```

- Run the download again.



### Click the configuration link on the VeriTrans row.

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150304/20150304141246.png)

A window like the following appears in a separate window, where you enter the information.


### Configure each field of the VeriTrans 3G MDK payment module.
Set the Merchant CCID and the authentication key.
The transaction ID prefix is a string appended to the payment information.
For testing, include something like the configured date as shown below.

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150304/20150304141329.png)


The transaction ID prefix is generally fine when set roughly as follows:
- For testing  :  (site alias)_df_(configuration date)_
- For production : (site alias)_df_

You may sometimes synchronize the production DB into the test DB.

Once already-settled payment information flows in, payments will no longer go through, so when synchronizing from the production DB to the test DB, make sure to change the test transaction ID prefix.



### Credit card settings
The following is the basic set.
Unless the client gives special instructions, the following is fine.

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150304/20150304141601.png)



### About other payment settings
Unless instructed by the client, uncheck the "Enable" checkbox.
- Convenience store payment settings
- Electronic money (Edy) payment settings
- Electronic money (Suica) payment settings
- Bank / postal savings (Pay-easy) payment settings
- UnionPay online payment settings
- PayPal payment settings



### Overwrite file list settings
Select the radio button for "Do not overwrite files automatically (for customization users)".




### Register settings
Click the "Register with this content" button.


Once the settings are applied, you will see a popup like the following.



I will continue and cover the
payment settings and so on.



## References

* https://www.ec-cube.net/document/sbi/sbi_211.pdf
* https://www.ec-cube.net/product/veritrans.php


That's all.
