---
layout: post
title: Asynchronous Processing with jQuery in the Go Revel Framework
date: 2015-08-30
lang: en
translation_id: go-revel-fw-jquery
permalink: en/2015/08/30/go-revel-fw-jquery/
cover: /img/cover/2015-08-30-go-revel-fw-jquery.svg
category: Go
---

## Overview

We'll implement asynchronous Ajax processing in the Go Revel framework.

## CSRF Protection

Install the library for CSRF protection in the Revel framework with the following command:

```
$ go get github.com/cbonello/revel-csrf
```

- app/init.go

To run the CSRF check at Ajax execution time, configure init.go so that the check is disabled there.

{% linkPreview https://gist.github.com/kenzo0107/2cc980f35c8753f7ccdf _blank %}



The CSRF filter configuration is shown below.

```go
func init()
    revel.Filters = []revel.Filter{
        ...
        ...
        csrf.CSRFFilter,               // CSRF prevention.
        ...
```

Since the API URL invoked in `conf/routes` is checked for CSRF at Ajax execution time,
configure init.go to exclude it from the check.

```go
csrf.ExemptedFullPath("/api_execute")
```


## View-side Configuration

- views/header.html

Embed the hash value for the CSRF check as meta information inside `<head>〜</head>`.

```html
<meta name="csrf-token" content="{{ .csrf_token }}">
```

## jQuery File

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

It may not have been quite as simple as I'd hoped, but
we've got CSRF protection in place.
