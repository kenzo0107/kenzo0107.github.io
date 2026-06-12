---
layout: post
title: Docker Compose Tutorial
date: 2017-04-13
category: Infrastructure
lang: en
translation_id: tutorial-docker-compose
permalink: en/2017/04/13/tutorial-docker-compose/
tags:
  - Docker
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170414/20170414222435.png
---

Last time, I set up a Docker and Docker Compose environment on Vagrant (Ubuntu).

{% linkPreview http://kenzo0107.hatenablog.com/entry/2017/04/13/225610 _blank %}

Based on that environment, I worked through the [Docker Compose tutorial](https://docs.docker.com/compose/gettingstarted/#step-1-setup).

This is purely a memo for my own reference.

## Create the project directory

```
vagrant%$ mkdir composetest && cd composetest
```

## Create app.py

```python
from flask import Flask
from redis import Redis

app = Flask(__name__)
redis = Redis(host='redis', port=6379)

@app.route('/')
def hello():
    count = redis.incr('hits')
    #return 'Hello World! I have been seen {} times.\n'.format(count)
    return 'Hello from Docker! I have been seen {} times.\n'.format(count)

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
```

## Create requirements.txt

List the modules to install with pip.

```
flask
redis
```

## Create the Dockerfile

```Dockerfile
FROM python:3.4-alpine
ADD . /code
WORKDIR /code
RUN pip install -r requirements.txt
CMD ["python", "app.py"]
```

## Create docker-compose.yml

```yml
version: '2'
services:
  web:
    build: .
    ports:
      - '5000:5000'
    volumes:
      - .:/code

  redis:
    image: 'redis:alpine'
```

## Build the image and start the containers with Docker Compose

````
vagrant%$ docker-compose up

Creating composetest_web_1
Creating composetest_redis_1
Attaching to composetest_redis_1, composetest_web_1
redis_1  | 1:C 13 Apr 14:25:38.483 # Warning: no config file specified, using the default config. Inorder to specify a config file use redis-server /path/to/redis.conf
redis_1  |                 _._
redis_1  |            _.-``__ ''-._
redis_1  |       _.-``    `.  `_.  ''-._           Redis 3.2.8 (00000000/0) 64 bit
redis_1  |   .-`` .-```.  ```\/    _.,_ ''-._
redis_1  |  (    '      ,       .-`  | `,    )     Running in standalone mode
redis_1  |  |`-._`-...-` __...-.``-._|'` _.-'|     Port: 6379
redis_1  |  |    `-._   `._    /     _.-'    |     PID: 1
redis_1  |   `-._    `-._  `-./  _.-'    _.-'
redis_1  |  |`-._`-._    `-.__.-'    _.-'_.-'|
redis_1  |  |    `-._`-._        _.-'_.-'    |           http://redis.io
redis_1  |   `-._    `-._`-.__.-'_.-'    _.-'
redis_1  |  |`-._`-._    `-.__.-'    _.-'_.-'|
redis_1  |  |    `-._`-._        _.-'_.-'    |
redis_1  |   `-._    `-._`-.__.-'_.-'    _.-'
redis_1  |       `-._    `-.__.-'    _.-'
redis_1  |           `-._        _.-'
redis_1  |               `-.__.-'
redis_1  |
redis_1  | 1:M 13 Apr 14:25:38.486 # WARNING: The TCP backlog setting of 511 cannot be enforced because /proc/sys/net/core/somaxconn is set to the lower value of 128.
redis_1  | 1:M 13 Apr 14:25:38.486 # Server started, Redis version 3.2.8
redis_1  | 1:M 13 Apr 14:25:38.486 # WARNING overcommit_memory is set to 0! Background save may failunder low memory condition. To fix this issue add 'vm.overcommit_memory = 1' to /etc/sysctl.conf andthen reboot or run the command 'sysctl vm.overcommit_memory=1' for this to take effect.
redis_1  | 1:M 13 Apr 14:25:38.486 * The server is now ready to accept connections on port 6379
web_1    |  * Running on http://0.0.0.0:5000/ (Press CTRL+C to quit)
web_1    |  * Restarting with stat
web_1    |  * Debugger is active!
web_1    |  * Debugger PIN: 135-466-976
web_1    | 192.168.35.1 - - [13/Apr/2017 14:25:53] "GET / HTTP/1.1" 200 -
web_1    | 192.168.35.1 - - [13/Apr/2017 14:25:53] "GET /favicon.ico HTTP/1.1" 404 -
````

Let's try accessing it in a browser.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170413/20170413233236.png" width="100%">
</div>

It works!

You can see the number below incrementing each time you reload.

```
Hello from Docker! I have been seen 1 times.
```

Handy ♪
