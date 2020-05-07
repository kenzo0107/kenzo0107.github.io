---
layout: post
title: pod install で ASSERSION対策
date: 2015-12-31
tags:
- Swift
---

pod install で ASSERSION対策

## 概要

`pod install` 実行時に正常にインストール処理ができなかったのでメモ。

冬休み中にSwift2.0をほんきで学ぶ為、以下書籍購入してチャレンジ。

{% linkPreview https://www.amazon.co.jp/exec/obidos/ASIN/4798142352/kenzo0107-22/ _blank %}


これの LESSON 31 でCocoaPodsインストール手順がありますが
その通りに進めた際にエラー発生したので対策をまとめました。

この手のエラーは環境依存が主ですし、
書籍の執筆時も技術は日進月歩進んでおりますので書籍を責めず
CocoaPodsオフィシャルサイトやStackOverFlowなどで情報探ってみるのが
精神衛生上も良いかもしれないです。

## 環境情報

- Xcode 7.2 (7C68)
- ruby 2.0.0p645
- gem 2.5.0

## 書籍に記載されているコマンド

### CocoaPodsインストール

```
$ sudo gem install -n /usr/local/bin cocoa pods
```

### エラー内容

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

## 対策

```
# 既にインストール済みのCocoaPodsをアンインストールする
$ sudo gem uninstall cocoapods

# 再度 `cocoapods` をインストールする。
$ sudo gem install  -n /usr/local/bin cocoapods
```

## 実行確認

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

無事、 .xcworkspace, Podfile.lock, Pods が作成されました。

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

以上です。
