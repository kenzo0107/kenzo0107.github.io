---
title: GitHub Actions で特定ブランチが削除された場合に実行する
date: 2022-04-06
thumbnail: https://i.imgur.com/XvuvUZ4.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

GitHub Actions で特定ブランチが削除された場合にトリガーし実行する設定を試してみたのでまとめます。

以下設定サンプルです。
https://github.com/kenzo0107/tutorial-delete-event-on-github-actions/blob/develop/.github/workflows/delete.yml

<!-- more -->

## 結論

以下のような設定で実装しました。

- .github/workflows/delete.yml

```yml
on: delete

jobs:
  run:
    if: ${{ (github.event.ref_type == 'branch' && startsWith(github.event.ref, 'tmp/')) }}
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - run: echo "delete event ${{ github.event.ref }}"
```

以下ポイントをまとめます。

### on: delete と if でブランチ名指定

ブランチやタグが削除された際にトリガーされます。

`on.delete` は 以下 `on.push` の様に **branches によるブランチのフィルターは現状利用できません。**

```yml
on:
  push:
    branches:
      - tmp/**
```

その為、 `on.delete` で削除されたものが `branch` であり、且つ、
その branch 名が `tmp/` で始まる (ex. tmp/dummy) 場合のみ以下実行される設定としています。

```yml
jobs:
  run:
    if: ${{ (github.event.ref_type == 'branch' && startsWith(github.event.ref, 'tmp/')) }}
```

上記設定の為、毎回ブランチ削除時 (merge して削除等）に delete トリガーが実行されますが、
実質 1 秒程度で停止されました。

![](https://i.imgur.com/3Kbhcml.png)

ちりも積もれば...となるのでこれを避けたい場合は GitHub の Webhook を利用し回避することも可能です。

### デフォルトブランチに push して初めて on.delete は利用できる

`on.push` は任意のブランチで初めて push した場合でもトリガーできます。

`on.delete` はデフォルトブランチに push して初めて利用できます。
なかなかトリガーされないなーと焦ってたら公式ドキュメントにちゃんと載ってました。

https://docs.github.com/ja/actions/using-workflows/events-that-trigger-workflows#delete

> ノート: このイベントは、ワークフローファイルがデフォルトブランチにある場合にのみワークフローの実行をトリガーします。

## まとめ

- `on.delete` では branches フィルターが利用できない
- `on.delete` はデフォルトブランチに利用するワークフローファイルがないとトリガーしない

以上
参考になれば幸いです。
