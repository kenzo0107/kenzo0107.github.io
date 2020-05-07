---
layout: post
title: Mac OS X に wget インストール
date: 2014-06-18
tags:
- wget
---

ターミナルから以下実行


### curlコマンドで圧縮されたwgetモジュール（wget-x.x.x.tar.gz）をダウンロードする。
curl -Oオプション 出力をオリジナルのシステムと同名のファイルに保存する

```sh
sudo curl -O http://ftp.gnu.org/pub/gnu/wget/wget-1.13.4.tar.gz
```

### 解凍

```sh
sudo tar zxvf wget-1.13.4.tar.gz
```

### ディレクトリ内へ移動

```sh
cd wget-1.13.4
```


### Makefileを作成

Makefile ... インストール対象となるシステム特有の機能／情報のチェック状況を記述している

```sh
sudo ./configure –with-ssl=openssl
```

--with-ssl=openssl
のオプションを付けないと以下のようなエラーが出てインストールできない
configure: error: --with-ssl was given, but GNUTLS is not available.


### Makefileを元にソースファイルのコンパイル

```sh
sudo make
```

### インストール

```sh
sudo make install
```



試しに以下実行して、「index.html」がDLされていればOK !

```sh
wget http://yahoo.co.jp
```
