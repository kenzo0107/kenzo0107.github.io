---
title: 日本の祝日判定 Go ライブラリ shukujitsu を作った
category: Go
tags:
- Go
date: 2021-07-09
thumbnail: https://github.com/kenzo0107/shukujitsu/raw/main/logo.jpg
---

## 概要

2021年の夏は五輪特措法で海の日が 7/19 から 7/22 に移動されています。
祝日判定ライブラリの元となるデータセットが更新されておらず、困ったことから
祝日のデータセットを自動更新する仕組みを持った Go ライブラリ [kenzo0107/shukujitsu](https://github.com/kenzo0107/shukujitsu) を作るに至った話です。


## 祝日判定の方法

祝日判定する際には主に2つの方法があります。

1. Google Calendar API を利用する
2. 内閣府ホームページで提供される shukujitsu.csv を元に判定する

上記 2 案を元にした OSS も多数あり、そちらを利用することで祝日判定ができます。

ですが、2021年7月15日時点で以下理由で見送りました。

* https://github.com/holiday-jp/holiday_jp
  * 内閣府HP提供 syukujitsu.csv をベースとしているが、自動更新していない
  * https://github.com/holiday-jp/holiday_jp/pull/110 のコメントを見る限り、自動化していないと判断しました。
* https://holidays-jp.github.io/
  - 自動更新されていそう。2021-07-22 が祝日であることが確認できた為。
  - 祝日名が取れず、あくまで祝日かどうかを返す API だった。
    - 祝日だった場合 → "holiday"、そうでない場合 → "else" が返る。
* http://s-proj.com/utils/holiday.html
  - Google Calendar API を利用しているが、更新頻度が明記されておらず不明だった。

気づかぬうちに祝日移動してた、ということを回避したく、
祝日データが自動更新される仕組みを持った祝日判定ライブラリが欲しかったので自作するに至りました。

[kenzo0107/shukujitsu](https://github.com/kenzo0107/shukujitsu)

## 自動化はどう実現したか？

GitHub Actions で Google Calendar API を利用し月2回実行し、祝日情報を取得し、 auto commit で祝日データを更新します。

実際に見ていただけるとわかりやすいかと思います。

https://github.com/kenzo0107/shukujitsu/blob/main/.github/workflows/auto_update_shukujitsu.yml


最後の Slack 通知はどの程度更新されるものか、確認したく、自身の Slack チャンネルに通知する様にしました。

## Google Calendar API を採用した理由

[内閣府 HP 提供の syukujitsu.csv](https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv) は実際に csv ファイルを開いて見るとわかりますが、
sjis でフォーマットがやや雑な印象です。

![](https://i.imgur.com/rD1QRqD.png)

1955/1/1 は 1955-01-01 にして欲しい気持ち。

これは気づかぬ内にしれっと変わるのでは？という危惧から利用を避けました。

その点、 Google Calendar API もレスポンス内容が変わる可能性こそありますが、
syukujitsu.csv ほどではないのでは？という推察の元、
Google Calendar API を採用しました。


尚、取得可能な祝日は以下の様になります。

* Google Calendar API
  * 去年・今年・翌年の 3年分
* syukujitsu.csv
  * 1955年から現在まで

syukujitsu.csv の方が、範囲が広く正確に過去分まで取得したい場合は、syukujits.csv が良いです。

現状、自身の管理するシステムで利用する分には Google Calendar API の守備範囲で問題ない為、 Google Calendar API にしています。

syukujitsu.csv が今後、数年このフォーマットを維持していただけるなら、ファイルサイズも小さいですし、syukujitsu.csv への乗り換えを検討しようと思います。

以上です。
ご利用いただけますと幸いです。


## 総評

ゆくゆくはデジタル庁から祝日判定用の API が公開されたり、ということがあるのでは？と期待しています。

リポジトリ名を shukujitsu としましたが、 go ライブラリ感が薄いなぁ〜と反省。。
