---
layout: post
title: MacOSX+Vagrant (CentOS7)にSenrtyをインストールして動作確認するまで
date: 2015-04-11
---

## 概要

https://sentry.readthedocs.org/en/latest/quickstart/


## 環境

- MacOS 10.10.2 Yosemite
- Vagrant 1.6.5
- Virtual Box 4.3.20 r96996
- CentOS 7.1.1503 (Core)
- Python 2.7.5 (pip 6.0.8)
- Redis 3.0.0
- MySQL 5.6
- NginX 1.6.2


## 事前準備

Sentry公式サイトには、以下セットアップをしておくようにと書いてあります。

- Python2.7
- python-setuptools, python-pip, python-dev, libxslt1-dev, libxml2-dev, libz-dev, libffi-dev, libssl-dev
- DB (PostgreSQL:推奨 or MySQL) => MySQL採用します
- Redis
- NginX

Sentry公式サイトでは、
OSはUbuntuで試験しておりますが
上記環境にてCentOSでも動作確認が取れております。


### VagrantにCentOS7 boxイメージを追加/起動/SSH接続
※IPをvagrantfileのデフォルト「192.168.33.10」と設定します。

{% gist kenzo0107/a671f5f5bf628cc4a963 %}

### pip インストール

{% gist kenzo0107/1524267337a7b1f2a478 %}

※ pipで各種モジュールインストール時のエラー対処 [command 'gcc' failed with exit status 1]

{% gist kenzo0107/f204c7af2b764d15a6c6 %}



### Redis インストール

{% gist kenzo0107/6f4475e8a161cf9c8f9f %}


### MySQLインストール

{% gist kenzo0107/94509f453f2d49fc2500 %}


### Sentry用にMySQL初期設定

{% gist kenzo0107/427c9c31fad07e8e8e76 %}



### NginXインストール/firewall http通信許可設定

{% gist kenzo0107/f779db05456c5b9f3d98 %}


### NginX /etc/nginx/conf.d/default.conf Sentry用設定

{% gist kenzo0107/3a865cab9e69ceaa5187 %}




## 手順

### Sentry インストール/起動

{% gist kenzo0107/c1ee50b121dd0a8f6d4f %}

### celery起動

{% gist kenzo0107/d29b9a730520c6e04e39 %}


celeryインストールされていなければ以下でインストール実行
```
pip install celery
```

### URLアクセス
http://192.168.33.10 へアクセス

ログインページが表示されます。

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150409/20150409112616.png)




以下、ロギングに必要なことを実施していきます。
- ログインアカウント
- チーム作成
- プロジェクト作成
- ロギング


### ログインしてください。
※アカウントがなければ「新しいアカウントを作成」リンクから作成してください

### チーム作成

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150409/20150409113751.png)

### プロジェクト作成

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150409/20150409114037.png)

新規プロジェクトが作成されました。

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150409/20150409114415.png)

「Go It !」ボタンをクリックすると作成したプロジェクトページへ遷移します。

### プロジェクトページの「設定」タブをクリック

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150411/20150411020105.png)



## 実際にログを送信してみます。

### APIキーを確認します。左メニューの「APIキー」リンクをクリック

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150411/20150411020922.png)

Defaultキーをコピー

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150411/20150411021820.png)


### テスト送信
MacOSX Terminalから以下実行
ravenで非同期送信します。

```
raven test (コピーしたDefault APIキー)
```

ravenをインストールしてなければ以下のようにbrewでインストールしてください。

{% gist kenzo0107/f9de3b92e9635c83f0d0 %}



### ストリームタブにてイベントが追加されたことがわかります。

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150411/20150411022906.png)






## PHPからログを投げてみる。

実施方法が記載されているので確認します。

### 設定タブをクリックした後、「Setup & Installation」をクリック

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150411/20150411023142.png)

### PHPアイコンをクリック

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150411/20150411023448.png)


MacOSローカルにて
raven-phpをgitから落としセットアップします。
```
git clone https://github.com/getsentry/raven-php
cd raven-php/
```

新規ファイル「t.php」を作成

* t.php

{% gist kenzo0107/b62bc3ef9785511d5a27 %}

t.php実行
```
php t.php
```

以下のようにPHPからもSentryへ投げたログを確認することが可能です。

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150411/20150411024245.png)

Python, Goからもログを投げることができます。
是非試してみてください。

以上
