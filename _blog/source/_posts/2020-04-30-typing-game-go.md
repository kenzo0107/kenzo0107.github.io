---
title: Go でタイピングゲーム作った
category: Go
tags:
- Go
date: 2020-04-30
thumbnail: https://github.com/kenzo0107/typing-game-go/raw/master/logo.png
---

メルカリさんのご好意で「プログラミング言語Go完全入門」の期間限定公開のお知らせがあり、早速入門しました！
<!-- more -->

{% linkPreview https://tech.mercari.com/entry/2020/03/17/120137 _blank %}

とても良いなと思ったのは、各章毎、学んだことをハンズオン形式でプログラミングして都度使い方を試せるところかなと思います。

そこにお題としてあった Go でタイピングゲームを作りました♪

時間制限内に出題されたワードをタイピングし正解する毎にすこアップする、というゲームです。

{% linkPreview https://github.com/kenzo0107/typing-game-go _blank %}

### やったこと

#### お題を出す

[tjarratt/babble](github.com/tjarratt/babble) でランダムにお題とするワードを取得し標準出力

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

#### ゲーム開始前のカウントダウン

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

#### context.WithTimeout でタイムアウト処理

for-select パターンで無限にチャネルを作り、受け取れる様にしています。
時間制限

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

#### 標準入力から文字列取得し chan に送信

for-select パターンが待ち受けているので、無限に標準入力からの文字列取得処理が発行されます。
タイムアウト context によって、これらの処理ができなくなる様、打ち切られます。

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

## こんなことやってみたい！

* ゲーム中に音を出したい
* PCタイピングゲームの様に敵が現れ、正しくタイピングする度に敵がダメージを受けている様なアクションをさせたい

こんなことを Go でやってみたいです。

[ebiten](https://github.com/hajimehoshi/ebiten) の出番か！？

引き続き入門続けます♪

以上
参考になれば幸いです。
