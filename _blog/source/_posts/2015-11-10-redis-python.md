---
layout: post
title: Use Redis via Python
date: 2015-11-10
tags:
- Redis
- Python
---

## Memorandum

The below codes is how to use redis via Python.

```python
#!/usr/bin/python
# coding: UTF-8

import redis

r = redis.StrictRedis(host='localhost', port=6379)

# set/get string.
r.set('test1', 'aiueo')
r.expire('test1', 1000)
print r.get('test1')     # aiueo

# set/get integer.
r.set('test2', 2)
print r.get('test2')    # 2

# Check key exit.
print r.exists('test1') # True
print r.exists('test0') # False

# pattern match
keys = r.keys('test*')
if len(keys) > 0 :
	for key in keys:
		print '--------------------------------------------'
		print key			# test1, test2
		print r.get(key) 	# aiueo, 2
		print r.type(key)	# Type : string, string
		print r.ttl(key)    # Expire : if not set, set "-1"

r.append('test1', '_kkkkkkk')
print r.get('test1')   # aiueo_kkkkkkk

# delete cache.
r.delete('test1')
print r.exists('test1') # False

```

Thanks.
