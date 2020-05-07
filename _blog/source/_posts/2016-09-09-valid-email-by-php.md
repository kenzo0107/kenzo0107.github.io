---
layout: post
title: PHP 検証フィルタで Email アドレス検証 を検証する
date: 2016-09-09
tags:
- PHP
---

## 概要

Email アドレスのフォーマットチェックとして PHP には検証フィルタが用意されています。

こんな使い方しますね。

```php
if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo '(^-^) OK Email アドレスフォーマットとして妥当';
} else {
    echo '(>_<) NG';
}
```

以下 php.net ではこのように記述されている。

http://php.net/manual/ja/filter.filters.validate.php

> 値が妥当な e-mail アドレスであるかどうかを検証します。
> この検証は、e-mail アドレスが RFC 822 に沿った形式であるかどうかを確かめます。 ただし、コメントおよび空白の折り返し (whitespace folding) には対応していません。

## 検証

{% gist kenzo0107/49922bf85c73f5f85031ea4abf3aa7ce %}

### 結果

```
[OK (^-^) EMAIL LIST]
abc@gmail.com
a!bc@gmail.com
a#bc@gmail.com
a$bc@gmail.com
a%bc@gmail.com
a&bc@gmail.com
a`bc@gmail.com
a=bc@gmail.com
a~bc@gmail.com
a~bc@gmail.com
a|bc@gmail.com
a^bc@gmail.com
a*bc@gmail.com
a+bc@gmail.com
a?bc@gmail.com
a`bc@gmail.com
a{bc@gmail.com
a}bc@gmail.com
a}bc@gmail.com
!abc@gmail.com
#abc@gmail.com
$abc@gmail.com
%abc@gmail.com
&abc@gmail.com
=abc@gmail.com
~abc@gmail.com
|abc@gmail.com
^abc@gmail.com
*abc@gmail.com
+abc@gmail.com
?abc@gmail.com
`abc@gmail.com
{abc@gmail.com
}abc@gmail.com
a__bc@gmail.com
abc_@gmail.com
abc@vwx.yz

[NG (>_<) EMAIL LIST]
a"bc@gmail.com
a@bc@gmail.com
a(bc@gmail.com
a)bc@gmail.com
a\bc@gmail.com
a:bc@gmail.com
a;bc@gmail.com
a<bc@gmail.com
a>bc@gmail.com
a>bc@gmail.com
a,bc@gmail.com
a[bc@gmail.com
a]bc@gmail.com
¥abc@gmail.com
"abc@gmail.com
@abc@gmail.com
(abc@gmail.com
)abc@gmail.com
\abc@gmail.com
:abc@gmail.com
;abc@gmail.com
<abc@gmail.com
>abc@gmail.com
,abc@gmail.com
[abc@gmail.com
]abc@gmail.com
a..bc@gmail.com
abc.@gmail.com
abc@@vwx.yz
```

NGとしたいような Emailアドレス を通してしまいます。

`&abc@xyz.ab`

## これまでの評価

PHP 検証フィルタ FILTER_VALIDATE_EMAIL によるバリデーションは
社内システムで利用するアカウントでのEmailアドレス検証程度であれば利用可能か。

商用サービスとして検証フィルタのみでバリデーションするのは危険かなと思いました。

## マイ Email バリデーション

- 検証フィルタ FILTER_VALIDATE_EMAIL はベーシックに利用
- 利用できる文字を 半角英数字 . _ - に制限
- Qiita 記事を参照しDNS 検証チェック入れました。 ([ShibuyaKosuke](http://qiita.com/ShibuyaKosuke) さんありがとうございます！)

```php
function checkEmailwithDNS($email, $check_dns = false) {
    switch (true) {
        case !filter_var($email, FILTER_VALIDATE_EMAIL):
        case !preg_match("/^([a-zA-Z0-9])+([a-zA-Z0-9\._-])*@([a-zA-Z0-9_-])+([a-zA-Z0-9\._-]+)+$/", $email):
        case !preg_match('/@([\w.-]++)\z/', $email, $m):
            return false;
        case !$check_dns:
        case checkdnsrr($m[1], 'MX'):
        case checkdnsrr($m[1], 'A'):
        case checkdnsrr($m[1], 'AAAA'):
            return true;
        default:
            return false;
    }
}

if (checkEmailDNS($email, true)) {
    echo '(^-^) OK Email アドレスフォーマットとして妥当';
} else {
    echo '(>_<) NG';
}
```


## マイ Email バリデーション検証

{% gist kenzo0107/a33a6e9a75ceb9cf1ccd7213c86db530 %}

### 結果

ほぼ弾いてくれます〜


```
[OK (^-^) EMAIL LIST]
abc@gmail.com
a__bc@gmail.com
abc_@gmail.com

[NG (>_<) EMAIL LIST]
a!bc@gmail.com
a"bc@gmail.com
a@bc@gmail.com
a#bc@gmail.com
a$bc@gmail.com
a%bc@gmail.com
a&bc@gmail.com
a`bc@gmail.com
a(bc@gmail.com
a)bc@gmail.com
a=bc@gmail.com
a~bc@gmail.com
a~bc@gmail.com
a|bc@gmail.com
a\bc@gmail.com
a^bc@gmail.com
a:bc@gmail.com
a;bc@gmail.com
a*bc@gmail.com
a+bc@gmail.com
a?bc@gmail.com
a<bc@gmail.com
a>bc@gmail.com
a>bc@gmail.com
a,bc@gmail.com
a`bc@gmail.com
a[bc@gmail.com
a]bc@gmail.com
a{bc@gmail.com
a}bc@gmail.com
a}bc@gmail.com
¥abc@gmail.com
!abc@gmail.com
"abc@gmail.com
@abc@gmail.com
#abc@gmail.com
$abc@gmail.com
%abc@gmail.com
&abc@gmail.com
(abc@gmail.com
)abc@gmail.com
=abc@gmail.com
~abc@gmail.com
|abc@gmail.com
\abc@gmail.com
^abc@gmail.com
:abc@gmail.com
;abc@gmail.com
*abc@gmail.com
+abc@gmail.com
?abc@gmail.com
<abc@gmail.com
>abc@gmail.com
,abc@gmail.com
`abc@gmail.com
[abc@gmail.com
]abc@gmail.com
{abc@gmail.com
}abc@gmail.com
a..bc@gmail.com
abc.@gmail.com
abc@@vwx.yz
abc@vwx.yz
```


## 参照

[そろそろメールアドレスを正規表現だけでチェックするのは終わりにしませんか？](http://qiita.com/ShibuyaKosuke/items/0b9a8fddaefb2060a14a)


以上です。
