---
layout: post
title: 機械学習ド素人のWebエンジニアが始める機械学習で顔認識
date: 2016-09-20
tags:
- MachineLearning
---


## 前回

顔検知と顔認識は本質が異なる。

- <b>顔検知</b>は顔と判定すること
- <b>顔認識</b>は顔が誰か特定の人の顔だと判定すること

今回は後者の顔認識をする仕組みをまとめました。

{% linkPreview https://github.com/kenzo0107/FacialRecognitionSystem _blank %}


## やろうとしてること

以下5つのSTEPを順を追って実施しています。

1. 検索エンジンから画像ダウンロード
2. ダウンロードした画像から顔検知し顔部分のみ抜き取る
3. 顔部分を抜き取った画像を訓練用と試験用に分ける
4. 機械学習によりモデル作成
5. 試験用画像をモデルを利用し誰の顔であるか評価

## 参考

機械学習では TensorFlow を利用してます。

① 以下 TensorFlow の Hello World 的な例題とコピペすればすぐ動作するコードが記載されてます。

- https://www.tensorflow.org/versions/r0.10/tutorials/mnist/beginners/index.html#mnist-for-ml-beginners
- https://www.tensorflow.org/versions/r0.10/tutorials/mnist/pros/index.html#deep-mnist-for-experts
- https://www.tensorflow.org/versions/r0.10/tutorials/mnist/tf/index.html#tensorflow-mechanics-101
- https://www.tensorflow.org/versions/r0.10/tutorials/tfserve/index.html#tensorflow-serving


② すぎゃーんさんの記事は非常に参考になりました。

{% linkPreview http://memo.sugyan.com/entry/20160112/1452558576 _blank %}

やっていることもシンプルでわかりやすく、且つ、Webエンジニアの発想でサービス化してる所が興味持って望めました。


## 今後

元々やりたかったことは
Raspberry PI で顔認識して家族だと判定したら「おはよう」と挨拶させる、
なのでその顔認識部分の基礎を今回は学びました。

今後は実際にRaspberry PI とどう今回の仕組みを連結させるかを
やってみようと思います。

とはいえ家族の写真はそう簡単には集まらないので
SMAPで基礎作りをもうちょい頑張ってみよう！
