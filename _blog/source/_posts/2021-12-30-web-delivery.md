---
title: no-cache, no-store の違い
date: 2021-12-30
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

キャッシュ関連のディレクティブは多々ありますが、
その中で間違えやすい no-cache, no-store を取り上げます。

## no-cache の仕組み

**<font color="red">「キャッシュしない」ではない！</font>**
キャッシュが有効期限内であっても毎回キャッシュが最新かどうか検証します。

タワレコよろしく、
No Validation, No Cache
と覚えましょう。

![](https://i.imgur.com/c3MFmbk.png)



### 使い所

更新のあるコンテンツに対して、更新に追随しつつもキャッシュを利用したい場合に有効です。

### 利用時の注意点

ブラウザバック時に `(disk cache)` が返ってしまい、コンテンツが更新されない場合があります。

参考: [Chrome の Back button を押した際に「意図しない Cache」が利用されて、期待と違うページが表示される問題について調査した](https://south37.hatenablog.com/entry/2021/01/11/Chrome_%E3%81%AE_Back_button_%E3%82%92%E6%8A%BC%E3%81%97%E3%81%9F%E9%9A%9B%E3%81%AB%E3%80%8C%E6%84%8F%E5%9B%B3%E3%81%97%E3%81%AA%E3%81%84_Cache%E3%80%8D%E3%81%8C%E5%88%A9%E7%94%A8%E3%81%95%E3%82%8C)

サポートするブラウザの仕様によって意図しない挙動をする場合があるので、その場合はキャッシュをそもそもさせない no-store が対策の一手。

## no-store

キャッシュを保存せず、毎回 Origin にリクエストします。

![](https://i.imgur.com/QmQK5Q5.png)

### 使い所

その命名である「no-store = ストアしない」という意味合いから
キャッシュストレージの容量を奪わない様にする場合に利用します。

CloudFront 等 CDN サービスではキャッシュストレージ容量への懸念が小さいですが、
CDN を DIY するときにはストレージ容量は有限なので懸念がある為です。

### 厳密にキャッシュさせたくない場合

```
Cache-Control: private, no-store, no-cache, must-revalidate
```

* private: Proxy や CDN の経路上のキャッシュをしない
* no-store: キャッシュを保存しない
* no-cache: 再検証なしではキャッシュしない
* must-revalidate: キャッシュ期限切れ時に再検証を強制
    * Stale (期限切れ) キャッシュを利用させない
    * Origin がダウンしていたら 504 Gateway Timeout を返す
    * max-age, no-cache と共存不可

### 手厚い防御をしている理由

Proxy, CDN の互換性を軽減する為です。


## 総評

キャッシュの設定を細かく制御する際は
ブラウザ, Proxy, CDN の互換性を勘案し
検証を細かく実施する必要があることがわかりました。

テストをどの様に行うか、開発時の本番環境の再現性をどうするか等考えることが多い。



## 参考

{% affiliate "Web配信の技術―HTTPキャッシュ・リバースプロキシ・CDNを活用する" "https://ws-fe.amazon-adsystem.com/widgets/q?_encoding=UTF8&MarketPlace=JP&ASIN=B08VJ3YZK1&ServiceVersion=20070822&ID=AsinImage&WS=1&Format=_SL250_&tag=kenzo0107-22" "https://www.amazon.co.jp/gp/product/B08VJ3YZK1/ref=as_li_qf_asin_il_tl?ie=UTF8&tag=kenzo0107-22&creative=1211&linkCode=as2&creativeASIN=B08VJ3YZK1&linkId=7da56da317e5d9bae2ca07a9333b9f76" "https://hb.afl.rakuten.co.jp/ichiba/22ed78a4.becc60fe.22ed78a5.6784b34a/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Frakutenkobo-ebooks%2F5c1f7f52096c39a0a0a12d0d55bd600f%2F&link_type=picttext&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJwaWN0dGV4dCIsInNpemUiOiIyNDB4MjQwIiwibmFtIjoxLCJuYW1wIjoicmlnaHQiLCJjb20iOjEsImNvbXAiOiJkb3duIiwicHJpY2UiOjEsImJvciI6MSwiY29sIjoxLCJiYnRuIjoxLCJwcm9kIjowLCJhbXAiOmZhbHNlfQ%3D%3D" %}


同僚に勧められた本！

Web における配信の最適化・高速化について解説いただいてます。

自分自身が AWS CloudFront 使っていた程度でしたが
Varnish の設定がそもそも分かりやすく記述されており
入りやすかったです。

キャッシュに対しての理解が非常に深まりました。

この場を借りて感謝申し上げます。
