---
layout: post
title: http https 混在サイトでの Cookie Secure 属性の扱い方
date: 2016-08-10
tags:
  - .htaccess
  - PHP
  - Cookie
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160810/20160810114001.jpg
---

## 問題提起

https 通信環境下で Cookie に Secure 属性つけていますか？

<!-- more -->

## Secure 属性とは？

http と https と各通信で相互の行き来がある場合などに
https の通信でのみ使うべき Cookie の値が
http の通信に流出するおそれがあります。

それを防ぐ為に Cookie に secure 属性を付けて
https 通信でのみ扱えるようにするという対策があります。

## 実例

PHP の場合を扱おうと思ったので
お世話になってる [メルカリ](https://www.mercari.com)さんを参照します。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160810/20160810102752.png" width="100%">
</div>

Chrome の Developer Tool で Secure 項目 確認すると
チェックがついているのがわかります。

PHPSESSID は php.ini の session.name で設定されている
session_id の名前です。

```php
$ php -i | grep php.ini
<path to php.ini>/php.ini

$ grep 'session.name =' <path to php.ini>/php.ini
session.name = PHPSESSID
```

## 常時 https 通信だったら

- secure 属性を常に設定するようにします。

#### session_id 発行例

[session_set_cookie_params](http://php.net/manual/ja/function.session-set-cookie-params.php) 関数を用いて設定

```php
$secure = true;
$httponly = true;
session_set_cookie_params($lifetime, $path, DOMAIN_NAME, $secure, $httponly);
session_start();
```

- HttpOnly を true とすると クライアントサイド Javascript からの Cookie 取得不可となり [XSS](https://www.websec-room.com/2013/03/14/550) 対策の一環となります。

#### cookie 発行例

```php
$secure = true;
$httponly = true;
setcookie($key, $val, $expire, $path, DOMAIN_NAME, $secure, $httponly);
```

## http https 混在していたら

この場合に遭遇しました。
よくショッピングサイトなどでは以下 http https が混在するケースが
見受けられます。

- 商品一覧ページ .... http
- 決済情報入力ページ ... https

こういった場合の Cookie Secure 属性の扱い方を検討してみました。

### 対策 1

- http 用 (PHPSESSID):secure 属性なし と https 用 (例: SPHPSESSID): secure 属性あり で 2 つ cookie を発行する

### 対策 2

- PHPSESSID は http https 共通の secure 属性なし cookie を発行する
- https 通信時に secure 属性付き token を発行し発行した token をチェック。
  不整合が起きた場合は、session_id を書き換え、session の内容を破棄する。

上記 対策 1 では http,https 用の session_id の紐付けの管理がしにくい為
対策 2 について実装しました。

#### 対策 2 実装例

- session_id が発行されていない場合(初回アクセス時)、secure 属性なしの session_id (PHPSESSID) 発行
- https 通信時は session に token がない場合、secure 属性付き token cookie を発行。 session にも token を保存
- session と cookie にある token 情報を突き合わせて一致しない場合、 session_id を変更し session 内部を破棄

あえてわかりやすく冗長な書き方してます。
domain, path, secure 等は 環境ごとに define するなりしてください。

```php
$domain = 'www.example.jp';
$path = "/";

if (session_id() === "") {
    $secure = false;
    $httponly = true;
    session_set_cookie_params(0, $path, $domain, $secure, $httponly);
    if (!ini_get("session.auto_start")) {
        // セッション開始
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

これで http で発行される session_id は secure 属性がなくとも
https 通信下での情報流出防止策をとりました。

以上です。
