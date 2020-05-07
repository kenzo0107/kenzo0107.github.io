---
layout: post
title: error RPC failed; curl 56 SSLRead() return on MacOS Sierra
date: 2016-09-28
tags:
- SSL
---

## 概要

みんなのGo言語を購入しまして
ghq でGit管理してみよう！
と心動いた方は多いはず

昔から peco で Git Repository 移動コマンドはしてたけど、
ghq を利用したリポジトリ管理は便利ですね。

そんな折、
ghq コマンドで git repository をクローンしようとした際に
掲題のエラーが発生しましたので備忘録。

```sh
$ ghq get <git repository>
...
error: RPC failed; curl 56 SSLRead() return
...
```

利用している git  が SSL 対応していないようです。


## 対応

- git を openssl, curl 付きで再インストール

```sh
$ brew reinstall git --with-brewed-curl --with-brewed-openssl
```

## 再度実行

```sh
$ ghq get <git repository>
remote: Total 74442 (delta 145), reused 0 (delta 0), pack-reused 74160
Receiving objects: 100% (74442/74442), 701.45 MiB | 1.42 MiB/s, done.
Resolving deltas: 100% (50571/50571), done.
Checking out files: 100% (11350/11350), done.
```

無事できた♪


## 参照

[Curl: (56) SSLRead() return error -9806 - Need Help please slight_smile](https://forums.meteor.com/t/curl-56-sslread-return-error-9806-need-help-please/21913)
