---
layout: post
title: Vagrant + Chef ⇒ LAMP環境構築
date: 2014-05-30
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20140530/20140530224409.png
tags:
- Vagrant
- Chef
---


## 目的

Vagrant と Chef を利用して LAMP環境をローカルの仮想環境で実現する

## 経緯

同一サーバ上で作業している場合に
<span style="color: #e2241a">MySQLのバージョンアップしてパフォーマンステストしたりしたいなぁ</span>、
でも、他のみんなに迷惑かかっちゃうよ or  サーバ買ってもらえないし、
というときなんかに
ローカル環境で試せるね

ってことで導入しました。


## 環境

- MacOSX Marvericks
- Vagrant
- VirtualBox


## 前提
以下がインストールされていること
- Vagrant
- VirtualBox
- Chef
- knife-solo

↑ 最下の「あとがき」にあるドットインストールで導入手順を参考にしました。



## 1. knife-solo初期化

```sh
$ knife configure
```
色々尋ねられますが、基本、[Enter]連打で問題ありません。



## 2. BOX追加
BOXとは、<b>仮想マシン起動の際にベースとなるイメージファイル</b>です。

<b>centos64</b> という名前でboxを追加します。

```sh
$ vagrant box add centos64 http://developer.nrel.gov/downloads/vagrant-boxes/CentOS-6.4-i386-v20131103.box
```


※利用しているサーバ環境と合わせたい場合は、
お使いのサーバにログインして以下実行で環境情報を調べるのが良いでしょう。

```sh
$ uname -a
```

boxは以下からURLを選べます。
[http://www.vagrantbox.es/](http://www.vagrantbox.es/)


## 3. 仮想環境 初期化


```sh
$ mkdir [vagrant用ディレクトリ]
$ cd  [vagrant用ディレクトリ]
$ vagrant init centos64
```

成功すると<b>Vagrantfile</b>ができているのがわかります。
```sh
$ ls
$ Vagrantfile
```


## 4. Vagrantfile修正
private networkの設定をして
ローカル環境からアクセス出来る様にします。

MacOS → VirtualBox
へのアクセスです。

以下のようにコメントアウトを外すのみ！
```sh
#config.vm.network :private_network, ip: "192.168.33.10"
config.vm.network :private_network, ip: "192.168.33.10"
```


## 5. 仮想環境 起動
Vagrantfileのあるパスで以下実行

```sh
$ vagrant up
```

以下実行で「running(virtualbox)」を実行すると、起動中であることを確認できる。

```sh
$ vagrant status
```

```sh
Current machine states:

default                   running (virtualbox)

The VM is running. To stop this VM, you can run `vagrant halt` to
shut it down forcefully, or you can run `vagrant suspend` to simply
suspend the virtual machine. In either case, to restart it again,
simply run `vagrant up`.
```


以下実行でログイン

```sh
$ vagrant ssh
```

ログインした後、ログアウトしたい場合に以下実行
```sh
$ exit
```



## 6. sshエイリアス作成

```sh
$ vagrant ssh-config --host [sshエイリアス] >> ~/.ssh/config
```

以下実行でアクセスできる。
```sh
$ ssh [sshエイリアス]
```

また、以下実行でsshのconfigに書き込まれていることを確認できる。
```sh
$ cat ~/.ssh/config
```



## 7. Chefリポジトリ作成

以下のような構成が管理しやすいかなと思いますので、
以下のように作ります。

```
 |
 +---  [vagrant用ディレクトリ]
 |
 +---  [chef-repo]
```

[vagrant用ディレクトリ]の１つ上の階層に移動しておいて
以下実行

```sh
$ knife solo init [Chefのリポジトリ名]
```



## 8. 仮想マシンをchef対応させる

```sh
$ cd [Chefのリポジトリ名]
$ knife solo prepare [sshエイリアス]
```



## 9. cookbook作成

```sh
$ knife cookbook create [cookbook名] -o site_cookbooks/
```



## 10.  cookbookに構築する環境の設定記述

```sh
$ vim [Chefのリポジトリ名]/[cookbook名]/recipe/default.rb
```

## 11. 実行recipe指定

```sh
$ vim [Chefのリポジトリ名]/nodes/[sshエイリアス名].json
```

```json
{
    "run_list": [
          "recipe[[cookbook名]]"
     ]
}
```




## 12. テンプレートを作成

```sh
$ vim [Chefリポジトリ名]\[cookbookの名前]\template\default\index.html.erb
```

index.html.erbの中身は自由に編集してください。

例として

```html
<h1>Hello, World</h1>
```



## 13. cookbookをvagrant仮想環境へ反映

```sh
$ knife solo cook [sshエイリアス名]
```



## 13. 設定した仮想環境のWebサーバへアクセスする

ブラウザで [http://192.168.33.10](http://192.168.33.10) へアクセス

ブラウザに以下が表示されることを確認！

```sh
Hello, World
```


また、仮想環境にアクセスすると以下ファイルができていることを確認できるので
試してみてください。

```sh
$ vagrant ssh
$ cd /var/www/html/
$ ls

index.html
```




## あとがき

ドットインストールで以下さらっておくととっつきやすいです。

* [essons/basic_vagrant](http://dotinstall.com/lessons/basic_vagrant)
* [lessons/basic_chef](http://dotinstall.com/lessons/basic_chef)
