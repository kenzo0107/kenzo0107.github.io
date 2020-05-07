---
layout: post
title: StatsBotのSlack通知 通知方法と通知時の見え方 一覧
date: 2016-03-11
tags:
- StatsBot
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160311/20160311000758.png
---

## 概要

[Statsbot](https://statsbot.co/) は、GoogleAnalytics、NewRelic、Mixpanelと連携し
各データをSlackへ通知できるサービスです。


連携自体は画面中央の `Add to Slack` ボタンを押下し
各種手続きを手順通り行えばすぐに連携できます。

※導入まで10秒ほどでした。


データホテルさんが導入法まとめていたので参考までに。

{% linkPreview https://datahotel.io/archives/1225 _blank %}


各種設定方法がありますが、どんな見え方になるかは
試してみないとわからなかったので、まとめました。

設定は大きく3つあります。

| *Item*  | *Detail*                                                                                                         |
| ------- | ---------------------------------------------------------------------------------------------------------------- |
| Metrics | セッション数,ユーザ数,コンバージョン,直帰率,新規ユーザ,                                                          |
| Alert   | ユーザ,コンバージョン,イベントが閾値を超えるor下がると通知                                                       |
| Reports | まとめ(ユーザ数, 新規ユーザ数, PV, コンバージョン数, コンバージョン率, イベント数, 平均セッション時間(秒))を通知 |

以下設定を通知の見え方です。

※データは知り合いのECサイトです。
恥ずかしいデータもありますが、StatsBot の導入を条件に快く許諾いただきました(^-^)


## Metrics

### Sessions

- セッション数

```
@Statsbot sessions [today, yesterday, this week, last week, this month, last month, this year]
```

<div style="text-align:center;">
<img src="http://i.imgur.com/rB8FGZE.png" width="100%">
</div>

### Users

- ユーザ数

```
@Statsbot users [today, yesterday, this week, last week, this month, last month, this year]
```

<div style="text-align:center;">
<img src="http://i.imgur.com/20bo5fE.png" width="100%">
</div>

### Conversions

- コンバージョン

```
@Statsbot conversions [today, yesterday, this week, last week, this month, last month, this year]
```

<div style="text-align:center;">
<img src="http://i.imgur.com/Fjv0eVD.png" width="100%">
</div>

### Conversion Rate

- コンバージョン率

```
@Statsbot conversion rate [today, yesterday, this week, last week, this month, last month, this year]
```

<div style="text-align:center;">
<img src="http://i.imgur.com/kMrvwWk.png" width="100%">
</div>

### Bounce Rate

- 直帰率

```
@Statsbot bounce rate [today, yesterday, this week, last week, this month, last month, this year]
```

<div style="text-align:center;">
<img src="http://i.imgur.com/FZHODZO.png" width="100%">
</div>


### New Users

- 新規ユーザ

```
@Statsbot new users [today, yesterday, this week, last week, this month, last month, this year]
```

例) 今週の新規ユーザ (先週との比較)

```
@Statsbot new users this week
```

<div style="text-align:center;">
<img src="http://i.imgur.com/wI4RZlY.png" width="100%">
</div>


例) 今日の新規ユーザ (昨日との比較)

```
@Statsbot new users today
```

<div style="text-align:center;">
<img src="http://i.imgur.com/6RQtQj2.png" width="100%">
</div>

### Alert

– Stay on top of your website traffic –

- Set Alert
アラート設定

```
@Statsbot alert [users, conversions, events] [above, below, >, <] NUM
```

例) ユーザ数が1000人を超えたらアラート設定

```
@Statsbot alert users > 1000
```

<div style="text-align:center;">
<img src="http://i.imgur.com/P6Bs21b.png" width="100%">
</div>

- アラート一覧 表示

```
@Statsbot list alerts
```

<div style="text-align:center;">
<img src="http://i.imgur.com/t9dymX8.png" width="100%">
</div>

- アラート一覧 削除

```
@Statsbot alert remove ID
```


## Reports

### Summary

- まとめ (ユーザ数, 新規ユーザ数, PV, コンバージョン数, コンバージョン率, イベント数, 平均セッション時間(秒) )

```
@Statsbot summary [today, yesterday, this week, last week, this month, last month, this year]
```

<div style="text-align:center;">
<img src="http://i.imgur.com/xN05VKM.png" width="100%">
</div>

### Source

- 流入

```
@Statsbot sources [today, yesterday, this week, last week, this month, last month, this year]
```

<div style="text-align:center;">
<img src="http://i.imgur.com/o7gpAFe.png" width="100%">
</div>


### Schedule

- スケジュール 日時週・頻度設定

```
@Statsbot schedule [summary, sources, status]
```

- スケジュール一覧表示

```
@Statsbot list schedule
```

- スケジュール設定解除

```
@Statsbot unschedule ID
```
