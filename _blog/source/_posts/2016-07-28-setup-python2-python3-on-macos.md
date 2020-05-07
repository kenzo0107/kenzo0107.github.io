---
layout: post
title: MacOSX に Python2, Python3 仮想環境構築
date: 2016-07-28
tags:
- Python
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20160728/20160728142804.jpg
---

## 経緯

MacOSX デフォルトでは python 2系。

python 2.7 は 2020年までのサポート なので
python 3 系 に慣れておこうということで
3 系環境を構築しようと思いました。

ですが
[dlib](http://dlib.net/) など Python 2系でないとうまく設定ができなかった経緯があり
(※自分の不手際の可能性もありますが)
両方残そうということで両仮想環境を構築します。


## 環境

```
$ sw_vers

ProductName:    Mac OS X
ProductVersion: 10.11.5
BuildVersion:   15F34
```

## Homebrew インストール

以下オフィシャルサイト参照してください。

[Homebrew Ja](http://brew.sh/index_ja.html)


## Python2, 3 インストール

2016/07/28 現在、 python = 2.7.10, python3 = 3.4.3

```
$ brew install python python3 pyenv
```

## 設定ファイル

.bashrc もしくは .zshrc に追記します。

以下仮に .bashrc とします。

```shell
$ vi ~/.bashrc
```

```shell
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
```

- 設定読み込み

```
$ source ~/.bashrc
```

## virtualenv インストール

```
sudo easy_install virtualenv
```

## 仮想環境構築

- python2 での仮想環境構築

```
$ which python

/usr/local/bin/python2.7
```

```
$ virtualenv -p /usr/local/bin/python2.7 ~/py2env
```

- python3 での仮想環境構築

```
$ which python3

/usr/local/bin/python3
```

```
$ virtualenv -p /usr/local/bin/python3 ~/py3env
```



## 仮想環境切り替え

- Python 2.7 仮想環境へ切り替え

```
$ source ~/py2env/bin/active
```

- Python 3.4 仮想環境へ切り替え

```
$ source ~/py3env/bin/active
```

今更ですが備忘録的まとめでした。
