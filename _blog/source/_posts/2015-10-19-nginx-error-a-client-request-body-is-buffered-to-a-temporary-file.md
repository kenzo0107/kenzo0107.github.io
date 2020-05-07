---
layout: post
title: Nginxエラー対策 a client request body is buffered to a temporary file
date: 2015-10-19
tags:
- Nginx
---

## 概要

Nginxで以下のようなエラーが発生

`[warn]`とあるしものものしさは否めない汗

要求されるバッファサイズが設定量より多く、一時ファイルを利用しますよ、
という警告です。

```
[warn] 1493#1493: *210 a client request body is buffered to a temporary file /var/cache/nginx/client_temp/0000000001 ... request: "POST /article/save HTTP/1.1",
```

そのバッファサイズの`設定量`を変更をしてまず対策しました。

取り急ぎ、t2.microで最小構成でとりあえず作れ！というミッションだったので
50kくらいにしておきました。

```
http {

    ...

    client_body_buffer_size 50k;

    ...

}
```

取り急ぎは上記設定でwarn は吐き出されないようになりました。

もしまた吐き出されるようになった場合は、
その数値を元にインスタンスのスケールアップも検討しようと思います。


ちなみにバッファのキャッシュ先ディレクトリ(`client_body_temp_path`)はデフォルトで`/var/cache/nginx/client`となっていたので設定しませんでした。


以上です。
