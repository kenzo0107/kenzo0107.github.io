---
layout: post
title: 'Fix: can''t find gem bundler (>= 0.a) with executable bundle (Gem::GemNotFoundException)'
date: 2019-12-06
tags:
- Ruby
---

rbenv で複数 ruby バージョンが存在する環境下で `bundle install` しようとすると以下のエラーが出てしまいました。

```sh
can't find gem bundler (>= 0.a) with executable bundle (Gem::GemNotFoundException)
```

* ruby バージョンは合ってる、
* Gemfile もある、
* `gem install bundler` して bundle もある ← ここがダメだった


けど、エラー

ちょいちょいハマってたので備忘録とりました。

<!-- more -->

## 結論

bundle のバージョン (`2.0.2`) が Gemfile.lock (`1.17.1`) と異なることで発生していました。


* gem インストール時の bundler は `2.0.2`


```sh
$ gem install bundler

Successfully installed bundler-2.0.2
Parsing documentation for bundler-2.0.2
Done installing documentation for bundler after 2 seconds
1 gem installed
```

* Gemfile.lock での bundler は `1.17.1`


```ruby
...
 VERSION
   ruby 2.5.3p105

BUNDLED WITH
   1.17.1
```


なので、実行する bundle のバージョンを Gemfile.lock 側に合わせてあげれば実行できるようになりました。

## 対応

```ruby
$ gem install bundler -v 1.17.1
$ gem uninstall bundler -v 2.0.2
```


`(>= 0.a)` というのがパッと見、ん？となってしまい、あれ、設定したのにな、と思ってるとハマるので、このエラーメッセージを見たら反応できるようにしておきたい内容でした。

以上
参考になれば幸いです。
