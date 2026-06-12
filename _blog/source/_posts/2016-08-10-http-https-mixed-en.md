---
layout: post
title: How to Handle the Secure Cookie Attribute on Mixed HTTP/HTTPS Sites
date: 2016-08-10
lang: en
translation_id: http-https-mixed
permalink: en/2016/08/10/http-https-mixed/
tags:
  - .htaccess
  - PHP
  - Cookie
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160810/20160810114001.jpg
---

## The Problem

Are you setting the Secure attribute on your cookies under HTTPS communication?

<!-- more -->

## What Is the Secure Attribute?

When there is mutual traffic back and forth between HTTP and HTTPS communication,
a cookie value that should only be used over HTTPS communication
may leak into HTTP communication.

To prevent this, there is a countermeasure of adding the Secure attribute to cookies
so that they can only be handled over HTTPS communication.

## A Real Example

Since I wanted to deal with the PHP case,
I'll refer to [Mercari](https://www.mercari.com), which I use myself.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160810/20160810102752.png" width="100%">
</div>

If you check the Secure column in Chrome's Developer Tools,
you can see that it is checked.

PHPSESSID is the name of the session_id configured by
session.name in php.ini.

```php
$ php -i | grep php.ini
<path to php.ini>/php.ini

$ grep 'session.name =' <path to php.ini>/php.ini
session.name = PHPSESSID
```

## If You Always Use HTTPS

- Always set the Secure attribute.

#### Example of Issuing a session_id

Configure it using the [session_set_cookie_params](http://php.net/manual/ja/function.session-set-cookie-params.php) function.

```php
$secure = true;
$httponly = true;
session_set_cookie_params($lifetime, $path, DOMAIN_NAME, $secure, $httponly);
session_start();
```

- Setting HttpOnly to true makes the cookie inaccessible from client-side JavaScript, which is part of [XSS](https://www.websec-room.com/2013/03/14/550) countermeasures.

#### Example of Issuing a Cookie

```php
$secure = true;
$httponly = true;
setcookie($key, $val, $expire, $path, DOMAIN_NAME, $secure, $httponly);
```

## If HTTP and HTTPS Are Mixed

I ran into this case.
On shopping sites and the like, you often see cases where HTTP and HTTPS are mixed, such as:

- Product list page .... HTTP
- Payment information entry page ... HTTPS

I considered how to handle the Secure cookie attribute in such cases.

### Countermeasure 1

- Issue two cookies: one for HTTP (PHPSESSID) without the Secure attribute, and one for HTTPS (e.g., SPHPSESSID) with the Secure attribute.

### Countermeasure 2

- Issue PHPSESSID, a cookie shared between HTTP and HTTPS without the Secure attribute.
- Issue a token with the Secure attribute during HTTPS communication, and check the issued token.
  If a mismatch occurs, rewrite the session_id and discard the session contents.

Since Countermeasure 1 above makes it hard to manage the association between the session_ids for HTTP and HTTPS,
I implemented Countermeasure 2.

#### Implementation Example for Countermeasure 2

- If no session_id has been issued (on first access), issue a session_id (PHPSESSID) without the Secure attribute.
- During HTTPS communication, if there is no token in the session, issue a token cookie with the Secure attribute. Also save the token in the session.
- Compare the token information in the session and the cookie; if they don't match, change the session_id and discard the session contents.

I've intentionally written this in a redundant way for clarity.
Please define domain, path, secure, and so on per environment as needed.

```php
$domain = 'www.example.jp';
$path = "/";

if (session_id() === "") {
    $secure = false;
    $httponly = true;
    session_set_cookie_params(0, $path, $domain, $secure, $httponly);
    if (!ini_get("session.auto_start")) {
        // Start the session
        session_start();
    }
}

if (!empty($_SERVER['HTTPS'])) {
    if (empty($_SESSION['token'])) {
        $token = getToken();
        $secure = true;
        $httponly = true;
        setcookie('token', $token, $expire, $path, $domain, $secure, $httponly);
        $_SESSION['token'] = $token;
        $_COOKIE['token'] = $token;
    }

    $sessid = $objCookie->getCookie('token');
    if ($_SESSION['token'] != $sessid) {
        session_regenerate_id();
        session_destroy();
    }
}

function getToken() {
    return sha1(uniqid(rand(), true));
}
```

With this, even though the session_id issued over HTTP does not have the Secure attribute,
I've put measures in place to prevent information leakage under HTTPS communication.

That's all.
