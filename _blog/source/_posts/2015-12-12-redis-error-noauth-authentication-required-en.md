---
layout: post
title: Redis - Dealing with (error) NOAUTH Authentication required
date: 2015-12-12
lang: en
translation_id: redis-error-noauth-authentication-required
permalink: en/2015/12/12/redis-error-noauth-authentication-required/
cover: /img/cover/2015-12-12-redis-error-noauth-authentication-required.svg
tags:
- Redis
---

## Overview

A Redis instance that had been running for years without any memory issues
suddenly started throwing connection errors, so I've summarized how I handled it.

## The Error

```
PHP Fatal error:  Uncaught exception 'RedisException' with message 'Failed to AUTH connection'
```

The authenticated connection failed and an Exception was thrown.

I hadn't set `requirepass` anywhere in the Redis configuration,
so it felt like "why all of a sudden?".

The path to the Redis config differs across environments, but in my case it was as follows:
/etc/redis/6379.conf

As shown below, `requirepass` is commented out.

```
# requirepass
```


## The Fix

- Kill the process
* Note: restarting Redis with something like `service redis restart` did not change the situation.

```
# ps aux | grep 'redis' | grep -v 'grep'

root     12743  0.1  0.2  40604  2124 ?        Ssl  10:50   0:00 /usr/local/bin/redis-server *:6379
```

- Start Redis again.
```
# service redis start
```

- Set requirepass

Since the system was in operation and I didn't want to touch the application's source code itself,
I set an empty `requirepass`.

```
redis-cli> CONFIG SET REQUIREPASS ''
```

The above was enough to handle the immediate situation without problems.

## Wrap-up

When using Redis again, it would be better to configure authentication
and have the application connect with a password specified as well.

That said, I'll continue investigating why this suddenly happened.

If anyone knows the reason, I'd be grateful for a comment.
