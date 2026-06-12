---
layout: post
title: "StatsBot Slack Notifications: A Catalog of Notification Methods and How They Appear"
date: 2016-03-11
category: Infrastructure
lang: en
translation_id: statsbot-slack
permalink: en/2016/03/11/statsbot-slack/
tags:
  - StatsBot
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160311/20160311000758.png
---

## Overview

[Statsbot](https://statsbot.co/) is a service that integrates with Google Analytics, New Relic, and Mixpanel
to send their data to Slack.

For the integration itself, just press the `Add to Slack` button in the center of the screen
and follow the various steps as instructed, and you'll be connected right away.

* It took me about 10 seconds to get it set up.

The folks at Data Hotel put together a setup guide, so here it is for reference.

{% linkPreview https://datahotel.io/archives/1225 _blank %}

There are various configuration options, but since I couldn't tell how each one would actually look
without trying it, I've summarized them here.

There are three main settings.

| _Item_  | _Detail_                                                                                                         |
| ------- | ---------------------------------------------------------------------------------------------------------------- |
| Metrics | Sessions, users, conversions, bounce rate, new users, etc.                                                       |
| Alert   | Notifies you when users, conversions, or events go above or below a threshold                                    |
| Reports | Sends a summary (users, new users, PV, conversions, conversion rate, events, average session duration (sec))     |

Below is how each setting appears as a notification.

* The data comes from an acquaintance's EC site.
There's some embarrassing data in there, but they kindly granted permission on the condition that they'd adopt StatsBot (^-^)

## Metrics

### Sessions

- Sessions

```
@Statsbot sessions [today, yesterday, this week, last week, this month, last month, this year]
```

<div style="text-align:center;">
<img src="http://i.imgur.com/rB8FGZE.png" width="100%">
</div>

### Users

- Users

```
@Statsbot users [today, yesterday, this week, last week, this month, last month, this year]
```

<div style="text-align:center;">
<img src="http://i.imgur.com/20bo5fE.png" width="100%">
</div>

### Conversions

- Conversions

```
@Statsbot conversions [today, yesterday, this week, last week, this month, last month, this year]
```

<div style="text-align:center;">
<img src="http://i.imgur.com/Fjv0eVD.png" width="100%">
</div>

### Conversion Rate

- Conversion rate

```
@Statsbot conversion rate [today, yesterday, this week, last week, this month, last month, this year]
```

<div style="text-align:center;">
<img src="http://i.imgur.com/kMrvwWk.png" width="100%">
</div>

### Bounce Rate

- Bounce rate

```
@Statsbot bounce rate [today, yesterday, this week, last week, this month, last month, this year]
```

<div style="text-align:center;">
<img src="http://i.imgur.com/FZHODZO.png" width="100%">
</div>

### New Users

- New users

```
@Statsbot new users [today, yesterday, this week, last week, this month, last month, this year]
```

e.g.) New users this week (compared to last week)

```
@Statsbot new users this week
```

<div style="text-align:center;">
<img src="http://i.imgur.com/wI4RZlY.png" width="100%">
</div>

e.g.) New users today (compared to yesterday)

```
@Statsbot new users today
```

<div style="text-align:center;">
<img src="http://i.imgur.com/6RQtQj2.png" width="100%">
</div>

### Alert

– Stay on top of your website traffic –

- Set Alert
  Configure an alert

```
@Statsbot alert [users, conversions, events] [above, below, >, <] NUM
```

e.g.) Set an alert for when the number of users exceeds 1000

```
@Statsbot alert users > 1000
```

<div style="text-align:center;">
<img src="http://i.imgur.com/P6Bs21b.png" width="100%">
</div>

- List alerts

```
@Statsbot list alerts
```

<div style="text-align:center;">
<img src="http://i.imgur.com/t9dymX8.png" width="100%">
</div>

- Remove an alert

```
@Statsbot alert remove ID
```

## Reports

### Summary

- Summary (users, new users, PV, conversions, conversion rate, events, average session duration (sec))

```
@Statsbot summary [today, yesterday, this week, last week, this month, last month, this year]
```

<div style="text-align:center;">
<img src="http://i.imgur.com/xN05VKM.png" width="100%">
</div>

### Source

- Traffic sources

```
@Statsbot sources [today, yesterday, this week, last week, this month, last month, this year]
```

<div style="text-align:center;">
<img src="http://i.imgur.com/o7gpAFe.png" width="100%">
</div>

### Schedule

- Schedule: set the date/time, week, and frequency

```
@Statsbot schedule [summary, sources, status]
```

- List schedules

```
@Statsbot list schedule
```

- Remove a schedule

```
@Statsbot unschedule ID
```
