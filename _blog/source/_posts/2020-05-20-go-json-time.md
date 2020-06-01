---
title: Go で時刻を json.Unmarshal する際の注意点
tags:
- Go
date: 2020-05-07
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

## とある 3rd Party の API のお話

とある 3rd Party の API を go で取り扱っていた所、以下の様な json を返す API がありました。

```json
{
    ...
    "created": "1981-01-07T17:44:13Z"
    ...
}
```

json を struct に格納する時に `json.Unmarshal` するとどんなフォーマットで返ってくるでしょう？

```go
type Hoge struct {
	Created time.Time `json:"created"`
}

func main() {
    var hoge Hoge
	j := []byte(`{"created": "1981-01-07T17:44:13Z"}`)
	if err := json.Unmarshal(j, &hoge); err != nil {
		log.Fatal(err)
	}
    t := hoge.Created
    fmt.Println(t) // 1981-01-07 17:44:13 +0000 UTC
}
```

[The Go Playground](https://play.golang.org/p/QdHzmAwZ52B)

フォーマットは `1981-01-07 17:44:13 +0000 UTC` でした。

#### フォーマットどこで定義してるんだろう？

コードを追ってみると、 `*time.Time` のレシーバ `UnmarshalJSON` で `RFC3339` を決め打ちで `time.Parse` しています。

参照: [golang.org/src/time/time.go](https://golang.org/src/time/time.go)

```go
// UnmarshalJSON implements the json.Unmarshaler interface.
// The time is expected to be a quoted string in RFC 3339 format.
func (t *Time) UnmarshalJSON(data []byte) error {
	// Ignore null, like in the main JSON package.
	if string(data) == "null" {
		return nil
	}
	// Fractional seconds are handled implicitly by Parse.
	var err error
	*t, err = Parse(`"`+RFC3339+`"`, string(data))
	return err
}
```

つい `encoding/json` の方を探してしまった 汗

## フォーマットを自由に扱うにはどうする？

独自型を定義しました。

```go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"
	"bytes"
)

type Hoge struct {
	Created JSONTime `json:"created"`
}

// JSONTime exists so that we can have a String method converting the date
type JSONTime string

// String converts the unix timestamp into a string
func (t JSONTime) String() string {
	tm := t.Time()
	return fmt.Sprintf("\"%s\"", tm.Format(time.RFC3339))
}

// Time returns a `time.Time` representation of this value.
func (t JSONTime) Time() time.Time {
	tt, _ := time.Parse(time.RFC3339, string(t))
	return tt
}

// UnmarshalJSON will unmarshal both string and int JSON values
func (t *JSONTime) UnmarshalJSON(buf []byte) error {
	s := bytes.Trim(buf, `"`)
	*t = JSONTime(string(s))
	return nil
}

func main() {
	var hoge Hoge
	j := []byte(`{"created": "1981-01-07T17:44:13Z"}`)
	if err := json.Unmarshal(j, &hoge); err != nil {
		log.Fatal(err)
	}
	t := hoge.Created
	fmt.Println(t) 		// "1981-01-07T17:44:13Z"
	fmt.Println(t.Time())	// 1981-01-07 17:44:13 +0000 UTC
}
```

[The Go Playground](https://play.golang.org/p/RyqpQwEEEah)

* API のレスポンスを独自型 `type JSONTime string` で受ける
* 時刻の計算や比較をしたい場合は `t.Time()` で `time.Time` を返して計算

という具合に都合が良いです。

## その他、実例 Slack API usergroups.create

Slack API [usergroups.create](https://api.slack.com/methods/usergroups.create) では、レスポンスに `date_create` が `1446746793` と timestamp で返ってくるので、 `type JSONTime int64` とすると良い。

```go
// JSONTime exists so that we can have a String method converting the date
type JSONTime int64

// String converts the unix timestamp into a string
func (t JSONTime) String() string {
	tm := t.Time()
	return fmt.Sprintf("\"%s\"", tm.Format("Mon Jan _2"))
}

// Time returns a `time.Time` representation of this value.
func (t JSONTime) Time() time.Time {
	return time.Unix(int64(t), 0)
}

// UnmarshalJSON will unmarshal both string and int JSON values
func (t *JSONTime) UnmarshalJSON(buf []byte) error {
	s := bytes.Trim(buf, `"`)

	v, err := strconv.Atoi(string(s))
	if err != nil {
		return err
	}

	*t = JSONTime(int64(v))
	return nil
}
```

## まとめ

* `*time.Time` のレシーバ `UnmarshalJSON` はフォーマット `RFC3339` で返す。
* 任意のフォーマットにするには、独自型を作成しレシーバ `UnmarshalJSON` を設定し、Parse 時にフォーマット指定する。


以上参考になれば幸いです。

## 参考

[slack-go/slack の JSONTime 定義](https://github.com/slack-go/slack/blob/master/info.go#L391-L416)
