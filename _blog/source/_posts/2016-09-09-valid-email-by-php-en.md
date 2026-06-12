---
layout: post
title: Validating Email Addresses with PHP's Validation Filter
date: 2016-09-09
categories:
  - [AWS]
  - [Infrastructure]
lang: en
translation_id: valid-email-by-php
permalink: en/2016/09/09/valid-email-by-php/
cover: /img/cover/2016-09-09-valid-email-by-php.svg
tags:
- PHP
---

## Overview

PHP provides a validation filter for checking the format of email addresses.

You typically use it like this.

```php
if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo '(^-^) OK Email アドレスフォーマットとして妥当';
} else {
    echo '(>_<) NG';
}
```

The php.net documentation describes it as follows.

http://php.net/manual/ja/filter.filters.validate.php

> Validates whether the value is a valid e-mail address.
> This validation checks whether the e-mail address has a form that conforms to RFC 822. However, it does not support comments and whitespace folding.

## Verification

{% gist kenzo0107/49922bf85c73f5f85031ea4abf3aa7ce %}

### Result

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

It lets through email addresses that you would want to reject as NG.

`&abc@xyz.ab`

## Assessment so far

Validation using PHP's validation filter `FILTER_VALIDATE_EMAIL` is probably acceptable for email address validation of accounts used in internal company systems.

For a commercial service, however, I felt that relying on the validation filter alone is risky.

## My Email validation

- Use the validation filter `FILTER_VALIDATE_EMAIL` as a basic check
- Restrict the allowed characters to alphanumeric characters, `.`, `_`, and `-`
- Added a DNS validation check by referring to a Qiita article. (Thank you, [ShibuyaKosuke](http://qiita.com/ShibuyaKosuke)!)

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


## My Email validation verification

{% gist kenzo0107/a33a6e9a75ceb9cf1ccd7213c86db530 %}

### Result

It rejects almost everything~


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


## References

[Isn't it about time we stopped checking email addresses with regular expressions alone?](http://qiita.com/ShibuyaKosuke/items/0b9a8fddaefb2060a14a)


That's all.
