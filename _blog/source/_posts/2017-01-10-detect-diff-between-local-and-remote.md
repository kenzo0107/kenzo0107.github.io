---
layout: post
title: リモートサーバとローカルサーバとの差分のあるファイル情報を取得するツール作ってみた
date: 2017-01-10
category: Go
tags:
  - Go
cover: http://i.imgur.com/4tGwrRf.png
---

## 概要

リモートサーバとローカルサーバとの差分のあるファイル情報を取得するツールを Golang で作成しました。

{% linkPreview https://github.com/kenzo0107/diffrelo _blank %}

## どんなツールか 3 行まとめ

1. ローカルワークスペースを元にリモートサーバからディレクトリと拡張子指定し実行ディレクトリ上にファイルをダウンロード
2. ローカルのワークスペースから実行ディレクトリ上にファイルをコピー
3. 1,2 で取得したファイルから差分をチェック

## 利用想定ケース

- リモートファイルサーバとローカルワークスペースの同期状況が不明瞭である場合

この 1 点のみです。
整備されたデプロイ環境では発生しにくいケースです。

ですが意外と多いです。

<div style="text-align:center;">
<img src="http://i.imgur.com/HqjRw7c.png" width="100%">
</div>

それはこんなケース

- 担当者が退職して引き継がれていない (>\_<)
- ちょっとしたツールだし Git 管理してなかった (>\_<)
- 別の業者さんがサーバにアクセスでき、勝手に編集することがある (>\_<)

上記のケースに当たる案件にたまたま担当してしまって
デグレった、バグったとならない為に個人的に作ってました。

## 補足

デフォルトの対象拡張子は php,tpl,js,css,html を対象としています。
会社で PHP プロジェクトを扱うことが多いので m(\_ \_)m

## あとがき

元々 Python で書いてましたが Go にしたところ
4~5 倍程度パフォーマンスアップしました！

並行処理についても
Python も [multiprocessing](http://docs.python.jp/2/library/multiprocessing.html) がありますが
書き易さは Go かなと思いました。

## ちなみに

実装に当たってこちら拝読させていただきました。
基礎的な Go 言語の構文や環境構築、
Semaphore を意識した設計はとても参考になりました。
