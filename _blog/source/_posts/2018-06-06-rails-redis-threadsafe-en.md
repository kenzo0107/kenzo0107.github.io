---
layout: post
title: Building a Thread-Safe Access Count Ranking with Rails × Redis
date: 2018-06-06
categories:
  - [Database]
  - [Infrastructure]
lang: en
translation_id: rails-redis-threadsafe
permalink: en/2018/06/06/rails-redis-threadsafe/
tags:
  - Ruby
  - Rails
  - Rails
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20180606/20180606115540.jpg
---

## Overview

I implemented an access count ranking for article pages on a media site.

- Rails 5.1
- Redis (AWS ElastiCache 3.2.10)

In doing so, I took care to write a thread-safe implementation that accounts for a multi-threaded environment.

<!-- more -->

## What is Thread Safety?

Thread safety means that no problems occur even when multiple threads run concurrently.
When code is not thread-safe, shared data modified by one thread may be overwritten by another thread.

Server-side software such as web servers and databases runs in a multi-threaded (multi-process) manner, so when developing server-side applications it is desirable to implement them to work correctly under multiple threads.

#### References

[Thread safety](https://ja.wikipedia.org/wiki/%E3%82%B9%E3%83%AC%E3%83%83%E3%83%89%E3%82%BB%E3%83%BC%E3%83%95)

[About Java's ThreadLocal and thread safety](https://qiita.com/naoyoshinori/items/507c5c3ea6027033f4bb)

## Specification

When a user accesses an article detail page on the media site,
the view count for that article ID is incremented by +1.

And then,
it displays a ranking of the top 10 most-viewed articles.

I have summarized the Rails and Redis configuration used to achieve this.

## Considering Implementation Approaches

In config/initializers/redis.rb((set `host` and `port` via secrets.yml or ENV)), I considered how to implement the initial Redis setup.

### Defining it as a global variable

```ruby
require 'redis'

REDIS = Redis.new(host: host, port: port)
```

In this case,
the Redis client is held globally,
and in a multi-threaded environment multiple threads may overwrite it.

### Thread.current

```ruby
require 'redis'

def redis
  Thread.current[:redis] ||= Redis.new(host: host, port: port)
end
```

This retrieves the currently running thread and guarantees per-thread data.

However, there are the following two problems.

1. It can be overwritten by others
2. It is not structured

### ActiveSupport::PerThreadRegistry

```ruby
require 'redis'

class RedisRegistry
  extend ActiveSupport::PerThreadRegistry
  attr_accessor :redis, :current_permissions
end

def redis
  RedisRegistry.redis ||= Redis.new(host: host, port: port)
end
```

Here `redis` is defined as a thread-local variable, encapsulating its access and preventing it from being overwritten.

However,
this became [deprecated](http://api.rubyonrails.org/classes/ActiveSupport/PerThreadRegistry.html) in Rails 5.2 (T_T)

### thread_mattr_accessor

Looking at the following, the behavior of `thread_mattr_accessor` had been fixed.
[Fix `thread_mattr_accessor` share variable superclass with subclass](https://github.com/rails/rails/pull/25681)

Let's rewrite it using `thread_mattr_accessor`.

- config/initializers/redis.rb

```ruby
require 'redis'

class RedisRegistry
  thread_mattr_accessor :redis
end

def redis
  RedisRegistry.redis ||= Redis.new(host: host, port: port)
end
```

## Incrementing the Access Count

The `rescue` clause is set up so that even if the connection to Redis is lost, the site itself does not go down—only the ranking stops being displayed.

```ruby
    def increment_access_count(id)
      redis.zincrby "entries/daily/#{Time.zone.today}", 1, id
    rescue SocketError => e
      logger.error e
    end
```

### Retrieving the Access Ranking

Using Redis's zrevrangebyscore, we fetch 10 IDs in descending order of score.
If nothing can be retrieved, it returns `[]`.
We tidy things up nicely with `decorate` and pass it to the View. ((the `decorate` code is omitted))

```ruby
    def access_ranking
      limit = 10
      ids = redis.zrevrangebyscore "entries/daily/#{Time.zone.today}", '+inf', 0, limit: [0, limit]
      if ids.any?
        where(id: ids).order(['field(id, ?)', ids]).limit(limit).decorate
      else
        []
      end
    rescue SocketError => e
      logger.error e
      []
    end
```

That's all.
