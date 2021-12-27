---
layout: post
title: 'Python エラー対処： PowmInsecureWarning: Not using mpz_powm_sec.  You should rebuild using libgmp >= 5 to avoid timing attack vulnerability.   _warn("Not using mpz_powm_sec.  You should rebuild using libgmp >= 5 to avoid timing attack vulnerability.", PowmInsec'
date: 2015-02-17
---


## 概要

pysftp利用としたらgmp5以上にしてくれと怒られている。

pysftpを利用するのに必要なparamiko、
そのparamikoに必要なpycryptoがエラー出力している。

## ToDo

gmp5 インストール
python リビルド
pycrypto アンインストール&インストール

## 手順

{% gist kenzo0107/7ff8994a65c7a97bf52a %}

以上
