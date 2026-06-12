---
title: How to Extract Nested Keys from JSON in Fluent Bit
date: 2022-03-25
lang: en
translation_id: fluentbit-get-key-from-nested-list
permalink: en/2022/03/25/fluentbit-get-key-from-nested-list/
category: AWS
cover: https://i.imgur.com/zlOM1Ii.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

This post summarizes how I handled extracting nested keys from the container logs of an ECS Service.

The full implementation is available at https://github.com/kenzo0107/sample-fluentbit-get-nested-key.

<!-- more -->

## When you only want the contents of the key `log`

- Log

```json
{
  "log": {
    "a": "1",
    "b": "2"
  }
}
```

- [sample1.conf](https://github.com/kenzo0107/sample-fluentbit-get-nested-key/blob/main/sample1.conf)

```console
$ docker run --rm -it \
 -v $(PWD)/sample1.conf:/fluent-bit/etc/sample.conf \
 amazon/aws-for-fluent-bit:2.23.0 /fluent-bit/bin/fluent-bit \
 -c /fluent-bit/etc/sample.conf

...

[0] *-firelens-*: [1648191581.185935500, {"a"=>"1", "b"=>"2"}]
```

Extracted successfully.

## When you only want the contents of `b` inside the key `log`

```json
{
  "log": {
    "a": "1",
    "b": {
      "c": "2"
    }
  }
}
```

- [sample2.conf](https://github.com/kenzo0107/sample-fluentbit-get-nested-key/blob/main/sample2.conf)

```console
$ docker run --rm -it \
 -v $(PWD)/sample2.conf:/fluent-bit/etc/sample.conf \
 amazon/aws-for-fluent-bit:2.23.0 /fluent-bit/bin/fluent-bit \
 -c /fluent-bit/etc/sample.conf

...

[0] *-firelens-*: [1648192323.237149000, {"c"=>"2"}]
```

Extracted successfully.

## When you only want the contents of the list `b` inside the key `log` (part 2)

- Log

```json
{
  "log": {
    "a": "1",
    "b": [
      {
        "c": "2"
      }
    ]
  }
}
```

- [sample3.conf](https://github.com/kenzo0107/sample-fluentbit-get-nested-key/blob/main/sample3.conf)

```console
$ docker run --rm -it \
 -v $(PWD)/sample3.conf:/fluent-bit/etc/sample.conf \
 -v $(PWD)/test.lua:/fluent-bit/etc/test.lua \
 amazon/aws-for-fluent-bit:2.23.0 /fluent-bit/bin/fluent-bit \
 -c /fluent-bit/etc/sample.conf

...

[filter:nest:nest.1] Value of key 'b' is not a map. Will not attempt to lift from here
```

Because `b` is not a map type, it could not be extracted with `nest`.

### Handling it with a Lua script

We pass the records through the following Lua script to retrieve the contents of the `b` key.

- [test.lua](https://github.com/kenzo0107/sample-fluentbit-get-nested-key/blob/main/test.lua)

```
function cb_split(tag, timestamp, record)
    if record['b'] ~= nil  then
        return 2, timestamp, record['b']
    else
        return 2, timestamp, record
    end
end
```

- [sample4.conf](https://github.com/kenzo0107/sample-fluentbit-get-nested-key/blob/main/sample4.conf)

```
[Filter]
    Name   lua
    Match  *-firelens-*
    script test.lua
    call   cb_split
```

```console
$ docker run --rm -it \
 -v $(PWD)/sample4.conf:/fluent-bit/etc/sample.conf \
 -v $(PWD)/test.lua:/fluent-bit/etc/test.lua \
 amazon/aws-for-fluent-bit:2.23.0 /fluent-bit/bin/fluent-bit \
 -c /fluent-bit/etc/sample.conf

...

[0] *-firelens-*: [1648192853.650025200, {"c"=>"2"}]
```

Extracted successfully.

## Summary

Regarding the `Value of key 'xxx' is not a map. Will not attempt to lift from here` error,
I was able to handle it with a very simple script using the [Lua script](https://docs.fluentbit.io/manual/pipeline/filters/lua#lua-script) described in Fluent Bit's official manual.

That's all.
I hope you find this helpful.
