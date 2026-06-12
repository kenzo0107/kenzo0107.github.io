---
layout: post
title: Dealing with ASSERTION Errors on pod install
date: 2015-12-31
lang: en
translation_id: pod-install-assersion
permalink: en/2015/12/31/pod-install-assersion/
cover: /img/cover/2015-12-31-pod-install-assersion.svg
tags:
- Swift
---

Dealing with ASSERTION errors on pod install

## Overview

A quick note because `pod install` failed to complete the installation properly.

To seriously learn Swift 2.0 over the winter break, I bought the following book and gave it a shot.

{% linkPreview https://www.amazon.co.jp/exec/obidos/ASIN/4798142352/kenzo0107-22/ _blank %}


LESSON 31 in the book walks through the CocoaPods installation steps, but I hit an error while following them exactly, so here is how I worked around it.

This kind of error is mostly environment-dependent, and technology keeps advancing day by day even while a book is being written. So rather than blaming the book, it is probably better for your peace of mind to search the official CocoaPods site, Stack Overflow, and the like for information.

## Environment

- Xcode 7.2 (7C68)
- ruby 2.0.0p645
- gem 2.5.0

## Commands listed in the book

### Installing CocoaPods

```
$ sudo gem install -n /usr/local/bin cocoa pods
```

### The error

```
$ pod install
[!] Unable to load a specification for the plugin `/opt/homebrew-cask/Caskroom/cocoapods/0.37.0/CocoaPods.app/Contents/Resources/bundle/lib/ruby/gems/2.2.0/gems/cocoapods-plugins-install-0.0.1`
Analyzing dependencies

CocoaPods 1.0.0.beta.1 is available.
To update use: `sudo gem install cocoapods --pre`
[!] This is a test version we'd love you to try.

For more information see http://blog.cocoapods.org
and the CHANGELOG for this version http://git.io/BaH8pQ.

Downloading dependencies
Installing Realm (0.97.0)
Installing RealmSwift (0.97.0)
Generating Pods project
2015-12-31 10:51:38.680 ruby[6275:47591] [MT] DVTAssertions: ASSERTION FAILURE in /Library/Caches/com.apple.xbs/Sources/IDEFrameworks/IDEFrameworks-9548/IDEFoundation/Initialization/IDEInitialization.m:590
Details:  Assertion failed: _initializationCompletedSuccessfully
Function: BOOL IDEIsInitializedForUserInteraction()
Thread:   <NSThread: 0x7fc66d067980>{number = 1, name = main}
Hints: None
Backtrace:
  0  0x000000010e001f7f -[DVTAssertionHandler handleFailureInFunction:fileName:lineNumber:assertionSignature:messageFormat:arguments:] (in DVTFoundation)
  1  0x000000010e00170c _DVTAssertionHandler (in DVTFoundation)
  2  0x000000010e001978 _DVTAssertionFailureHandler (in DVTFoundation)
  3  0x000000010e0018da _DVTAssertionFailureHandler (in DVTFoundation)
  4  0x0000000110e5154d IDEIsInitializedForUserInteraction (in IDEFoundation)
  5  0x000000011393a631 +[PBXProject projectWithFile:errorHandler:readOnly:] (in DevToolsCore)
  6  0x000000011393c1b6 +[PBXProject projectWithFile:errorHandler:] (in DevToolsCore)
  7  0x00007fff93b2af14 ffi_call_unix64 (in libffi.dylib)
zsh: abort      pod install
```

## Workaround

```
# Uninstall the already-installed CocoaPods
$ sudo gem uninstall cocoapods

# Reinstall `cocoapods`
$ sudo gem install  -n /usr/local/bin cocoapods
```

## Verifying the run

```
$  pod install
Updating local specs repositories

CocoaPods 1.0.0.beta.1 is available.
To update use: `gem install cocoapods --pre`
[!] This is a test version we'd love you to try.

For more information see http://blog.cocoapods.org
and the CHANGELOG for this version http://git.io/BaH8pQ.

Analyzing dependencies
Downloading dependencies
Installing Realm (0.97.0)
Installing RealmSwift (0.97.0)
Generating Pods project
Integrating client project

[!] Please close any current Xcode sessions and use `Chapter6.xcworkspace` for this project from now on.
Sending stats
Pod installation complete! There is 1 dependency from the Podfile and 2 total pods
installed.

~/honki_swift/Chapter6/LESSON31/before/Chapter6
```

The `.xcworkspace`, `Podfile.lock`, and `Pods` were created successfully.

```
[~/honki_swift/Chapter6/LESSON31/before/Chapter6]$ tree -L 1
.
├── Chapter6
├── Chapter6.xcodeproj
├── Chapter6.xcworkspace
├── Podfile
├── Podfile.lock
└── Pods
```

That's all.
