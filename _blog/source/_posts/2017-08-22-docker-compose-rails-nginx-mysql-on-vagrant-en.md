---
layout: post
title: Building a Rails 5.1.0 (Puma) + Nginx + MySQL Environment with Vagrant + docker-compose
date: 2017-08-22
lang: en
translation_id: docker-compose-rails-nginx-mysql-on-vagrant
permalink: en/2017/08/22/docker-compose-rails-nginx-mysql-on-vagrant/
tags:
  - Docker
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170823/20170823110755.png
---

## Overview

I built this to make it easy to set up and develop a Rails environment.

I use it in situations like these:

- Developing a new project
- Testing a new gem or other middleware
- When I want to quickly build a mockup to show to a director

I've put together the setup steps below.

## Environment

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

## Creating the Rails Project

```sh
// database = mysql
vagrant%$ docker-compose run --rm web rails new . --force --database=mysql --skip-bundle
```

## puma.rb Configuration

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

## Configuring Database Connection Settings

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

## Running Rails

```sh
vagrant%$ docker-compose up -d
```

When you access [http://192.168.35.101](http://192.168.35.101), the Rails welcome page is displayed.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170822/20170822123732.png" width="100%">
</div>

## rails g

When running `rails g`, it's generally best to run it in a one-off container.

For example, the following creates an articles table, along with the associated controller, view, and model.

```
vagrant%$ docker-compose run --rm web rails g scaffold article title:string body:text
```

## Updating the Gemfile

When you update the Gemfile, rebuild and restart.

```sh
vagrant%$ docker-compose stop web
vagrant%$ docker-compose build web
vagrant%$ docker-compose up -d web
```

## Afterword

Connecting to the Rack server had its quirks, but once I got past that, everything went smoothly ♪

Since the DB is exposed on port 3306, you can connect to it from your local Mac with [Sequel Pro](https://www.sequelpro.com/) to verify it.

Using this as a base, you can do things like checking logs with EFK, or testing email functionality with mailcatcher — it's handy in all sorts of ways.

Thank you, Docker ♪
