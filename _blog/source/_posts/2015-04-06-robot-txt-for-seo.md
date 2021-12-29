---
layout: post
title: robots.txtを配置してsitemap.xmlを読み込ませSEO効率を上げる
date: 2015-04-06
---

## 概要

SEO対応としてリリース時にやっておきたいことの1つです。
検索エンジンのクローラーに読み込ませたいファイルを指定することで
SEO効率を上げます。


## 前提
サイトリリース可能な状態にある、
または、リリース可能にほぼほぼ近い状態にあること。

リリース直前・直後くらいに実施する作業という認識です。


## 各ファイルの概要

### robots.txt

robots.txt とは、goo、Google、Lycos などのロボット型検索エンジンに対する命令を記述するためのファイルです。


### sitemap.xml

sitemap.xmlはXML形式でURLやタイトルなどの各ページの情報を記載したファイルです。


## 手順

### sitemap.xml作成

以下sitemap generatorで作成可能です。

http://tafcue.com/xml_sitemap-convenient_tools/xml_sitemap_tools001/

※不必要なURLがある場合は削除したり、追加したいURLは自分で編集する必要があります。


例) 詳細ページが様々なURLで表示している場合

検索エンジンにとって１つのコンテンツに対してユニークなURLとなることが望ましいです。

以下いずれも同一ページ内容となる場合、1つのページが様々なURL表記となり、よろしくないです。

* http://hogehoge.com/products/detail.php?product_id=100
* http://hogehoge.com/products/detail.php?product_id=100&name=ProductName
* http://hogehoge.com/products/detail.php?product_id=100&category_id=10

上記のような場合があるときは1つに絞ってください。


### ドキュメントルートにsitemap.xmlを配置します。


* /path/to/DocumentRoot/sitemap.xml

### ドキュメントルートに以下のように記載したrobots.txtを配置します。

* /path/to/DocumentRoot/robots.txt

{% gist kenzo0107/222a16207d9530a64749 %}


以上で検索エンジンのクローラーにsitemap.xmlを読み込ませるように設定ができました。


## 確認方法

GoogleWebMaster Toolで設定状況を確認することができます。

https://www.google.com/webmasters/tools/

※登録無料です。


以上
