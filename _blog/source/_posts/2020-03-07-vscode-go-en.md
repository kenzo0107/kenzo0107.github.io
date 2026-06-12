---
title: VS Code's Go Generate Unit Test Was Super Handy ♪
category: Go
tags:
  - Go
date: 2020-03-07
lang: en
translation_id: vscode-go
permalink: en/2020/03/07/vscode-go/
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20200307/20200307221234.png
---

When writing tests in Go, I found that VS Code's [Go extension](https://code.visualstudio.com/docs/languages/go) has a feature that easily generates the format for unit tests, and it turned out to be incredibly handy.

Let's say you have a main.go file like the following.

<!-- more -->

```go
package main

func hello(s string) string {
	if s == "" {
		return "world"
	}
	return s
}
```

Click on the function name to place your cursor there, then open the command palette (Command + Shift + p on Mac).

Type `Go: Generate Unit Tests For Function` and press Enter, and

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20200307/20200307221234.png" width="100%">
</div>

the following main_test.go gets generated.

```go
package main

import "testing"

func Test_hello(t *testing.T) {
	type args struct {
		s string
	}
	tests := []struct {
		name string
		args args
		want string
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := hello(tt.args.s); got != tt.want {
				t.Errorf("hello() = %v, want %v", got, tt.want)
			}
		})
	}
}
```

The fact that the function name becomes snake_case (Test_hello) is a bit bothersome, but this seems to happen when the function under test starts with a lowercase letter.

The format manages the information needed for test cases in a struct and iterates over them with a for loop.

[TABLE DRIBEN TESTS](https://speakerdeck.com/mitchellh/advanced-testing-with-go?slide=15)

The arguments of `func hello(string)` are specified in args.

```
type args struct {
	s string
}
```

If the test target were `func(string, int)`, it would change to the following.

```
type args struct {
	s string
	i int
}
```

Write the test like the following,

```
package main

import "testing"

func TestHello(t *testing.T) {
	type args struct {
		s string
	}
	tests := []struct {
		name string
		args args
		want string
	}{
		{
			name: "return 'hello' if you set 'hello'",
			args: args{
				"hello",
			},
			want: "hello",
		},
		{
			name: "空文字を指定したら world が返ってくる",
			args: args{
				"",
			},
			want: "world",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := hello(tt.args.s); got != tt.want {
				t.Errorf("hello() = %v, want %v", got, tt.want)
			}
		})
	}
}
```

When you run the tests, you can check whether each named test PASSes.

Half-width spaces are converted to \_.

```
$ go test -count 1 -v .

$ go test -count 1 -v ./hoge
=== RUN   TestHello
=== RUN   TestHello/return_'hello'_if_you_set_'hello'
=== RUN   TestHello/空文字を指定したら_world_が返ってくる
--- PASS: TestHello (0.00s)
    --- PASS: TestHello/return_'hello'_if_you_set_'hello' (0.00s)
    --- PASS: TestHello/空文字を指定したら_world_が返ってくる (0.00s)
PASS
ok      github.com/kenzo0107/hoge      0.212s
```

Handy ♪

By the way, there are other `Go: Generate` options as well.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20200307/20200307224351.png" width="100%">
</div>

I hope this helps when writing Go tests in VS Code.
That's all.
