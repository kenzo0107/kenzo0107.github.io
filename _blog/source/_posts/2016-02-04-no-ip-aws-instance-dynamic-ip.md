---
layout: post
title: no-ipでAWSインスタンスの動的ip更新対応 ~いつも同じドメイン名でアクセスしたい~
date: 2016-02-04
tags:
- AWS
- no-ip
---

## 概要

AWSの起動停止をするとElasticIPを設定していない限り
Public IPが変更されてしまいます。

ElasticIPは設定するとAWSを停止していても費用が発生します。

検証用環境など一時的に利用するインスタンスについて
起動時にIPが変更したことを関係者に周知するなどの手間が掛かります。

その為No-IPを利用しドメインを固定しIP変更に対応するようにしました。

No-IPは無料のドメインサービスで動的IP変更を検知するLinux用モジュールも配布しています。

## 環境
- Amazon Linux AMI release 2015.09
- noip 2.1.9


## 手順

まずnoipサイトで会員登録し利用したいドメインを登録します。
ipはとりあえず適当で良いです。

[http://www.noip.com/](http://www.noip.com/)



```
// rootユーザで実行
$ sudo su
# cd /usr/local/src

// noipモジュール
# wget http://www.no-ip.com/client/linux/noip-duc-linux.tar.gz
# tar xzf noip-duc-linux.tar.gz
# cd noip-2.1.9
# make
# make install

// 起動スクリプト作成
# cp redhat.noip.sh /etc/init.d/noip
# chmod 755 /etc/init.d/noip

// 起動設定
# /sbin/chkconfig noip on

// 起動
# /etc/init.d/noip start
```

起動後、no-ipのコンソール上で指定ドメインのIPが
1分もしない程度で切り替わっていることが確認できます。

## 今後

No-IPはMicroSoftによりマルウェアの温床となっておりユーザを保護すべく
22のNO-IPドメイン差し止めを連邦裁判所に申し立て、受理されましたが

No-IP側としては相談していただければ対応もできた、とし申し立て後
対応し随時ドメインの復活を果たしています。

ある程度セキュリティを加味して利用する必要がありますね。
今の所、AWSのセキュリティグループで特に外部アクセスはなく
問題なく動作しています。


また、
以下のようなGREEさんの記事がありました。

[AWS EC2 での最強の Public IP 取得方法](https://labs.gree.jp/blog/2016/02/15825/)

内部関係者に聞いてみたいと思います。

===追記===

GREEさんの記事の件、内部関係者に聞いた所ubuntuのみで利用しているそうです。
