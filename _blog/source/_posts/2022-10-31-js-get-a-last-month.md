---
title: JavaScript で日付計算の妙
date: 2022-10-31
cover: https://i.imgur.com/VbLapz4.png
---

問題です。以下コードを実行した際に何と出力されるでしょう？
先月の 1 日を取得したい気持ちです。

```nodejs
let dt = new Date('2022-10-31T15:00:00+0900');
dt.setMonth(dt.getMonth() - 1);
dt.setDate(1)
console.log(dt); // => ?
```

<!-- more -->

答えは `2022-10-01T06:00:00.000Z` です。

10 月 31 日の 1 ヶ月前は 9 月 31 日、
9 月は 30 日までなのでその翌日の 10 月 1 日になってしまったというものです。

先月の 1 日を取得する場合は先に `setDate(1)` が必要です。

```nodejs
let dt = new Date('2022-10-31T15:00:00+0900');
dt.setDate(1)
dt.setMonth(dt.getMonth() - 1);
console.log(dt); // => 2022-09-01T06:00:00.000Z
```

ちなみに先月の月末は `setDate(0)` することで取得できます。

```nodejs
let dt = new Date('2022-10-31T15:00:00+0900');
dt.setDate(0);
console.log(dt); // => 2022-09-30T06:00:00.000Z
```

Lambda で 10 月 31 日の本日に 1 ヶ月前が取得できないな？となってちょっとハマってしまった問題でした。
terraform で簡易的な Lambda スクリプトを管理しており、極力 package を利用せずに nodejs で日付計算したかった背景があります。

以上
参考になれば幸いです。
