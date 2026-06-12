---
layout: post
title: A One-Liner Every PHP Engineer Should Run
date: 2016-08-18
lang: en
translation_id: oneliner-for-phper
permalink: en/2016/08/18/oneliner-for-phper/
tags:
  - PHP
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160818/20160818224146.jpg
---

This is the ultimate one-liner from [hiraku-san](http://blog.tojiru.net/) that makes everyone happy.

```sh
$ composer config -g repositories.packagist composer http://packagist.jp
```

Installing with composer becomes dramatically faster.

The reason it's slow is apparently that <span style="color:red">packagist.org is located in France</span>.

## A Problem Arises

Let's run the one-liner above right away!!

And then...

```
You are running composer with xdebug enabled. This has a major impact on runtime performance. See https://getcomposer.org/xdebug
Do not run Composer as root/super user! See https://getcomposer.org/root for details
```

It's complaining that xdebug is enabled...

## Finding Where xdebug Is Configured

```
$ php -i | grep xdebug

/etc/php.d/xdebug.ini,
xdebug
xdebug support => enabled
...
...
```

It was configured in /etc/php.d/xdebug.ini.

*Note: depending on your environment, it may be configured in php.ini, etc., so be careful.*

## Changing the xdebug Setting to disabled

Since I had no need to use xdebug in my own PHP runtime environment,
I moved /etc/php.d/xdebug.ini out of the way:

```
mv /etc/php.d/xdebug.ini /etc/php.d/xdebug.ini.org
```

## Running Again

Huh... it showed up again... This time:

```
Do not run Composer as root/super user! See https://getcomposer.org/root for details
```

It's complaining that I shouldn't run it as the root user...

## Switching to a Regular User Instead of root

```
# su - <user>
```

## Running Again

Success!

```
$ composer config -g repos.packagist composer https://packagist.jp
$
```

## Verifying the Configuration

Confirm that the packagist url is now `https://packagist.jp`:

```
$ cat .composer/config.json

{
    "config": {},
    "repositories": {
        "packagist": {
            "type": "composer",
            "url": "https://packagist.jp"
        }
    }
}
```

Enjoy a good PHP life!

## References

{% linkPreview https://tech.mercari.com/entry/2016/02/01/164829 _blank %}
