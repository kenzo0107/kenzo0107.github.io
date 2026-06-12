---
layout: post
title: Formatting Specific CSV Columns with awk — Treating Numbers as Strings
date: 2016-03-28
lang: en
translation_id: awk-shapes-csv
permalink: en/2016/03/28/awk-shapes-csv/
tags:
  - awk
  - csv
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160328/20160328190207.png
---

## Overview

When you want to extract some customer data and report on it,
if a CSV file contains a mobile phone number such as "090", opening the CSV file in Excel
may turn it into "90".

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160328/20160328190207.png" width="100%">
</div>

For such cases, here is a summary of how to treat the values in a specific column as strings.

## How to treat numbers as strings in Excel

Given

```
"090"
```

formatting it like

```
="090"
```

makes it be treated as a string.

Example)

```
"デミスハサビス",="09099999999","DeepMind"
```

## Let's format it

- Example) Suppose you have a tmp.csv like the following.

```
"デミスハサビス","09099999999","DeepMind"
"いとうせいこう","08088888888","エムパイヤ・スネーク・ビルディング"
```

- Add `=` to the left side of only the second column.
  ※ Add an "=" to the left side of the value enclosed in " (double quotes).
  ※ For clarity, I deliberately specified the fields $1, $2, $3 explicitly.

```
$ awk -F ',' '{print $1 ",="$2","$3}' tmp.csv
"デミスハサビス",="09099999999","DeepMind"
"いとうせいこう",="08088888888","エムパイヤ・スネーク・ビルディング"
```

As shown above, "=" has been added.

- Specify the output destination

```
$ awk -F ',' '{print $1 ",="$2","$3}' tmp.csv > output.csv
$ cat output.csv
"デミスハサビス",="09099999999","DeepMind"
"いとうせいこう",="08088888888","エムパイヤ・スネーク・ビルディング"
```

Let's open output.csv in Excel.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160328/20160328190448.png" width="100%">
</div>

Done ♪

## Bonus

When opening with Excel, the default encoding on Windows is SJIS, so if the character encoding is UTF8, the text will be garbled.
Below, we convert the character encoding of the CSV file to SJIS.

```
$ nkf -sLw output.csv > output_sjis.csv
```

That's all.
