---
title: Go で init() 内の os.Exit(1) を go test で回避する方法
category: Go
tags:
- Go
date: 2021-02-01
thumbnail: https://i.imgur.com/YWgqCWD.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

## 概要

AWS Lambda Go プロジェクトを SAM で構築していた際、
パラメータストアから取得する処理を `init()` に記述しました。

理由はパラメータストアから取得する処理をキャッシュし、再利用することで連続 Lambda の実行コストを節約する為です。

詳細は AWS Lambda ベストプラクティス参照

https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/best-practices.html
> 実行環境の再利用を活用して関数のパフォーマンスを向上させます。 関数ハンドラー外で SDK クライアントとデータベース接続を初期化し、静的なアセットを /tmp ディレクトリにローカルにキャッシュします。関数の同じインスタンスで処理された後続の呼び出しは、これらのリソースを再利用できます。これにより、実行時間とコストが節約されます。

以下の様に `init()` でパラメータストアから秘匿情報を取得する処理をキャッシュし、コスト節約したいと考えました。

```main.go
func init() {
	sess := session.Must(session.NewSession(&aws.Config{
		Region: aws.String("ap-northeast-1"),
	}))

     // NOTE: パラメータストアから秘匿情報を取得する
     // see: https://gist.github.com/kenzo0107/10654b09fb7b0ca889e807d27b646d09
	ssmClient := awsapi.NewSSMClient(ssm.New(sess))

	s, err := ssmClient.GetSSMParameters([]string{
		"secret",
	})
	if err != nil {
		log.Fatal(err)
	}
```

上記コードについて
GitHub Actions で `go test` を実行しテストをしていますが、
`log.Fatal` で `os.Exit(1)` 発生し処理が停止します。

credentials が設定されてないというエラーです。
```
NoCredentialProviders: no valid providers in chain. Deprecated.
	For verbose messaging see aws.Config.CredentialsChainVerboseErrors
```

GitHub Actions でダミーの credentials を設定しても失敗します。

```
run: go test -v -count=1 -race -cover -coverprofile=coverage ./...
env:
    AWS_ACCESS_KEY_ID: ADUMMYDUMMYDUMMYDUMD
    AWS_SECRET_ACCESS_KEY: DummyDummyDummyDummyDummyDummyDummyDummy
```

`init()` でのキャッシュを諦めて、 `handler` で処理するとハンドリングは簡単です。

ですが、「コスト節約」が頭から離れません。自分は弱い人間です。

`go test` 実行する時だけでも、この `os.Exit(1)` を回避できないものか？ということで検証してみました。

## 検証

以下の様な main.go ファイルがあるとします。
`go test` 実行時に `init()` の `log.Fatal` をどう回避するか、検証します。

```main.go
var n = 0

func init() {
    if err := doSomething(n); err != nil {
        log.Fatal("error")
    }
}

func doSomething() error {
    if n == 0 {
        return errors.New("error")
    }
    return nil
}

func handler() int {
    return 0
}

func main() {
    os.Exit(handler())
}
```

特に何も意識せず `go test` すると `init()` 内の `log.Fatal` で `os.Exit(1)` が発生し強制終了される。
テストが完結しない。

テスト実行時にだけ `var n = 1` とできたら良さそうだが、、、

## main_test.go で main.go の処理を上書きできるか検証する

そもそも処理順序はどうなっているのか、まず検証してみた。

参考: https://github.com/kenzo0107/go-sample-order

```pkg/pkg.go
package pkg

// SampleVar : sample variable in pkg
var SampleVar = defaultVar()

func defaultVar() int {
	println("pkg.var")
	return 1
}

func init() {
	println("pkg.init")
}
```

```main.go

import "github.com/kenzo0107/go-sample-order/pkg"

var someVar = defaultVar()

func init() {
	println(pkg.SampleVar)
	println("main.init")
}

func main() {
	println("main.main")
}

func defaultVar() int {
	println("main.var")
	return 2
}
```

```main_test.go
func init() {
    println("test.init")
}

func setup() {
    println("test.setup")
}

func TestMain(m *testing.M) {
	setup()
	m.Run()
}
```


`go test` を実行してみます。
処理順序は以下の通りでした。

1. pkg.var
2. pkg.init
3. main.var
4. main.init
5. test.init
6. test.setup

以上から `main_test.go` での如何なる処理も `main.init` より先に実行できません。

`main_test.go` で `main.go` の変数 `var n` を上書きする処理は難しそうです。


## テスト実行時のみ環境変数で制御する

```
func init() {
    ...
    logFatal("error")
}

func logFatal(err error) {
	log.Println(err)
	if os.Getenv("TEST") != "" {
		return
	}
	os.Exit(1)
}

...
```

`log.Fatal` を `logFatal` という関数に置換し、以下処理を実行する様にします。

* 環境変数 TEST が存在する → `log.Println`  でログを残し、 `os.Exit(1)` を実行しない
* 環境変数 TEST が存在しない → `os.Exit(1)` 実施し強制停止

main.go を実行します。
```
＄ go run main.go

main.var
main.init
2021/01/28 00:10:00 error
exit status 1
```

環境変数 TEST=1 を設定し `go test` を実行してみる。
```
$ TEST=1 go test -v .

main.var
main.init
2021/01/28 00:20:00 error
test.init
test.setup
testing: warning: no tests to run
PASS
coverage: 83.3% of statements
ok      github.com/kenzo0107/sample  0.345s  coverage: 83.3% of statements [no tests to run]
```

無事 `init()` 内の `os.Exit(1)` を回避し処理が継続して実行されました。


GitHub Actions の設定も簡易的な設定です。
```
      - name: Test
        run: go test -v -count=1 -race -cover -coverprofile=coverage ./...
        env:
          # NOTE: テストのみ init() で os.Exit 実行回避する為に設定している。
          TEST: true
```

環境変数でなく `os.Args` をゴニョゴニョして `go test` の実行を判断もできそうですが、実装的にはシンプルで用途としても他で使えるので LGTM かなと。

## まとめ

本来 `init()` でエラーハンドリングをすべきではないのかもしれません。

以下にも言及されていましたが、 `init()` の処理で失敗したら以降の `main()` の処理を実行しない、
というのは悪い処理でないように思います。

https://stackoverflow.com/questions/33885235/should-a-go-package-ever-use-log-fatal-and-when?answertab=votes#tab-top

とはいえ、今回の環境変数で処理を操作、というのはややエレガントさに欠ける気持ちはあります。

やんごとなき事情がある場合にこの様な処理がある、ということを心のどこかに留めていただきたく、
ここで筆を置きたいと思います。

ご清聴ありがとうございました。


## 追伸

AWS 公式のドキュメントだと `init()` で err を握り潰している！
https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/golang-handler.html

エラーが発生する場合のテストどうするつもりだろう？
絶対エラー起きないんで！って言われるかな〜
