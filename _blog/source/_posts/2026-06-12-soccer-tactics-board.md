---
title: ブラウザで動くサッカー作戦盤を作った ── 子供に戦術を説明したくて
category: JavaScript
date: 2026-06-12
lang: ja
translation_id: soccer-tactics-board
cover: /img/cover/2026-06-11-soccer-tactics-board.svg
tags:
  - JavaScript
  - Canvas
  - 個人開発
  - サッカー
---

選手を配置して動きを 1 ステップずつ保存し、なめらかなアニメーションとして再生できるサッカー作戦盤を作りました。GitHub Pages にもそのまま置ける、ビルド不要の HTML + Pure JavaScript アプリです。

{% linkPreview https://kenzo0107.github.io/soccer-tactics-board/ %}

リポジトリ: [kenzo0107/soccer-tactics-board](https://github.com/kenzo0107/soccer-tactics-board)

<!-- more -->

## 作った背景 ── 物理の作戦盤では説明しきれなかった

きっかけは、この本を買って子供にサッカーの「フォーメーション」や「数的優位」を説明しようとしたことでした。

{% affiliate "小学生から知っておくべきフットボールのフォーマット" "https://m.media-amazon.com/images/P/4862557732.jpg" "https://www.amazon.co.jp/exec/obidos/ASIN/4862557732/kenzo0107-22/" "https://hb.afl.rakuten.co.jp/ichiba/54d10c45.2c0cfeee.54d10c46.43e102da/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fbookfan%2Fbk-4862557732%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9" %}

内容はとても良いのですが、いざ盤上で再現しようとすると、物理的な戦術ボード（マグネット式）では次の点が難しいと感じました。

- **複数の選手を「同時に」動かせない**。パスの出し手と受け手、ボール、相手 DF が同時に動く局面を、マグネットを 1 個ずつずらして説明しても動きの「タイミング」が伝わらない
- **同じ動きを何度も繰り返せない**。一度崩すと初期配置に戻すのが面倒で、「もう 1 回見せて」に応えづらい
- **動きの軌跡が残らない**。どの選手がどこへ走ったのかが、止め絵では追いきれない

そこで「**配置を段階的に保存しておけば、再生ボタン一つで全員が同時に・何度でも動く**」ツールがあればいいと考え、作ったのが今回の作戦盤です。スマホでもタッチ操作で動くので、その場で子供に見せられます。

## どんなアプリか

縦長フィールドの作戦盤に、赤チーム・青チームの選手、ボール、マーカー、吹き出し（解説テキスト）を自由に配置できます。

実際に「2vs1（数的優位の突破）」の作戦を再生すると、こうなります。フィールド上のバナーが現在のステップ、点線の矢印が直前のステップからの移動軌跡です。

<p align="center"><img src="https://i.imgur.com/kajriPz.gif" alt="2vs1 の作戦アニメーション" width="320"></p>

止め絵のマグネット盤と違い、**全選手とボールが同時に動き**、点線で**誰がどこへ走ったか**が残ります。再生はループするので「もう 1 回」も不要です。

## 使い方

### 起動

ビルドは不要です。リポジトリを取得してローカルで HTTP サーバーを立てるだけです（ES Modules を使っているため `file://` 直開きではなく HTTP 経由で開きます）。

```bash
git clone https://github.com/kenzo0107/soccer-tactics-board.git
cd soccer-tactics-board
python3 -m http.server 8000
# ブラウザで http://localhost:8000/ を開く
```

### 1. 選手・ボールを配置する

画面右の縦並びツールバーから配置します。

| ボタン | 役割 |
|---|---|
| 🔴 +赤選手 | 赤チームの選手を追加 |
| 🔵 +青選手 | 青チームの選手を追加 |
| ⚽ +ボール | ボールを追加 |
| 🔘 +マーカー | コーン／マーカーを追加 |
| 💬 +吹き出し | 解説テキスト付きの吹き出しを追加 |
| 🗑 削除 | 選択中のオブジェクトを削除 |

配置したオブジェクトは、マウスドラッグ（スマホはタッチ）で自由に動かせます。選手をタップすると向き（三角マーカー）や背番号・名前も編集できます。

### 2. 動きをステップとして保存する

ここがこのアプリの肝です。下部のコントローラの **＋（ステップ保存）** で、その瞬間の全配置を 1 コマとして記録します。

1. 初期配置にして **＋** で保存（STEP 1）
2. 選手・ボールを動かして再び **＋**（STEP 2）
3. これを繰り返して局面を積み上げる

| ボタン | 役割 |
|---|---|
| ＋ | 現在の配置を新しいステップとして保存 |
| ✓ | 表示中のステップを今の配置で上書き |
| − | 表示中のステップを削除 |
| ◀ / ▶ | 前 / 次のステップへ |
| スライダー | 任意のステップへジャンプ |

### 3. 再生する

**▶ 再生** を押すと、保存したステップ間を補間しながら自動再生します。コマからコマへ瞬間移動するのではなく、`easeInOutQuad` で加減速がつくので、実際の選手の動き出し・止まりに近い見え方になります。

3vs2 のように選手が増えても、全員が同時に動きます。

<p align="center"><img src="https://i.imgur.com/JGC6KKE.gif" alt="3vs2 の作戦アニメーション" width="320"></p>

吹き出しを各ステップに置いておけば、「ここで DF を引きつける」「空いたスペースへパス」といった**コーチングの意図**も一緒に残せます。練習メニュー（9 ステップの 2vs1 トレーニング）を再生するとこうなります。

<p align="center"><img src="https://i.imgur.com/5sTp9h8.gif" alt="2vs1 トレーニングメニューのアニメーション" width="320"></p>

### 4. 保存・共有する

- **ブラウザに保存**: LocalStorage に自動保存され、リロードしても復元されます
- **JSON 出力 / 読込**: 作戦を `.json` ファイルとして書き出し／読み込み。家族や仲間と共有できます
- **GIF 出力**: 作戦アニメーションを GIF として書き出せます（この記事の GIF も同形式のデータから生成しています）
- **プリセット**: あらかじめ用意した 2vs1・3vs2 などの定番パターンをメニューから読み込めます

## 技術メモ

- **HTML5 Canvas API** でフィールドと選手を描画
- **Pure JavaScript（ES Modules）** のみ。フレームワーク・ビルドツールなし
- アニメーションは「ステップ間の線形補間 + イージング」で実装（`requestAnimationFrame`）
- **LocalStorage** で永続化、JSON で入出力
- レスポンシブ対応で PC・スマホ・タブレットいずれでも操作可能

静的ファイルだけで完結するので、GitHub Pages や任意の静的ホスティングにそのまま載せられます。

## おわりに

「同時に動かす」「何度でも繰り返す」「軌跡を残す」という、物理の作戦盤では難しかった点を解決したくて作りました。子供への説明はもちろん、チームの戦術共有やトレーニングメニューの記録にも使えます。

ソースは公開しているので、よければ触ってみてください。

- リポジトリ: [kenzo0107/soccer-tactics-board](https://github.com/kenzo0107/soccer-tactics-board)
