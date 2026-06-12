---
title: I Built shukujitsu, a Go Library for Determining Japanese Public Holidays
category: Go
tags:
  - Go
date: 2021-07-09
lang: en
translation_id: shukujitsu-go-library
permalink: en/2021/07/09/shukujitsu-go-library/
cover: https://github.com/kenzo0107/shukujitsu/raw/main/logo.jpg
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

## Overview

In the summer of 2021, the special Olympic measures law moved Marine Day from 7/19 to 7/22.
The dataset behind the holiday-detection libraries had not been updated, which caused me trouble. That experience led me to build the Go library [kenzo0107/shukujitsu](https://github.com/kenzo0107/shukujitsu), which has a mechanism for automatically updating the holiday dataset.

## How to Determine Public Holidays

There are mainly two ways to determine public holidays.

1. Use the Google Calendar API
2. Determine holidays based on shukujitsu.csv provided on the Cabinet Office website

There is also a lot of OSS based on the two approaches above, and you can determine holidays by using them.

However, as of July 15, 2021, I passed on them for the following reasons.

- https://github.com/holiday-jp/holiday_jp
  - It is based on the syukujitsu.csv provided by the Cabinet Office website, but it is not automatically updated.
  - Judging from the comments on https://github.com/holiday-jp/holiday_jp/pull/110, I concluded that it is not automated.
- https://holidays-jp.github.io/
  - It seems to be automatically updated, because I was able to confirm that 2021-07-22 is recognized as a holiday.
  - The holiday name cannot be retrieved; it is only an API that returns whether a date is a holiday or not.
    - It returns "holiday" if the date is a holiday, and "else" otherwise.
- http://s-proj.com/utils/holiday.html
  - It uses the Google Calendar API, but the update frequency is not stated, so it is unknown.

I wanted to avoid the situation where a holiday had been moved without me noticing, so I wanted a holiday-detection library with a mechanism that automatically updates the holiday data, which led me to build my own.

[kenzo0107/shukujitsu](https://github.com/kenzo0107/shukujitsu)

## How Did I Achieve Automation?

Using GitHub Actions, it calls the Google Calendar API twice a month, retrieves the holiday information, and updates the holiday data via an auto commit.

I think it will be easier to understand if you actually take a look.

https://github.com/kenzo0107/shukujitsu/blob/main/.github/workflows/auto_update_shukujitsu.yml

I wanted to check how often the data actually gets updated, so the final Slack notification step posts to my own Slack channel.

## Why I Chose the Google Calendar API

If you actually open the [syukujitsu.csv provided by the Cabinet Office website](https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv), you will see that it is in Shift_JIS and the format gives a somewhat sloppy impression.

![](https://i.imgur.com/rD1QRqD.png)

I kind of wish 1955/1/1 were formatted as 1955-01-01.

Because of the concern that this might quietly change without anyone noticing, I avoided using it.

In that regard, the Google Calendar API may also have its response content change, but I avoided syukujitsu.csv under the assumption that the API is probably not as bad as syukujitsu.csv in that respect, and so I adopted the Google Calendar API.

For reference, the holidays you can retrieve are as follows.

- Google Calendar API
  - Three years' worth: last year, this year, and next year
- syukujitsu.csv
  - From 1955 to the present

syukujitsu.csv covers a wider range, so if you want to accurately retrieve holidays including past data, syukujitsu.csv is the better choice.

Currently, for use within the systems I manage, the coverage of the Google Calendar API is sufficient, so I went with the Google Calendar API.

If syukujitsu.csv maintains this format for the next several years, then since its file size is small, I think I will consider switching over to syukujitsu.csv.

That's all.
I would be happy if you find it useful.

## Closing Thoughts

I am hoping that, in the future, the Digital Agency might release an API for determining public holidays.

I named the repository shukujitsu, but I regret that it doesn't quite have a "Go library" feel to it...
