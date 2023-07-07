---
title: asdf で terraform 複数バージョン管理
date: 2023-07-06
category: AWS
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

terraform はバージョンアップ頻度が高く、
プロジェクトによってバージョン差分が生じるので
複数バージョンを管理できると運用スムーズです。

## asdf 推した理由

terraform だけバージョン管理するのであれば [tfenv](https://github.com/tfutils/tfenv) がメジャーです。

ですが、 tflint, tfsec も導入を推奨しているので
あらゆるライブラリのバージョン管理が同じ方式でできるので
asdf を推してます。

## MacOS に asdf インストール

参考: https://asdf-vm.com/guide/getting-started.html

```console
$ brew install asdf

// zsh の場合
$ echo -e "\n. \"$(brew --prefix asdf)/libexec/asdf.sh\"" >> ~/.zshrc

// リロード
$ exec $SHELL -l
```

## terraform plugin 追加 & 複数バージョンインストール

```console
$ asdf plugin add terraform

// asdf 経由でインストール可能な version のリスト表示
$ asdf list all terraform

...
1.5.0
...

// 1.5.0 インストール
$ asdf install terraform 1.5.0
```

## 特定ディレクトリのみバージョンを指定する

注意: dietplus-terraform は既に設定済みです。

```console
$ cd path/to/dietplus-terraform
$ asdf local terraform 1.5.0
$ asdf reshim terraform
```

[.tool-versions](https://github.com/medpeer-dev/dietplus-terraform/blob/master/.tool-versions) が生成され、以下のようにバージョン管理されます。

```hcl
terraform 1.5.0
```

.tool-versions が指定されていると
そのディレクトリ配下ではインストールされていればそのバージョンを利用する様になります。

## tflint, tfsec も同様に asdf でバージョン管理できる

```conosle
$ asdf plugin add tflint
$ asdf plugin add tfsec
```

ローカルで tflint, tfsec のバージョンアップによる挙動の変化を試したい場合に利用しています。

以上
参考になれば幸いです。
