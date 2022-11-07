---
title: Go 静的解析 & 単体テスト on GitHub Actions
category: Go
tags:
  - Go
date: 2019-12-26
comments: true
---

以前、複数の AWS Account EC2 インスタンスへの接続を EC2 Instance Connect を使用しインタラクティブに ssh 接続できるツールを作成しました。

<!-- more -->

[EC2 Instance Connect API で ssh ログインできるインタラクティブ cli tool "omssh" を作ってみました。](https://kenzo0107.hatenablog.com/entry/2019/08/04/180149)

自分用にチャチャッと作ってアップしたもので手元でしかテストしておらず 、 lint や test もしてなかったのですが、

- 後学の為、改めて lint, test した上でコードを管理できる様になりたい
- 自分のリポジトリとして公開しているし、愛情持ちたい

という気持ちで取り組んでみたいと思いました。

## 成果物

[kenzo0107/omssh](https://github.com/kenzo0107/omssh)

## 静的解析 on GitHub Actions

[grandcolline/golang-github-actions](https://github.com/grandcolline/golang-github-actions) を利用させていただきまして以下解析しました。

- [goimports](golang.org/x/tools/cmd/goimports)
- [errcheck](github.com/kisielk/errcheck)
- [golint](golang.org/x/lint/golint)
- [shadow](golang.org/x/tools/go/analysis/passes/shadow/cmd/shadow)
- [staticcheck](honnef.co/go/tools/staticcheck)
- [gosec](github.com/securego/gosec/cmd/gosec)

GitHub Actions での設定ファイルは以下です。

[kenzo0107/static_check_go.yaml](https://gist.github.com/kenzo0107/4bdac92908244222f441c1b04f3b7c5a)

## 開発時にも静的解析

開発時に解析できる様、 Makefile に設定しました。

```
.PHONY: lint
lint: devel-deps
	go vet ./...
	go vet -vettool=$(shell which shadow)
	staticcheck ./...
	errcheck ./...
	# exclude G106: Audit the use of ssh.InsecureIgnoreHostKey
	gosec -quiet -exclude=G106 ./...
	golint -set_exit_status ./...
```

goimports に関してはエディタの設定で保存時にチェックする様にしてます。

実際に設定して動かしてみたらわかりやすいですが、以下にどんなことを指摘してくるかまとめます。

### go vet ./...

構文エラーを指摘してくれます。

```go
a := fmt.Sprintf("%s", 1)
fmt.Println(a)
```

### go vet -vettool=$(shell which shadow)

スコープの外側で定義した変数と同名の変数がスコープの内部で使用されている場合に警告されます。

潜在的にエラーが発生する可能性があり、変数名を変更する等の対応が必要です。

```go
func hoge() error {
	err := errors.New("error occured")
	{
		err := errors.New("error occured")
		if err != nil {
			return err
		}
	}

	if err != nil {
		return err
	}
	return nil
}
```

```sh
./main.go:14:3: declaration of "err" shadows declaration at line 12
```

上記の場合、以下の様にスコープ内でスコープ外の変数を利用することで回避できます。

```go
	err := errors.New("error occured")
	{
		err = errors.New("error occured")
```

ですが、この場合だと最初は `err :=` で定義し、その後は `err =` で定義しなければならず、わかりづらいので、
変数 err を定義した直後に処理を実施する様にすると回避できます。

```
func hoge() error {
	err := errors.New("error occured")
	if err != nil {
		return err
	}

	{
		err := errors.New("error occured")
		if err != nil {
			return err
		}
	}
	return nil
}
```

### staticcheck ./...

バグの検出、コードの簡素化の提案、デッドコードの指摘などをしてくれます。

以下のコードで `staticcheck ./...` を実行すると

```go
import "github.com/aws/aws-sdk-go/aws/session"
...

session.New(&config)
```

session.New 使うのは非推奨だよ、と警告してくれました。

deprecated を指摘してくれるのありがたい！

```sh
session.New is deprecated: Use NewSession functions to create sessions instead. NewSession has the same functionality as New except an error can be returned when the func is called instead of waiting to receive an error until a request is made.  (SA1019)
```

以下の様に修正することで、対応できました。

```go
session.Must(session.NewSession(&config))
```

### errcheck ./...

error を返す function の処理をチェックしているか警告してくれます。

以下のコードで `errcheck ./...` を実行すると

```go
f, err := os.Open(fpath)
...
defer f.Close()
```

以下の様に警告されます。

```sh
pkg/utility/profile.go:19:15:   defer f.Close()
```

`f.Close()` が error を返しますが、その error がチェックされていないですよ、という指摘です。

```
Close closes the File, rendering it unusable for I/O. On files that support SetDeadline, any pending I/O operations will be canceled and return immediately with an error.

func (*os.File).Close() error
```

無名関数で wrap してその中で error check する様にし対応しました。

```go
defer func() {
	if err := f.Close(); err != nil {
		log.Fatalln(err)
	}
}()
```

### gosec -quiet ./...

使用コードでの脆弱性を指摘してくれます。

現状の omssh では `gosec -quiet ./... ` を実行してみると以下の様な警告が出ます。

`G106` として管理されている `ssh.InsecureIgnoreHostKey()` を利用していることへの脆弱性が指摘されています。

```sh
Results:


[/Users/kenzo.tanaka/src/github.com/kenzo0107/omssh/omssh.go:50] - G106 (CWE-322): Use of ssh InsecureIgnoreHostKey should be audited (Confidence: HIGH, Severity: MEDIUM)
  > ssh.InsecureIgnoreHostKey()


Summary:
   Files: 9
   Lines: 718
   Nosec: 0
  Issues: 1
```

対応法を把握できていないので `-exclude=G106` オプションで回避しています。

#### gosec で警告されがちなコード

よくありがちな gosec に警告されがちなコード例としては以下ではないでしょうか。

引数として、ファイルパスを渡して、そのファイルを開こうとしています。

```go
func GetProfiles(credentialsPath string) (profiles []string, err error) {
	f, err := os.Open(credentialsPath)
        ...
```

このコードを `gosec -quiet ./...` してみると以下の様に警告されます。

```sh
[/Users/kenzo.tanaka/src/github.com/kenzo0107/omssh/pkg/utility/profile.go:16] - G304 (CWE-22): Potential file inclusion via variable (Confidence: HIGH, Severity: MEDIUM)
  > os.Open(credentialsPath)
```

こちらの対処法としては、ファイルパスを綺麗にしてくれる `filepath.Clean(string)` を噛ませると回避できました。

```go
- f, err := os.Open(credentialsPath)
+ f, err := os.Open(filepath.Clean(credentialsPath))
```

`../kenzo\hoge/moge` というファイルパスだと `../kenzo\hoge/moge` というファイルパスが返ります。

### golint -set_exit_status ./...

`-set_exit_status` を指定しているのは、終了ステータスを返してくれます。

以下の様なコードがあるとします。

```go
type EC2Iface interface {
   ...
}
```

`golint -set_exit_status ./...` すると以下の様なエラーを出力されます。

```sh
pkg/awsapi/ec2.go:12:6: exported type EC2Iface should have comment or be unexported
Found 1 lint suggestions; failing.
```

EC2Iface と大文字始まりなので、他パッケージからも参照できる `exported type` なのでコメントを書きましょうね、
という指摘です。

VSCode を使っていますが、この様にカーソルを合わせるとコメントが表示されてくれます。

丁寧に書いて置いて上げるとこんな値を返すよ〜とかわかりやすいですね。

面倒くさがらずコメント書きましょう。

## 単体テスト on GitHub Actions

こちらはシンプルで test を実行し coverage を [CodeCov](https://codecov.io/) に上げる様にしました。また、そのカバレッジを README にラベルとして表示できます。

CODECOV_TOKEN は GitHub の Settings > Secrets で設定しておきます。

[![codecov](https://codecov.io/gh/kenzo0107/omssh/branch/master/graph/badge.svg)](https://codecov.io/gh/kenzo0107/omssh)

[kenzo0107/test_go.yaml](https://gist.github.com/kenzo0107/0349f1a43c2aa26abf6db51fddd48af8)

## まとめ

静的解析と単体テストを追加したことで

- コード変更がしやすくなった。
- Golang の求めるコードの書き方を学ぶことができた。
- aws-sdk-go の mock の作成の仕方を学ぶことができた。

というご利益がありました。

## 単体テストで 100% を目指しましたが、

ssh 接続周りで手こずってカバレッジが微増でした。

ssh 接続する際に仮想的な ssh server を起動する所まではよかったんですが、
`(*ssh.Session).RequestPty` するとそこで処理待ちが発生し、テストが進まなくなってしまいました。

良い案ありましたらご教示いただけましたら幸いです `m(_ _)m`

## 今回の知見を活かして

AWS の EC2 や RDS 等の Reserved Instance の使用率・カバレッジ率を Datadog にプロットする Lambda を生成する [SAM](https://aws.amazon.com/jp/serverless/sam/) プロジェクトを Go で作ってみました。

プロットしたメトリクスに監視することで使用率・カバレッジ率低下をアラートできます。

[kenzo0107/ri-utilization-plotter](https://github.com/kenzo0107/ri-utilization-plotter)

また、より OSS らしくロゴを作ってみました ♪

愛情が増します。

## 参照

[Unit Testing an SSH Client in Go](https://stackoverflow.com/questions/49418982/unit-testing-an-ssh-client-in-go)
