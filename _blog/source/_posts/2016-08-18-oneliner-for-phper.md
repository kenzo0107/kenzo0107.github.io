---
layout: post
title: PHP エンジニアであれば必ずやるべき 1 ライナー
date: 2016-08-18
tags:
- PHP
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160818/20160818224146.jpg
---

みんなが幸せになれる[hiraku さん](http://blog.tojiru.net/)の究極の1ライナーです。

```sh
$ composer config -g repositories.packagist composer http://packagist.jp
```

composer による インストールが劇的に早くなります。

遅い理由は 特に <span style="color:red">packagist.org が フランスにある</span> からとのこと


## 問題発生

早速上記 1 ライナーを実行!!

すると...

```
You are running composer with xdebug enabled. This has a major impact on runtime performance. See https://getcomposer.org/xdebug
Do not run Composer as root/super user! See https://getcomposer.org/root for details
```

xdeug が enabled になっているぞと怒られている。。

## xdebug 設定箇所を探す

```
$ php -i | grep xdebug

/etc/php.d/xdebug.ini,
xdebug
xdebug support => enabled
...
...
```

/etc/php.d/xdebug.ini で 設定していた。

※環境によっては php.ini で設定している等あるので注意

## xdebug を disabled に設定変更

自分の PHP実行環境では xdebug を利用する必要性がなかった為、
/etc/php.d/xdebug.ini 退避

```
mv /etc/php.d/xdebug.ini /etc/php.d/xdebug.ini.org
```

## 再度実行

あれ... また出てきた... 今度は、

```
Do not run Composer as root/super user! See https://getcomposer.org/root for details
```

root ユーザで実行するなと怒られている。。

## root ユーザ以外の通常ユーザへ変更

```
# su - <user>
```

## 再度実行

成功した！

```
$ composer config -g repos.packagist composer https://packagist.jp
$
```

## 設定確認

packagist url が `https://packagist.jp` になっていることを確認

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

良きPHPライフを！

## 参照

{% linkPreview https://tech.mercari.com/entry/2016/02/01/164829 _blank %}
