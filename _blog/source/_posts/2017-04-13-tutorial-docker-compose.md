---
layout: post
title: Docker Compose チュートリアル
date: 2017-04-13
tags:
- Docker
thumbnail: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170414/20170414222435.png
---

前回 Vagrant (Ubuntu)で Docker, Docker Compose 環境構築しました。

{% linkPreview http://kenzo0107.hatenablog.com/entry/2017/04/13/225610 _blank %}


上記環境を元に [Docker Compose チュートリアル](https://docs.docker.com/compose/gettingstarted/#step-1-setup)を実行しました。

完全な備忘録です。

## プロジェクトディレクトリ作成

```
vagrant%$ mkdir composetest && cd composetest
```

## app.py 作成

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

## requirements.txt 作成

pip でインストールするモジュールを列挙します。

```
flask
redis
```

## Dockerfile 作成

```Dockerfile
FROM python:3.4-alpine
ADD . /code
WORKDIR /code
RUN pip install -r requirements.txt
CMD ["python", "app.py"]
```

## docker-compose.yml 作成

```yml
version: '2'
services:

  web:
    build: .
    ports:
     - "5000:5000"
    volumes:
     - .:/code

  redis:
    image: "redis:alpine"
```

## Docker Compose でイメージビルド、コンテナ起動

```
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
```

ブラウザにアクセスしてみる。

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170413/20170413233236.png" width="100%">
</div>

表示されました！

リロードする度に以下数字部分がインクリメントされるのが確認できます。
```
Hello from Docker! I have been seen 1 times.
```

便利♪
