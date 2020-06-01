---
layout: post
title: Go Revelフレームワーク jQuery非同期処理
date: 2015-08-30
category: Go
tags:
- Go
---

## 概要

Go RevelフレームワークでAjax非同期処理を実装します。

## CSRF 対策

以下コマンドにより
RevelフレームワークでCSFR対策する為のライブラリをインストール

```
$ go get github.com/cbonello/revel-csrf
```

- app/init.go

ajax実行時にCSRFチェックする為、init.goでのチェックを外すように設定

{% linkPreview https://gist.github.com/kenzo0107/2cc980f35c8753f7ccdf _blank %}



以下CSRFのFilter設定

```go
func init()
    revel.Filters = []revel.Filter{
        ...
        ...
        csrf.CSRFFilter,               // CSRF prevention.
        ...
```

`conf/routes` で実行するAPIのURLはAjax実行時にCSRFチェックする為、
init.goではチェックを対象外とする様に設定

```go
csrf.ExemptedFullPath("/api_execute")
```


## View側の設定

- views/header.html

`<head>〜</head>` 内にCSRFチェック用ハッシュ値をmeta情報として埋め込みます。

```html
<meta name="csrf-token" content="{{ .csrf_token }}">
```

## jQueryファイル

```js
function setAjaxToken( token ) {
    // ajax --- start --------------------------------------------------
    $.ajaxSetup({
    	crossDomain: false,
    	beforeSend: function(xhr, settings) {
            if (!csrfSafeMethod(settings.type)) {
                xhr.setRequestHeader("X-CSRFToken", token );
            }
        }
    });
}

$(document).ready(function () {
    $(document).on("click", ".ajax_execute", function (event) {
	event.preventDefault();

    	setAjaxToken( postData['_token'] );

        var ajaxParamas = {};
    	ajaxParamas["type"]		= "POST";
    	ajaxParamas["url"]		= action;
    	ajaxParamas["data"]		= postData;
    	ajaxParamas["cache"]	= false;
    	ajaxParamas["dataType"]	= "json";

        $.ajax(ajaxParamas)
        .success( function(res) {
            console.log("(^-^) OK")
        }).error ( function() {
            console.log("(>_<) NG")
        });
        return false;
})

```

簡単...とは行ってない気がしますが
CSRF対策ができました。
