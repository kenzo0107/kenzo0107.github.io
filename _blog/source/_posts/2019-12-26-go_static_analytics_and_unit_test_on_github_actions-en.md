---
title: Go Static Analysis & Unit Testing on GitHub Actions
category: Go
tags:
  - Go
date: 2019-12-26
lang: en
translation_id: go_static_analytics_and_unit_test_on_github_actions
permalink: en/2019/12/26/go_static_analytics_and_unit_test_on_github_actions/
cover: /img/cover/2019-12-26-go_static_analytics_and_unit_test_on_github_actions.svg
comments: true
---

Some time ago, I built a tool that lets you interactively ssh into EC2 instances across multiple AWS accounts using EC2 Instance Connect.

<!-- more -->

[I built "omssh", an interactive CLI tool for ssh login via the EC2 Instance Connect API.](https://kenzo0107.hatenablog.com/entry/2019/08/04/180149)

I had whipped it up quickly for my own use and uploaded it, only ever testing it on my own machine, with no lint or test setup. But I wanted to take it further:

- For my own learning, I wanted to be able to manage the code properly with lint and test in place.
- It is published as one of my repositories, so I wanted to put some care into it.

With that mindset, I decided to give it a go.

## Deliverable

[kenzo0107/omssh](https://github.com/kenzo0107/omssh)

## Static Analysis on GitHub Actions

I made use of [grandcolline/golang-github-actions](https://github.com/grandcolline/golang-github-actions) to run the following analyses.

- [goimports](golang.org/x/tools/cmd/goimports)
- [errcheck](github.com/kisielk/errcheck)
- [golint](golang.org/x/lint/golint)
- [shadow](golang.org/x/tools/go/analysis/passes/shadow/cmd/shadow)
- [staticcheck](honnef.co/go/tools/staticcheck)
- [gosec](github.com/securego/gosec/cmd/gosec)

The GitHub Actions configuration file is below.

[kenzo0107/static_check_go.yaml](https://gist.github.com/kenzo0107/4bdac92908244222f441c1b04f3b7c5a)

## Static Analysis During Development Too

So that I could run the analysis during development, I set it up in a Makefile.

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

As for goimports, I have my editor configured to check it on save.

It is easiest to understand once you actually set it up and run it, but below I summarize the kinds of things each tool points out.

### go vet ./...

It points out syntactic errors.

```go
a := fmt.Sprintf("%s", 1)
fmt.Println(a)
```

### go vet -vettool=$(shell which shadow)

It warns you when a variable with the same name as one defined in an outer scope is used inside an inner scope.

This can potentially lead to errors, so you need to take action such as renaming the variable.

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

In the case above, you can avoid it by using the outer-scope variable from within the inner scope, like this:

```go
	err := errors.New("error occured")
	{
		err = errors.New("error occured")
```

However, in this case you have to define it with `err :=` the first time and then use `err =` afterwards, which is confusing. You can also avoid the issue by doing the processing immediately after defining the `err` variable.

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

It detects bugs, suggests code simplifications, and points out dead code, among other things.

When I ran `staticcheck ./...` on the following code

```go
import "github.com/aws/aws-sdk-go/aws/session"
...

session.New(&config)
```

it warned me that using session.New is deprecated.

It is great that it points out deprecated usage!

```sh
session.New is deprecated: Use NewSession functions to create sessions instead. NewSession has the same functionality as New except an error can be returned when the func is called instead of waiting to receive an error until a request is made.  (SA1019)
```

I was able to address it by fixing the code as follows.

```go
session.Must(session.NewSession(&config))
```

### errcheck ./...

It warns you whether you are checking the result of functions that return an error.

When I ran `errcheck ./...` on the following code

```go
f, err := os.Open(fpath)
...
defer f.Close()
```

I got the following warning.

```sh
pkg/utility/profile.go:19:15:   defer f.Close()
```

This is pointing out that `f.Close()` returns an error, but that error is not being checked.

```
Close closes the File, rendering it unusable for I/O. On files that support SetDeadline, any pending I/O operations will be canceled and return immediately with an error.

func (*os.File).Close() error
```

I addressed it by wrapping it in an anonymous function and checking the error inside.

```go
defer func() {
	if err := f.Close(); err != nil {
		log.Fatalln(err)
	}
}()
```

### gosec -quiet ./...

It points out vulnerabilities in the code you use.

In the current omssh, running `gosec -quiet ./... ` produces the following warning.

It points out the vulnerability of using `ssh.InsecureIgnoreHostKey()`, which is managed as `G106`.

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

Since I have not figured out how to handle it, I am working around it with the `-exclude=G106` option.

#### Code That gosec Tends to Flag

A common example of code that gosec tends to flag is probably the following.

It takes a file path as an argument and tries to open that file.

```go
func GetProfiles(credentialsPath string) (profiles []string, err error) {
	f, err := os.Open(credentialsPath)
        ...
```

Running `gosec -quiet ./...` on this code produces the following warning.

```sh
[/Users/kenzo.tanaka/src/github.com/kenzo0107/omssh/pkg/utility/profile.go:16] - G304 (CWE-22): Potential file inclusion via variable (Confidence: HIGH, Severity: MEDIUM)
  > os.Open(credentialsPath)
```

As a workaround, I was able to avoid it by passing the path through `filepath.Clean(string)`, which cleans up the file path.

```go
- f, err := os.Open(credentialsPath)
+ f, err := os.Open(filepath.Clean(credentialsPath))
```

For a file path like `../kenzo\hoge/moge`, it returns the file path `../kenzo\hoge/moge`.

### golint -set_exit_status ./...

The reason I specify `-set_exit_status` is that it returns an exit status.

Suppose you have code like the following.

```go
type EC2Iface interface {
   ...
}
```

Running `golint -set_exit_status ./...` outputs an error like the following.

```sh
pkg/awsapi/ec2.go:12:6: exported type EC2Iface should have comment or be unexported
Found 1 lint suggestions; failing.
```

Since EC2Iface starts with an uppercase letter, it is an `exported type` that can be referenced from other packages too, so the message is telling you to write a comment for it.

I use VSCode, and when you hover the cursor over it like this, the comment is displayed.

Writing it carefully helps clarify things like what kind of value it returns.

So write your comments without skimping on them.

## Unit Testing on GitHub Actions

This part is simple: I run the tests and upload the coverage to [CodeCov](https://codecov.io/). You can also display that coverage as a label in the README.

CODECOV_TOKEN is set up under GitHub's Settings > Secrets.

[![codecov](https://codecov.io/gh/kenzo0107/omssh/branch/master/graph/badge.svg)](https://codecov.io/gh/kenzo0107/omssh)

[kenzo0107/test_go.yaml](https://gist.github.com/kenzo0107/0349f1a43c2aa26abf6db51fddd48af8)

## Summary

By adding static analysis and unit testing, I gained the following benefits:

- It became easier to make code changes.
- I was able to learn the coding style that Golang expects.
- I was able to learn how to create mocks for aws-sdk-go.

## I Aimed for 100% in Unit Testing, but

I struggled around the ssh connection, and coverage only increased slightly.

When making an ssh connection, getting as far as starting a virtual ssh server was fine, but calling `(*ssh.Session).RequestPty` caused it to wait for processing there, and the test stopped making progress.

If you have any good ideas, I would be grateful if you could share them `m(_ _)m`

## Putting This Experience to Use

I built a [SAM](https://aws.amazon.com/jp/serverless/sam/) project in Go that generates a Lambda which plots the utilization and coverage rates of Reserved Instances for AWS services like EC2 and RDS to Datadog.

By monitoring the plotted metrics, you can alert on drops in utilization and coverage rates.

[kenzo0107/ri-utilization-plotter](https://github.com/kenzo0107/ri-utilization-plotter)

I also made a logo to give it more of an OSS feel ♪

It makes me love it even more.

## References

[Unit Testing an SSH Client in Go](https://stackoverflow.com/questions/49418982/unit-testing-an-ssh-client-in-go)
