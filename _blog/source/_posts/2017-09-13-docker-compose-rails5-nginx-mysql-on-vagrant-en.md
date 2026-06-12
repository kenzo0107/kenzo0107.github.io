---
layout: post
title: Building Rails 5 (Puma) + Nginx + MySQL with docker-compose on Vagrant (Ubuntu)
date: 2017-09-13
categories:
  - [Database]
  - [Infrastructure]
lang: en
translation_id: docker-compose-rails5-nginx-mysql-on-vagrant
permalink: en/2017/09/13/docker-compose-rails5-nginx-mysql-on-vagrant/
tags:
  - Docker
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170708/20170708204516.png
---

This is a docker-compose setup I use as a template for my own Rails development environment.

{% linkPreview https://github.com/kenzo0107/vagrant-docker/tree/master/docker/rails-puma-nginx-mysql _blank %}

Here are the setup steps.

## Starting Vagrant

```sh
macOS%$ git clone https://github.com/kenzo0107/vagrant-docker
macOS%$ cd ./vagrant-docker/
macOS%$ vagrant up
macOS%$ vagrant ssh
```

## Creating the Rails Project

```sh
// on vagrant
vagrant%$ cd /vagrant/rails-puma-nginx-mysql
vagrant%$ docker-compose run --rm web rails new . --force --database=mysql --skip-bundle
```

## Setting the Puma Configuration File

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

## Setting the Database Configuration File

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

## Creating the Database

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

With that, we have prepared the bare minimum Rails project!

## Starting All Containers: Rails, Nginx, MySQL

```sh
vagrant%$ docker-compose up -d
```

Access [http://192.168.35.101](http://192.168.35.101) from your browser, and you can confirm that the Rails top page is displayed.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170913/20170913132149.png" width="100%">
</div>

## Conclusion

Because everything is containerized with Docker, it is convenient to be able to easily check the look and feel or verify functionality just by swapping out a container, even when you want to upgrade the versions of Nginx, MySQL, and so on.

By adding Elasticsearch + Kibana to visualize logs, or Mailcatcher to confirm email sending, you can prepare an environment that is more than sufficient for development.

I hope this can be of help to your development.
