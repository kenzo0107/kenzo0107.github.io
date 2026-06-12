---
title: Things to Watch Out for When Using json.Unmarshal with Time in Go
category: Go
tags:
- Go
date: 2020-05-20
lang: en
translation_id: go-json-time
permalink: en/2020/05/20/go-json-time/
cover: /img/cover/2020-05-20-go-json-time.svg
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

## A Story About a Certain 3rd Party API

While working with a certain 3rd party API in Go, I came across an API that returned JSON like the following.

```json
{
    ...
    "created": "1981-01-07T17:44:13Z"
    ...
}
```

When you store this JSON into a struct with `json.Unmarshal`, what format does it come back in?

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

The format turned out to be `1981-01-07 17:44:13 +0000 UTC`.

#### Where is the format defined?

Following the code, the `UnmarshalJSON` receiver on `*time.Time` hardcodes `RFC3339` and calls `time.Parse` with it.

Reference: [golang.org/src/time/time.go](https://golang.org/src/time/time.go)

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

I ended up searching the `encoding/json` package by mistake, oops.

## How Can You Handle the Format Freely?

I defined a custom type.

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

* Receive the API response into a custom type `type JSONTime string`
* When you want to do calculations or comparisons on the time, call `t.Time()` to get a `time.Time` and compute with that

This setup is quite convenient.

## Another Real-World Example: Slack API usergroups.create

The Slack API [usergroups.create](https://api.slack.com/methods/usergroups.create) returns `date_create` in the response as a timestamp like `1446746793`, so using `type JSONTime int64` works well.

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

## Summary

* The `UnmarshalJSON` receiver on `*time.Time` returns the value in the `RFC3339` format.
* To use an arbitrary format, create a custom type, define an `UnmarshalJSON` receiver on it, and specify the format when parsing.


I hope this is helpful.

## References

[slack-go/slack JSONTime definition](https://github.com/slack-go/slack/blob/master/info.go#L391-L416)
