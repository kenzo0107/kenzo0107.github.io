---
layout: post
title: 'Handling the Nginx Error: a client request body is buffered to a temporary file'
date: 2015-10-19
category: Infrastructure
lang: en
translation_id: nginx-error-a-client-request-body-is-buffered-to-a-temporary-file
permalink: en/2015/10/19/nginx-error-a-client-request-body-is-buffered-to-a-temporary-file/
cover: /img/cover/2015-10-19-nginx-error-a-client-request-body-is-buffered-to-a-temporary-file.svg
tags:
- Nginx
---

## Overview

The following error occurred in Nginx.

I can't deny that the `[warn]` makes it look rather ominous, ha.

It's a warning telling you that the requested buffer size exceeds the configured amount, so a temporary file will be used.

```
[warn] 1493#1493: *210 a client request body is buffered to a temporary file /var/cache/nginx/client_temp/0000000001 ... request: "POST /article/save HTTP/1.1",
```

As a first step, I addressed it by changing the `configured amount` for that buffer size.

The mission was "just build it for now with a minimal configuration on a t2.micro!", so I set it to around 50k for the time being.

```
http {

    ...

    client_body_buffer_size 50k;

    ...

}
```

For now, the warning stopped being emitted with the configuration above.

If it starts being emitted again, I plan to use that figure as a basis to consider scaling up the instance.

By the way, the directory where the buffer is cached (`client_body_temp_path`) defaulted to `/var/cache/nginx/client`, so I left it unset.

That's all.
