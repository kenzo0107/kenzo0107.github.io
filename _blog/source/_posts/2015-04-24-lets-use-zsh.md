---
layout: post
title: MacOSX  zsh を使おう！
date: 2015-04-24
---

## メリット
- ターミナル上で補間機能をつけられる
- コマンドやファイルパス、大文字・小文字も変換して補間

## 手順

### zshがあるか確認
```console
$ cat /etc/shells
...

/etc/zsh
```

なければ、brewでinstall

```console
$ brew install zsh
$ sudo sh -c 'echo $(which zsh) >> /etc/shells'
```

### shellをzshに切り替え

```console
$ chpass -s /bin/zsh
Password: (パスワード入力)
```

デフォルトのshell設定
```console
$ chsh -s /bin/zsh
```

個人の.zshrc設定は以下のようにしてます。

https://github.com/kenzo0107/dotfiles

上記をダウンロードしホームディレクトリ(~/)に
`.zshrc`
を配置します。

gitで管理しているので以下のようにリンク貼るのもよしです。

```console
$ ln .zshrc ~/.zshrc
```

zsh設定ファイル読み込み
```console
$ source .zshrc
```

ターミナルを再起動すると以下のように設定が反映されたことが確認できます。

![](http://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20150430/20150430115842.png)
