---
title: fluentbit エラー 「Value of key 'xxx' is not a map. Will not attempt to lift from here」対応
date: 2022-03-13
category: AWS
thumbnail: https://i.imgur.com/zlOM1Ii.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

ECS Service のコンテナログからネストされたキーの取得をどのように対応したかをまとめました。

実施内容は https://github.com/kenzo0107/sample-fluentbit-get-nested-key にてまとめています。

## キー log の中身だけ欲しい場合

- ログ

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

抽出できました。

## キー log の中の b の中身だけ欲しい場合

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

抽出できました

## キー log の b のリストの中身だけ欲しい場合 その 2

- ログ

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

b は map 型でなく nest では抽出できませんでした。

### lua スクリプトで対応

以下 lua スクリプトをかませて b キーの中身を取得します。

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

抽出できました。

## まとめ

`Value of key 'xxx' is not a map. Will not attempt to lift from here` エラーについて
fluentbit の公式マニュアルにある [Lua script](https://docs.fluentbit.io/manual/pipeline/filters/lua#lua-script) で非常にシンプルなスクリプトで対応できました。

以上
参考になれば幸いです。
