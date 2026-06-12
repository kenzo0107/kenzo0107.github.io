---
title: How to Avoid os.Exit(1) in init() During go test in Go
category: Go
tags:
  - Go
date: 2021-02-01
lang: en
translation_id: avoid-go-init-osexit
permalink: en/2021/02/01/avoid-go-init-osexit/
cover: https://i.imgur.com/YWgqCWD.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

<!-- more -->

## Overview

While building an AWS Lambda Go project with SAM, I wrote the logic that retrieves values from Parameter Store inside `init()`.

The reason was to cache the result of retrieving values from Parameter Store and reuse it, thereby saving on the execution cost of consecutive Lambda invocations.

For details, see the AWS Lambda best practices.

https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/best-practices.html

> Take advantage of execution environment reuse to improve the performance of your function. Initialize SDK clients and database connections outside of the function handler, and cache static assets locally in the /tmp directory. Subsequent invocations processed by the same instance of your function can reuse these resources. This saves execution time and cost.

I wanted to cache the logic that retrieves secrets from Parameter Store in `init()` and save cost, as shown below.

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

Regarding the code above:
I run `go test` on GitHub Actions for testing, but
`log.Fatal` triggers `os.Exit(1)` and the process halts.

The error says that no credentials are configured.

```
NoCredentialProviders: no valid providers in chain. Deprecated.
	For verbose messaging see aws.Config.CredentialsChainVerboseErrors
```

Even if I set dummy credentials in GitHub Actions, it still fails.

```
run: go test -v -count=1 -race -cover -coverprofile=coverage ./...
env:
    AWS_ACCESS_KEY_ID: ADUMMYDUMMYDUMMYDUMD
    AWS_SECRET_ACCESS_KEY: DummyDummyDummyDummyDummyDummyDummyDummy
```

If you give up on caching in `init()` and handle it in the `handler` instead, the handling is simple.

But "saving cost" just won't leave my mind. I'm a weak person.

Can't I avoid this `os.Exit(1)` at least only when running `go test`? With that in mind, I gave it a try.

## Verification

Suppose we have a main.go file like the following.
Let's verify how to avoid the `log.Fatal` in `init()` when running `go test`.

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

If you run `go test` without any special handling, `log.Fatal` inside `init()` triggers `os.Exit(1)` and the process is forcibly terminated.
The test cannot complete.

It would be nice if we could set `var n = 1` only during test execution, but...

## Verifying whether main_test.go can override the behavior in main.go

To begin with, what is the order of execution? Let me verify that first.

Reference: https://github.com/kenzo0107/go-sample-order

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

Let's run `go test`.
The order of execution was as follows.

1. pkg.var
2. pkg.init
3. main.var
4. main.init
5. test.init
6. test.setup

From this, no processing in `main_test.go` can run before `main.init`.

Overriding the variable `var n` in `main.go` from `main_test.go` seems difficult.

## Controlling it with an environment variable only during test execution

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

Replace `log.Fatal` with a function called `logFatal` that performs the following behavior.

- The environment variable TEST exists → log a message with `log.Println` and do NOT execute `os.Exit(1)`
- The environment variable TEST does not exist → execute `os.Exit(1)` and forcibly stop

Run main.go.

```
＄ go run main.go

main.var
main.init
2021/01/28 00:10:00 error
exit status 1
```

Set the environment variable TEST=1 and run `go test`.

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

We successfully avoided `os.Exit(1)` inside `init()`, and the process continued to run.

The GitHub Actions configuration is also a simple setup.

```
      - name: Test
        run: go test -v -count=1 -race -cover -coverprofile=coverage ./...
        env:
          # NOTE: テストのみ init() で os.Exit 実行回避する為に設定している。
          TEST: true
```

You could also fiddle with `os.Args` instead of an environment variable to decide whether `go test` is running, but the environment variable approach is simple to implement and can be reused for other purposes, so I'd say it's LGTM.

## Summary

Perhaps you shouldn't do error handling in `init()` in the first place.

As mentioned in the link below, having the logic in `init()` fail and then not running the subsequent `main()` logic doesn't seem like a bad approach.

https://stackoverflow.com/questions/33885235/should-a-go-package-ever-use-log-fatal-and-when?answertab=votes#tab-top

That said, manipulating behavior with an environment variable as I did here does feel a bit lacking in elegance.

I hope you'll keep in mind, somewhere in your heart, that this kind of approach exists for when there are unavoidable circumstances. With that, I'll lay down my pen here.

Thank you for reading.

## Postscript

In the official AWS documentation, the error in `init()` is just swallowed!
https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/golang-handler.html

I wonder how they intend to test the case where an error occurs?
Maybe they'll just tell me "an error will absolutely never happen!"
