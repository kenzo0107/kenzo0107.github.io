---
title: Raspberry PI zero で CO2 濃度測定 & アラートを LINE 通知
date: 2022-01-05
thumbnail: https://i.imgur.com/2ZRGb84.jpeg
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->


リモートワークで部屋に閉じこもることが増え、何気ない眠気に襲われることがあり
部屋の CO2 濃度を調査すべく、Raspberry PI で計測しました。

## 設計図

![](https://i.imgur.com/Bo79WIv.png)

ブレッドボードを使わず、ピンに直で結線しています。


### 要点

* MH-Z19
    - 二酸化炭素濃度を測定します。
* モニター
    - リアルタイムの最新の二酸化炭素濃度を把握できるようにします。
* Raspberry PI
    - MH-Z19 で測定した二酸化炭素濃度を Mackerel にプロットします。
* Mackerel
  * CO2 濃度を閾値を指定しそれを超えると LINE に通知する様にします。

## プロット先を Mackerel にした理由

自前サーバを Raspberry PI に立てても良いかなと思いましたが、CO2濃度が閾値を超えると発火させたかったので
その辺まで面倒を見たくないなという気持ちから避けました。

Prometheus を以前実装しましたが、その管理をしたくなく、
Raspberry PI のリソースを使わない為にも外部にしたかったです。

尚、 Datadog は Raspberry PI 用の Agent は明確にサポートしておらず、近しい Agent タイプを利用する必要があります。
ですが、何度も失敗しサポートに問い合わせたところ、ログ送って欲しいとなって面倒になってしまいました。

そこゆくとインストールが簡単、監視とカスタムメトリクス、アラート設定まで無料で事足りてしまう Mackerel が心強く、採用に至りました。

念の為、 Mackerel の回し者ではないことは断言しておきます。

## 事前に購入したもの

* Raspberry PI zero W
  * 特に種類は問わずです。pico もそのうち試したい！

{% affiliate "Raspberry PI zero W" "//ws-fe.amazon-adsystem.com/widgets/q?_encoding=UTF8&MarketPlace=JP&ASIN=B07BHMRTTY&ServiceVersion=20070822&ID=AsinImage&WS=1&Format=_SL250_&tag=kenzo0107-22" "https://www.amazon.co.jp/gp/search/ref=as_li_qf_sp_sr_tl?ie=UTF8&tag=kenzo0107-22&keywords=Raspberry PI Zero W&index=aps&camp=247&creative=1211&linkCode=ur2&linkId=10ed550c0ddab27cc54bb5eb6b39dcff" "https://hb.afl.rakuten.co.jp/ichiba/23166659.8ed3e37c.2316665a.b61e268d/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fmcpjapan%2Fv_35027215483031%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9" %}


* MH-Z19C
  * CO2 濃度測定モジュールです。
  * Raspberry PI や Arduino と接続でき利用できます。

{% affiliate "MH-Z19C CO2センサー" "//ws-fe.amazon-adsystem.com/widgets/q?_encoding=UTF8&MarketPlace=JP&ASIN=B08SJCWKKG&ServiceVersion=20070822&ID=AsinImage&WS=1&Format=_SL250_&tag=kenzo0107-22" "https://www.amazon.co.jp/gp/product/B08SJCWKKG/ref=as_li_tl?ie=UTF8&camp=247&creative=1211&creativeASIN=B08SJCWKKG&linkCode=as2&tag=kenzo0107-22&linkId=79d332385d6654819c0b1e2ea67bdce1" "https://hb.afl.rakuten.co.jp/ichiba/23164c18.232f3273.23164c19.8af94ae3/_RTLink33687?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fhandicraft-shop%2F73015987%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9" %}


* ジャンパーワイヤー
  * 数本利用するのみですが、今後も利用する可能性が高そうであれば、買っといて損なしです。

{% affiliate "ブレッドボード・ジャンパーワイヤー（メス-メス）（20cm）40本" "//ws-fe.amazon-adsystem.com/widgets/q?_encoding=UTF8&MarketPlace=JP&ASIN=B01A4DDUTA&ServiceVersion=20070822&ID=AsinImage&WS=1&Format=_SL250_&tag=kenzo0107-22" "https://www.amazon.co.jp/gp/offer-listing/B01A4DDUTA/ref=as_li_tl?ie=UTF8&camp=247&creative=1211&creativeASIN=B01A4DDUTA&linkCode=am2&tag=kenzo0107-22&linkId=528edbec8635eb89b1d831aefcc81cab" "https://hb.afl.rakuten.co.jp/ichiba/23166baf.c1f701ce.23166bb0.221d0595/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Falt-mart%2Fb01a4dduta%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9" %}

* 0.91インチ128 * 32 OLEDディスプレイ

{% affiliate "0.91インチ128 * 32 OLEDディスプレイ" "//ws-fe.amazon-adsystem.com/widgets/q?_encoding=UTF8&MarketPlace=JP&ASIN=B09FZ3H9FT&ServiceVersion=20070822&ID=AsinImage&WS=1&Format=_SL250_&tag=kenzo0107-22" "https://www.amazon.co.jp/gp/product/B09FZ3H9FT/ref=as_li_tl?ie=UTF8&camp=247&creative=1211&creativeASIN=B09FZ3H9FT&linkCode=as2&tag=kenzo0107-22&linkId=aa2d68eafbc16fe55422cf61c323960a" "https://hb.afl.rakuten.co.jp/ichiba/23167b1d.a5b7d2a9.23167b1e.46e4f5d4/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Ftanabata77%2F4945318808923%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9" %}


### 価格について

amazon や楽天のリンク貼りましたが、
[秋月電子通商](https://akizukidenshi.com/)や[スイッチサイエンス](https://www.switch-science.com/)の方が
安いかもしれないです。
時勢によるかと思いますが、専門店の方が安く購入できる印象があります。

安さを求めるなら海外サイトで配送まで時間がかかる可能性がありますが [ebay](https://www.ebay.com/) も良いです。

実際に MH-Z19C は ebay で購入しましたが、届くまで1ヶ月くらい掛かりましたが、特に問題なく利用できています。



## Raspberry PI OS

```
$ cat /etc/issue
Raspbian GNU/Linux 10 \n \l
```

OS インストールは省略します。

## Ansible で設定

https://github.com/kenzo0107/raspi-ansible を clone いただき
ご利用いただければ設定できます。

* raspberrypi.yml の nodejs は今回利用しないので削除しても構いません。
* mackerel api key を秘匿情報として管理していますので更新してください。
  https://github.com/kenzo0107/raspi-ansible/blob/master/roles/monitoring/vars/secret.yml

```
mackerel_apikey=xxxx
```

### 各 Role について

今回のメインである機能について補足しておきます。

* monitoring: mackerel agent インストールし起動
* co2sensor: 主に MH-Z19 からデータ取得する設定
  * MH-Z19 からデータ取得する為に UART を有効化しシリアル通信できる様にします。
  * I2C はデフォルトで有効化されていた為、Ansible の設定に含んでいません。
    * もし有効化されていない様であれば `/boot/confit.txt` に `dtparam=i2c_arm=on` 追記してください。
  * python モジュール mh_z19 インストールし、 CO2 濃度を python モジュールで取得できる様にする
  * mackerel-agent に CO2 濃度値をカスタムメトリクスでプロットする設定追加
* co2lcd: OLED ディスプレイに CO2 濃度を表示する設定
  * ディスプレイに表示するためのモジュールをインストール
  * ディスプレイにCO2濃度表示する python スクリプトを追加
  * 上記スクリプトを systemd 登録し daemon 化
    * スクリプトは MH-Z19 の値が変更された場合のみディプレイへの表示更新を実施するようにしています。


## Mackerel のカスタムメトリクス


![](https://i.imgur.com/CbRXCGy.png)

無料版なので1日だけのメトリクス保存となりますが、
おおよそ一日の動きがわかれば特段問題はないです。

季節性や数日間の比較が見たくなったらアップグレードを検討します。

## Mackerel 監視ルールの設定

![](https://i.imgur.com/Bh4MQB0.png)

`cusotm.co2.raspberrypi` というカスタムメトリクス名は
https://github.com/kenzo0107/raspi-ansible/blob/master/roles/co2sensor/files/mackerel-co2monitoring.sh#L3 でメトリクス名を `co2.raspberrypi` としている為です。

以下の様にしました。

* warn > 1200 ppm
* critical > 1500 ppm

### 工夫点

![](https://i.imgur.com/gIuM093.png)

一時的な上昇で通知するとノイズとなるアラートが多かった為、5回連続発生した場合のみとしました。

たまたま深いため息を MH-Z19 に吹きかけてアラートが発火してしまったことがあった為です。

ため息したらCRITICALと教えられる様なディストピアは頂けません。

## Mackerel アラート通知先設定

Mackerel は様々なプラットフォームをサポートしており、 LINE 通知を採用しました。

![](https://i.imgur.com/luBn2aV.png)


## 総評

シリアル通信や I2C という聞き慣れない箇所は以下の本でラジコンを作ってたので割とすっと入れました。

Raspberry PI で電子工作を始める初学者にとってうってつけの良書です。

{% affiliate "Raspberry PI で学ぶ電子工作" "//ws-fe.amazon-adsystem.com/widgets/q?_encoding=UTF8&MarketPlace=JP&ASIN=4065193397&ServiceVersion=20070822&ID=AsinImage&WS=1&Format=_SL250_&tag=kenzo0107-22" "https://www.amazon.co.jp/gp/product/4065193397/ref=as_li_tl?ie=UTF8&camp=247&creative=1211&creativeASIN=4065193397&linkCode=as2&tag=kenzo0107-22&linkId=dcd4829e702d3caacbaf3ea349deb358" "https://hb.afl.rakuten.co.jp/ichiba/22ed78a4.becc60fe.22ed78a5.6784b34a/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Frakutenkobo-ebooks%2F5cdcee1da3fd31b8b1de30dd3b8b80f1%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9" %}

ジャンパワイヤーが剥き出しで子供が触って外れることもある為、ケースも自作してみようと思います♪

以上、参考になれば幸いです。
