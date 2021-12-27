---
layout: post
title: logrotate ログファイル名に日毎に日付追加 保存期間 過去ファイル圧縮 設定
date: 2015-03-17
---

## 概要
/etc/logrotate.conf 初期設定では、以下の不便さがあります。

+ error_log.1とファイル名に連番が振られていて、具体的な日付がわかりにくい。
+ 基本、logを残すのは4week となっており、1ヶ月分程度しか情報がなく、過去に遡ってそもそも調査できないケースがある
+ ファイルが圧縮されず容量を食ってしまう。

調査時に非常に不便です。

httpdをyumでインストールした場合、初期logrotate.confの設定は
以下のようになっています。

{% gist kenzo0107/3bda46fdda5909660441 %}



### 日付をログファイル名に付与する

/etc/logrotate.conf に以下一文を追記してください

```
dateext
```


### ログの保存期間を半年(53/2 週≒27)にする

```
# keep 4 weeks worth of backlogs
rotate 27
```

※ディスク容量の問題もあるかと思いますので設定前に月どの程度のサイズになるか設定を検討してから決定してください。


### 日付

過去ファイルを圧縮する

```
# uncomment this if you want your log files compressed
compress
```

{% gist kenzo0107/2385d66fee8a9a9671de %}




### apacheログの日付毎のrotate

{% gist kenzo0107/1fb1c44ffacbb08d518e %}


### 設定後翌日

以下のように出力されていることがわかります。

```
error_log-20150315.gz
error_log
```

logrotate.confに<span style="color: #ff0000">全角文字が存在する場合、正しくrotateされない可能性があるので注意してください。</span>
