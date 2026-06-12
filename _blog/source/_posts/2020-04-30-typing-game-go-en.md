---
title: I Built a Typing Game in Go
category: Go
tags:
  - Go
date: 2020-04-30
lang: en
translation_id: typing-game-go
permalink: en/2020/04/30/typing-game-go/
cover: https://github.com/kenzo0107/typing-game-go/raw/master/logo.png
---

Thanks to Mercari's generosity, there was an announcement of a limited-time public release of "Complete Introduction to the Go Programming Language," so I dove right in!

<!-- more -->

{% linkPreview https://tech.mercari.com/entry/2020/03/17/120137 _blank %}

What I found really nice is that for each chapter, you get to write code in a hands-on style based on what you've learned and try out the usage right away.

So I built a typing game in Go, which was one of the exercises there ♪

It's a game where you type the words presented within a time limit, and your score goes up each time you get one right.

{% linkPreview https://github.com/kenzo0107/typing-game-go _blank %}

### What I Did

#### Presenting the Words

Use [tjarratt/babble](github.com/tjarratt/babble) to fetch a random word to present and print it to standard output.

```go
import (
  ...
	"github.com/tjarratt/babble"
)

func init() {
  ...
  babbler = babble.NewBabbler()
  babbler.Count = 1 // 1ワードに設定.
}

// 出題
func q() {
	question = babbler.Babble()
	fmt.Println("\ntype this: ", question)
	fmt.Print("> ")
}
```

#### Countdown Before the Game Starts

```go
func _main() {
	// ゲーム開始前の 3,2,1 Go 表示
  countdown()
  ...
}

func countdown() {
	for i := 3; i > 0; i-- {
		fmt.Print(i)
		fmt.Print(" ")
		time.Sleep(time.Second)
	}
	fmt.Println("Go !")
}
```

#### Timeout Handling with context.WithTimeout

Using the for-select pattern, channels are created indefinitely so they can be received.
Time limit.

```go
// タイムアウト処理付き context
bc := context.Background()
ctx, cancel := context.WithTimeout(bc, d)
defer cancel()

...

for {
		select {
    case <-ctx.Done():  // タイムアウト
        fmt.Println("\n\ntime up !")
			  fmt.Println("score:", score)
        return
    ...
    }
}
```

#### Reading a String from Standard Input and Sending It to a chan

Since the for-select pattern is waiting, the process of reading a string from standard input is issued indefinitely.
The timeout context cuts these off so that they can no longer run.

```go
func input(r io.Reader) <-chan string {
	ch := make(chan string)
	go func() {
		// 標準入力から一行ずつ文字を読み込む
		s := bufio.NewScanner(r)
		for s.Scan() {
			ch <- s.Text()
		}
		close(ch)
	}()
	return ch
}
```

## Things I'd Like to Try!

- I want to play sounds during the game
- Like in PC typing games, I want to make enemies appear and have them take damage each time you type correctly

These are the kinds of things I'd like to try with Go.

Is this where [ebiten](https://github.com/hajimehoshi/ebiten) comes in!?

I'll keep going with the introduction ♪

That's all.
I hope you find this helpful.
