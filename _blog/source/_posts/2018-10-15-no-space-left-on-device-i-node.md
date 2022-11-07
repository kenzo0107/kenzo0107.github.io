---
layout: post
title: No space left on device が発生して i-node 枯渇してた時の原因調査法
date: 2018-10-15
tags:
  - i-node
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20181015/20181015001102.jpg
---

Linux Server で No space left on device が発生した時の対処まとめです。

<!-- more -->

## とりあえず df -h してみる

`df -h` しても 最大で 77%
`no space left on device` が発生することでもなさそう

```sh
$ df -h

Filesystem      Size  Used Avail Use% Mounted on
udev            1.9G     0  1.9G   0% /dev
tmpfs           385M   40M  346M  11% /run
/dev/nvme0n1p1   15G   11G  3.3G  77% /
tmpfs           1.9G     0  1.9G   0% /dev/shm
tmpfs           5.0M     0  5.0M   0% /run/lock
tmpfs           1.9G     0  1.9G   0% /sys/fs/cgroup
tmpfs           385M     0  385M   0% /run/user/1022
tmpfs           385M     0  385M   0% /run/user/1128
tmpfs           385M     0  385M   0% /run/user/1098
tmpfs           385M     0  385M   0% /run/user/6096
```

`-h` = `--human-readable` 読みやすいサイズ表示をしてます。

## df -i してみる

`df -i` で i-node 情報表示。最大 95%
これでした。

```sh
$ df -i

Filesystem     Inodes  IUsed  IFree IUse% Mounted on
udev           490419    351 490068    1% /dev
tmpfs          492742    521 492221    1% /run
/dev/nvme0n1p1 983040 927212  55828   95% /
tmpfs          492742      1 492741    1% /dev/shm
tmpfs          492742      3 492739    1% /run/lock
tmpfs          492742     16 492726    1% /sys/fs/cgroup
tmpfs          492742      4 492738    1% /run/user/1022
tmpfs          492742      4 492738    1% /run/user/1128
tmpfs          492742      4 492738    1% /run/user/1098
tmpfs          492742      4 492738    1% /run/user/1142
```

i-node とは？と思ったら、 [「分かりそう」で「分からない」でも「分かった」気になれる IT 用語辞典 i-node 編](https://wa3.i-3-i.info/word14802.html) 辺りを見てみてください。

簡単に言うと、ファイルの属性情報を管理しているデータです。

要は、ファイル数が増えると、ファイルを管理するデータが増え、 i-node はどんどん増えていきます。

その調査法をまとめました。

## どのディレクトリのファイル数が多いか調査

以下は「現ディレクトリでのファイル数多い順ランキング」です。

```sh
sudo find . -xdev -type f | cut -d "/" -f 2 | sort | uniq -c | sort -r
```

※ find の `-xdev` オプションはマウント先のファイルシステムを検索しない様にしてます。`-type f` はファイルのみ検索。

このワンライナーで原因となるファイル数の多いディレクトリを探索します。

## 当たりが付いている場合はそのディレクトリで実行

例えば、ユーザ毎にディレクトリが用意されている場合等に、個々人が home directory で git clone してるとか、
個々人が bundle install してて vendor ディレクトリ以下がファイル数が激増してたとか。

そういった事象があり得そうなら、 /home/ ディレクトリ以下でワンライナー実行して原因調査をするのが良いです。

各ユーザ毎が原因なら相談して消して良いかも確認できるし！

## 一番手っ取り早いのは、root path 「/」 で実行

どのディレクトリのファイル数が多いのかを探るのなら、一番上位階層の「/」(root) から実行した方が特定しやすいです。

但し、root から全てのディレクトリ内のファイルを検索するとなると非常に cpu を食います。
実行してしばらくレスポンスが返ってこなくてドキドキします。

`top` コマンド等で cpu 状況を監視しつつ、実行することをオススメします。

本番環境の web サーバで直ちにユーザ影響が出そうな場合は、LB から一旦外して、とか、ユーザアクセスの少ない時間に実行する様に影響範囲を最小限にしたい所。

状況見た上で進めましょう。

## 実際にあった i-node 枯渇原因

/usr ディレクトリ以下に linux-headers-\*\*\* ファイルが溜まっており、30% 近く食ってました。

以下記事に救われました。ありがとうございます。

[古いカーネルの削除方法メモ](https://qiita.com/ytkumasan/items/d6cc70f151f130d58e9b)

### 追記 2020-07-02

linux-headers-\*\*\* ファイルの削除について、不要な利用されていないファイルを削除するには以下コマンドで削除されます。

```
sudo apt autoremove
```

#### 自動的に削除したい場合

```
// 自動アップデートパッケージインストール
$ sudo apt-get install -y unattended-upgrades

// 自動アップデート有効化
$ sudo dpkg-reconfigure -plow unattended-upgrades
Yes を選択
```

`/etc/apt/apt.conf.d/50unattended-upgrades` を以下の様に編集し、 unattended-upgrade 時に autoremove する処理を追加する。

```
sudo vim /etc/apt/apt.conf.d/50unattended-upgrades
```

```
//Unattended-Upgrade::Remove-Unused-Dependencies "false";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
```

自動アップデートのログは `/var/log/unattended-upgrades/` に出力される。

以上です。
