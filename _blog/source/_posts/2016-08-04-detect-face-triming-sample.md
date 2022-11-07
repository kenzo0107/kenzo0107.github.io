---
layout: post
title: 複数画像ファイルから顔検知し顔部分をトリミングしたサンプルを集める
date: 2016-08-04
tags:
  - MachineLearning
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160809/20160809105400.gif
---

## 前回

画像ファイルを指定し
顔検知させる機能を実装しました。

{% linkPreview http://kenzo0107.hatenablog.com/entry/2016/08/01/215648 _blank %}

## 今回

まずはサンプル画像を集めます。
自分はネット上から BeautifulSoup でスクレイピングして落としてみました。
(スクリプトまとめたら公開します)

適当に 13 枚。
ゆくゆくは機械学習したいのでもっと欲しいところですが
今回はスクリプトの紹介がメインなので
この程度で。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160804/20160804142005.png" width="100%">
</div>

## 顔部分トリミング

スクリプトです。(for Python 3)

{% gist kenzo0107/517258ab06715f73c4a3457e87fd25a5 %}

```
// clone
$ git clone https://gist.github.com/kenzo0107/517258ab06715f73c4a3457e87fd25a5
$ cd 517258ab06715f73c4a3457e87fd25a5

// スクリプト実行
$ python collect_face_samples.py -p <サンプル画像が格納されているディレクトリ>
```

実際スクリプト実行した様子です。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160804/20160804143008.png" width="100%">
</div>

`_trimming` フォルダにトリミングされた画像群が格納されているのがわかります。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160804/20160804142513.png" width="100%">
</div>

以下 No 順に格納されていきます。

| No  | Item       | Explain                                                                                                                                   |
| --- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | \_resize   | 大小さまざまな画像サイズを一定して高さ 500 以下の画像にリサイズします。                                                                   |
| 2   | \_addbox   | 顔周りに囲い画像が追加された画像が格納されます。各画像でどこが顔として検知されたかの確認用です。                                          |
| 2   | \_trimming | \_addbox に格納されているファイルの顔部分をトリミングした画像を 64×64 サイズにリサイズし<br/>且つ、数度回転させた画像が格納されています。 |

これでサンプル集めが捗れば何よりです。
