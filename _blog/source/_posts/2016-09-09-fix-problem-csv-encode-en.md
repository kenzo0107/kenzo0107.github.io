---
layout: post
title: Solving CSV Encoding Problems
date: 2016-09-09
lang: en
translation_id: fix-problem-csv-encode
permalink: en/2016/09/09/fix-problem-csv-encode/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160909/20160909105642.jpg
tags:
  - csv
---

## Overview

There are cases where you aggregate data in a database on a Linux server
and produce a CSV file as a report.

I created a CSV file on a Linux server,
attached it to an email, and sent it to Windows and Mac users,
but on both platforms the CSV file came out garbled when opened.

I investigated to solve this problem.

## Why does it get garbled in the first place?

On Windows and Mac, CSV files are generally opened by launching Excel,
but <span style="color:red">Excel tries to open them as Shift_JIS by default.</span>

Some blogs suggest a workaround of opening the file in a text editor first, copying the content, and pasting it into Excel,
but when the recipient is a client, or when the file is very large,
an approach that requires extra manual steps is a no-go.

## Investigation 1: Convert the character encoding and then attach and send via mutt

1. For character encoding, I used nkf : Network Kanji Filter Version 2.0.7 (2006-06-13)
2. For sending mail, I used mutt 1.4.2.2i
3. I tweaked mutt's configuration file, but it didn't work out.

### Shift_JIS

```sh
$ echo '大崎,yoshi,浜田,moto,松本' > sjis.csv
$ nkf -g sjis.csv
UTF-8

$ nkf -s --overwrite sjis.csv
$ nkf -g sjis.csv
Shift_JIS

$ echo "Shift_JIS だよ" | mutt -n -s "Shift_JIS CSV 添付" "kenzo.tanaka0107@gmail.com" -a sjis.csv
```

- Receive the email, download the attachment, and check the character encoding

```sh
$ nkf -g sjis.csv
UTF-8
```

Huh? I encoded it as Shift_JIS before sending, but it became UTF-8.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160909/20160909102427.png" width="100%">
</div>

### JIS (ISO-2022-JP)

```sh
$ echo '大崎,yoshi,浜田,moto,松本' > jis.csv
$ nkf -j --overwrite jis.csv
$ nkf -g jis.csv
ISO-2022-JP

$ echo "JIS だよ" | mutt -n -s "JIS CSV 添付" "kenzo.tanaka0107@gmail.com" -a jis.csv
```

- Receive the email, download the attachment, and check the character encoding

```
$ nkf -g jis.csv
ISO-2022-JP
```

It was sent without the character encoding being changed, staying as ISO-2022-JP, but...
it still came out garbled...

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160909/20160909102720.png" width="100%">
</div>

### UTF-8

```sh
$ echo '大崎,yoshi,浜田,moto,松本' > utf8.csv
$ nkf -w --overwrite utf8.csv
$ nkf -g utf8.csv
UTF-8

$ echo "UTF-8 だよ" | mutt -n -s "UTF-8 CSV 添付" "kenzo.tanaka0107@gmail.com" -a utf8.csv
```

- Receive the email, download the attachment, and check the character encoding

```
$ nkf -g utf8.csv
UTF-8
```

Garbled, as expected...

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160909/20160909102942.png" width="100%">
</div>

### UTF-8 with BOM

```sh
$ echo '大崎,yoshi,浜田,moto,松本' > utf8-bom.csv
$ nkf --overwrite -oc=UTF-8-BOM utf8-bom.csv
$ nkf -g utf8-bom.csv
ISO-2022-JP

$ echo "UTF-8-BOM だよ" | mutt -n -s "UTF-8-BOM CSV 添付" "kenzo.tanaka0107@gmail.com" -a utf8-bom.csv
```

- Receive the email, download the attachment, and check the character encoding

```sh
$ nkf -g utf8-bom.csv
ISO-2022-JP
```

Same result as JIS...

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160909/20160909103228.png" width="100%">
</div>

### EUC

```sh
$ echo '大崎,yoshi,浜田,moto,松本' > euc.csv
$ nkf -e --overwrite euc.csv
$ nkf -g euc.csv
EUC-JP

$ echo "EUC だよ" | mutt -n -s "EUC CSV 添付" "kenzo.tanaka0107@gmail.com" -a euc.csv
```

- Receive the email, download the attachment, and check the character encoding

```sh
$ nkf -g euc.csv
EUC-JP
```

Changing the file encoding didn't work.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160909/20160909110133.png" width="100%">
</div>

## Investigation 2: Try making it a BINARY file

To be more specific, try sending a compressed file.

Since the CSV is opened as Shift_JIS, I encode it as Shift_JIS.

```
$ echo '大崎,yoshi,浜田,moto,松本' > sjis.csv
$ nkf -s --overwrite sjis.csv
$ zip sjis.zip sjis.csv
$ nkf -g sjis.zip
BINARY

$ echo "ZIP だよ" | mutt -n -s "ZIP 添付" "kenzo.tanaka0107@gmail.com" -a sjis.zip
```

- Receive the email, download the attachment, and check the character encoding

```sh
$ nkf -g sjis.zip
BINARY

$ unzip sjis.zip
$ nkf -g sjis.csv
Shift_JIS
```

It downloaded while staying as Shift_JIS!
This looks promising!

It worked!

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160909/20160909104652.png" width="100%">
</div>

## Summary

- I was able to open the CSV files sent to Windows and Mac without any garbled text.
- Compressing the file also reduced its size, making the transfer more efficient.
