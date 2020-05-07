---
layout: post
title: Vagrant + docker-compose で Rails 5.1.0 (Puma) + Nginx + MySQL 環境構築
date: 2017-08-22
tags:
- Docker
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170823/20170823110755.png
---


## 概要

簡易的に Rails 環境を構築・開発できる様にすべく構築しました。

こんな時に利用してます。

- 新規プロジェクト開発
- 新規 gem, その他ミドルウェアの試験
- 簡単なモックを作ってディレクターに見せたい時とか

構築手順をまとめました。

## 環境

- macOS Sierra 10.12.5
- VirtualBox 5.1.18r114002
- Vagrant 1.9.3
- VagrantBox Ubuntu 14.04.5
- Docker version 17.06.0-ce, build 02c1d87

## Git Clone

```sh
macOS%$ git clone https://github.com/kenzo0107/vagrant-docker
macOS%$ cd vagrant-docker
macOS%$ vagrant up
macOS%$ vagrant ssh
vagrant%$ cd /vagrant/rails-puma-nginx-mysql/
```

## Rails プロジェクト作成

```sh
// database = mysql
vagrant%$ docker-compose run --rm web rails new . --force --database=mysql --skip-bundle
```

## puma.rb 設定

```sh
// backup
vagrant%$ cp ./rails/config/puma.rb ./rails/config/puma.rb.bk
vagrant%$ cp puma.rb ./rails/config/
```

- ./rails/config/puma.rb

```ruby
threads_count = ENV.fetch("RAILS_MAX_THREADS") { 5 }.to_i
threads threads_count, threads_count
port        ENV.fetch("PORT") { 3000 }
environment ENV.fetch("RAILS_ENV") { "development" }
plugin :tmp_restart

app_root = File.expand_path("../..", __FILE__)
bind "unix://#{app_root}/tmp/sockets/puma.sock"
```

## データベース接続情報設定

```sh
// backup
vagrant%$ cp ./rails/config/database.yml ./rails/config/database.yml.bk
vagrant%$ cp database.yml ./rails/config/
```

- ./rails/config/database.yml

```yml
default: &default
  adapter: mysql2
  encoding: utf8
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
  username: root
  password: <%= ENV['MYSQL_ROOT_PASSWORD'] %>  # <--- MYSQL_ROOT_PASSWORD
  host: db # <--- service name
```


## DB作成

```sh
vagrant%$ docker-compose run --rm web rails db:create
Created database 'app_development'
Created database 'app_test'

vagrant%$ docker-compose exec db mysql -u root -p -e'show databases;'
Enter password: (password)
+--------------------+
| Database           |
+--------------------+
| information_schema |
| app_development    | <--- add !
| app_test           | <--- add !
| mysql              |
| performance_schema |
| sys                |
+--------------------+
```

## Rails 実行

```sh
vagrant%$ docker-compose up -d
```

[http://192.168.35.101](http://192.168.35.101) にアクセスすると Rails のウェルカムページが表示されます。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170822/20170822123732.png" width="100%">
</div>


## rails g

`rails g` 実行時は基本 one-off container で実行するのが良いです。

例えば以下は articles テーブルを作成、また、関連する controller, view, model を作成します。

```
vagrant%$ docker-compose run --rm web rails g scaffold article title:string body:text
```

## Gemfile 更新

Gemfile 更新した際はビルドし再起動します。

```sh
vagrant%$ docker-compose stop web
vagrant%$ docker-compose build web
vagrant%$ docker-compose up -d web
```

## あとがき

Rack server との接続は一癖ありましたが、そこさえ乗り越えたら
すっと行きました♪

DB は 3306 でオープンしてるので
Mac のローカルから [Sequel Pro](https://www.sequelpro.com/) で接続して確認できます。

これをベースに EFK でログ確認できる様にしたり、
mailcatcher でメール機能を試験できる様にしたりと
何かと便利です。

Docker 有難や♪
