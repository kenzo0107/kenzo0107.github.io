---
layout: post
title: WAF+CloudFront でリファラチェック (直リンク禁止)
date: 2017-10-08
tags:
  - AWS
  - WAF
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005180531.png
---

## 概要

AWS WAF (Web Application Firewall) を利用し Cloudfront でのリファラ制御を実装しましたのでそのまとめです。

直リンク禁止対策として導入しました。

以下手順になります。

### Go to AWS WAF ボタンクリック

サービス > WAF & Shield と辿り Go to AWS WAF クリック

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005174955.png" width="100%">
</div>

### Configure Web ACL ボタンクリック

ACL (Access Control List) を設定していきます。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005180856.png" width="100%">
</div>

### 概要確認

特にチェックせず Next ボタンクリック

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005181044.png" width="100%">
</div>

### web ACL 設定

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005181315.png" width="100%">
</div>

以下、設定項目を設定し、Next ボタンクリック

| _Item_                    | _Value_                                                                                  |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| Web ACL name              | (任意) 例では Cloudfront の CNAME を設定しています。                                     |
| CloudWatch metric name    | Web ACL name を入力すると自動で入力される。変更したい場合のみ変更                        |
| Region                    | Global(CloudFront) 選択                                                                  |
| AWS resource to associate | 対象となる Cloudfront を選択する箇所。運用中の Cloudfront を対象とすると場合は後々設定。 |

### 条件作成

今回は文字列一致を条件とする為、 String match conditions にて `Create condition` ボタンクリック

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005181800.png" width="100%">
</div>

### string match condition 作成

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005181926.png" width="100%">
</div>

以下設定し `Add filter` ボタンクリック。
複数 filter がある場合、Add filter を繰り返します。

| _Item_                           | _Value_                |
| -------------------------------- | ---------------------- |
| Name                             | (任意)                 |
| Part of the request to filter on | Header                 |
| Header                           | Referer                |
| Match type                       | Contains               |
| Transformation                   | Convert to lowercase   |
| Value to match                   | 対象となるドメイン設定 |

<br/>

#### `Add filter` 後、 `Create` ボタンクリック。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005182327.png" width="100%">
</div>

#### Next ボタンクリック

追加したもののすぐに反映されていない。
そのまま `Next` ボタンクリック

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005182446.png" width="100%">
</div>

### ルール作成

`Create rule` ボタンクリック。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005182608.png" width="100%">
</div>

#### ルールに条件を紐付け

Name, Cloudwatch metric name を設定し
Add conditions で条件を追加します。

その後、`Create` ボタンクリック。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005182641.png" width="100%">
</div>

### ルール以外のリクエストのアクセス禁止

やはり Rule は反映されていない。ですが、続けて
`Block all requests that don't match any rules` をチェックし `Review and create` ボタンクリック。

※対象の Cloudfront に反映させたくない場合は、Cloudfront を選択したリソースを解除する必要があります。
<span style="color: #ff0000">※最後に関連付けができるのでここではするべきではないと思います。</span>

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005182806.png" width="100%">
</div>

### 確認ページで入力内容確認後作成

`Confirm and create` ボタンクリック。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005183423.png" width="100%">
</div>

### 対象の web ACL を編集

WEB ACLs より選択し `Edit web ACL` ボタンクリック

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005183628.png" width="100%">
</div>

#### web ACL 編集

1. 作成したルールを選択
2. `Add rule to web ACL` ボタンクリック
3. Allow 選択
4. `Update` ボタンクリック

[f:id:kenzo0107:20171005183720p:plain]

### Cloudfront 関連付け

`Add association` ボタンクリック

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005183720.png" width="100%">
</div>

#### Web ACL に Cloudfront を関連付け

Resource で 対象の Cloudfront を選択し `Add` ボタンクリック

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005184119.png" width="100%">
</div>

以上で数分後 WAF+CloudFront によるリファラチェックが確認できる状態になります。

### アクセス確認

自環境では
ローカルの /etc/hosts 修正し対象ドメインから Cloudfront CNAME へのリンクを貼って確認しました。

Cloudfront CNAME ドメインでのリソースを直接アクセスすると
以下の様な エラーページが表示されることが確認できました。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20171005/20171005184505.png" width="100%">
</div>

### もう少しユーザフレンドリーに

上記のエラーページは Cloudfront > Error Pages で `Create Custom Error Response` で S3 上のパスを指定することでカスタマイズが可能です。

是非サイトコンセプトに合ったエラーページをご用意されるとよりユーザフレンドリーな配信になるかと思います。

以上
ご参考になれば幸いです。
