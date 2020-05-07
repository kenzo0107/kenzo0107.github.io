---
layout: post
title: Clam AntiVirus 導入
date: 2016-02-23
tags:
- Security
- AntiVirus
---

## Clam Antivirus

略称ClamAV はUnix系OSで動作するウィルススキャンOSSです。

[http://www.clamav.net](http://www.clamav.net)

[wiki - Clam_AntiVirus](https://ja.wikipedia.org/wiki/Clam_AntiVirus)

個人的にさくらVPSを借りて
ミドルウェア入れて動作確認していたら
気づくとDos攻撃を受けて「サーバ停止します」と連絡が来て
焦ったことがあり、導入した経緯があります。

## 導入手順

以下2つの方法どちらでも良いです。
yum 経由の方が起動スクリプト付きで
パスに配置してくれるので導入が安易です。

- yum 経由

```
# yum install clamav clamav-update
```

- ソースからbuild

```
# cd /usr/local/src
# wget http://www.clamav.net/downloads/production/clamav-0.99.tar.gz
# tar zxf clamav-0.99.tar.gz
# cd clamav-0.99
# ./configure --enable-milter
# make
# make install
```

## 設定ファイル更新

/etc/clamd.conf

```
// 定義ファイル更新 User clalmのコメントアウトを外す
# sed -i 's/^User\s\+clam$/#\0/' /etc/clamd.conf

// 設定更新
# freshclam
```

## 起動設定

```
// 起動
# service clamd start

// 自動起動設定
# chkconfig clamd on
```

## 実行確認

```
# clamscan --infected --remove --recursive

----------- SCAN SUMMARY -----------
Known viruses: 4269611
Engine version: 0.99
Scanned directories: 2
Scanned files: 8
Infected files: 0
Data scanned: 0.20 MB
Data read: 0.10 MB (ratio 1.92:1)
Time: 10.934 sec (0 m 10 s)
```

| *Option*    | *Explain*                          |
| ----------- | ---------------------------------- |
| --infected  | ウィルス感染されたファイルのみ表示 |
| --remove    | ウィルス感染されたファイルを削除   |
| --recursive | サブディレクトリを再帰的に検査     |

各option は `clamscan -h` で確認できます。

## 但し

あくまでウィルススキャンツールを導入しただけであって
日進月歩の技術で侵入されないとは限らない為
セキュリティは常に動向に注意しましょう。
