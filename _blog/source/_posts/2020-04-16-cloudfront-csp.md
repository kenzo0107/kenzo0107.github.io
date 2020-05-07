---
title: Lambda Edge で Basic 認証 や CSP 対応
tags:
- AWS
- Lambda
date: 2020-04-16
thumbnail: https://docs.aws.amazon.com/ja_jp/AmazonCloudFront/latest/DeveloperGuide/images/cloudfront-events-that-trigger-lambda-functions.png
---

Basic 認証 や CSP 対応を Lambda Edge で対応した話です。

<!-- more -->

## CSP とは？

* XSS, Data Injection の様な特定種類の攻撃を検知し、影響を軽減する為に追加できるセキュリティレイヤー

参考: [コンテンツセキュリティポリシー (CSP)](https://developer.mozilla.org/ja/docs/Web/HTTP/CSP)

## どんなことができる？

コンテンツを特定のドメインやプロトコルでのみ実行可能な様に制約をかけることができる。
これによって、意図しない通信ができなくなる。

## どうすれば設定できる？

### ヘッダーに情報追加

HTTP ヘッダーに Content-Security-Policy : policy で設定

### <meta> 要素を用いてポリシー指定

```
<meta http-equiv="Content-Security-Policy" content=" policy ">
```

## Lambda Edge でやる理由

```
CloudFront --> ALB --> ECS - Rails
```

普段、上記の構成でサービスしてることが多く、
CloudFront がオリジンとなる Rails からのレスポンス（Origin Response）のヘッダー情報に CSP policy を設定することで、CSP 対策をしようと試みました。

Rails 自体で設定する方法もありますが、後述します。

## terraform で設定してみる

https://github.com/kenzo0107/sample-lambda-edge

* templates/csp.js
  * CSP 対策 を Original Response に設定
* templates/basic_auth.js
  * Basic 認証を Vewer Request に設定

## 実際設定してみてどう？

Rails でフロントに Vue を使用している場合に `script-src 'unsafe-eval'` の指定が必要だったりで、フロント全然動かない、なんてことありました。

使用しているサードパーティやフロントエンドで CSP の設定で問題が生じることが多々ありました。

これは Rails 側で設定しないと開発環境では動いたけど、Lambda Edge 効いてる環境だと動かない、ということがありそうで Lambda Edge でできるにはできるが、アプリケーション側に任せる方が良いのでは？
と思いました。



## 参考

[MDN web docs - Content-Security-Policy](https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/Content-Security-Policy)
