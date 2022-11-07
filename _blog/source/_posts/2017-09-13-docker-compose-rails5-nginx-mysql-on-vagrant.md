---
layout: post
title: docker-comopse で Rails 5 (Puma) + Nginx + Mysql 構築 on Vagrant(Ubuntu)
date: 2017-09-13
tags:
  - Docker
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170708/20170708204516.png
---

自身の Rails 開発環境の雛形として利用している docker-compose です。

{% linkPreview https://github.com/kenzo0107/vagrant-docker/tree/master/docker/rails-puma-nginx-mysql _blank %}

以下設定手順です。

## Vagrant 起動

```sh
macOS%$ git clone https://github.com/kenzo0107/vagrant-docker
macOS%$ cd ./vagrant-docker/
macOS%$ vagrant up
macOS%$ vagrant ssh
```

## Rails プロジェクト作成

```sh
// on vagrant
vagrant%$ cd /vagrant/rails-puma-nginx-mysql
vagrant%$ docker-compose run --rm web rails new . --force --database=mysql --skip-bundle
```

## puma 設定ファイルセット

```sh
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

## データベース設定ファイルセット

```sh
vagrant%$ cp database.yml ./rails/config/
```

- ./rails/config/database.yml

```yml
default: &default
  adapter: mysql2
  encoding: utf8
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
  username: root
  password: <%= ENV['MYSQL_ROOT_PASSWORD'] %> # <--- MYSQL_ROOT_PASSWORD
  host: db # <--- service name
```

## データベース作成

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

以上で必要最低限の Rails プロジェクトの準備ができました！

## Rails, Nginx, MySQL 全コンテナ起動

```sh
vagrant%$ docker-compose up -d
```

ブラウザより [http://192.168.35.101](http://192.168.35.101) へアクセスし
Rails トップページが表示されることが確認できます。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170913/20170913132149.png" width="100%">
</div>

## 総評

docker でコンテナ化しているので Nginx, MySQL 等、
バージョンアップしたい時でもコンテナを置き換えるだけで簡単に使用感を確認できたり
機能を確認できたりと便利です。

これに Elasticsearch + Kibana でログを可視化したり
Mailcatcher でメール送信を確認できるようにしたりと
開発するには十分な状況が用意できます。

是非開発の一助になれば幸いです。
