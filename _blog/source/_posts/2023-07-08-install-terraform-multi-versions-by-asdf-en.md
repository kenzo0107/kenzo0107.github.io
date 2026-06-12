---
title: Managing Multiple Terraform Versions with asdf
date: 2023-07-08
lang: en
translation_id: install-terraform-multi-versions-by-asdf
permalink: en/2023/07/08/install-terraform-multi-versions-by-asdf/
category: AWS
cover: https://i.imgur.com/9b8Lzio.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

Terraform is updated frequently, and version differences tend to arise between projects, so being able to manage multiple versions makes operations smoother.

<!-- more -->

## Why I recommend asdf

If all you need is to manage Terraform versions, [tfenv](https://github.com/tfutils/tfenv) is the popular choice.

However, since I also recommend adopting tflint and tfsec, asdf lets you manage versions of all these libraries using the same approach, which is why I recommend it.

## Installing asdf on macOS

Reference: https://asdf-vm.com/guide/getting-started.html

```console
$ brew install asdf

// For zsh
$ echo -e "\n. \"$(brew --prefix asdf)/libexec/asdf.sh\"" >> ~/.zshrc

// Reload
$ exec $SHELL -l
```

## Adding the terraform plugin & installing multiple versions

```console
$ asdf plugin add terraform

// Show the list of versions installable via asdf
$ asdf list all terraform

...
1.5.0
...

// Install 1.5.0
$ asdf install terraform 1.5.0
```

## Specifying a version for a specific directory only

```console
$ cd path/to/terraform-project
$ asdf local terraform 1.5.0
$ asdf reshim terraform
```

A .tool-versions file is generated, and the version is managed as follows.

```hcl
terraform 1.5.0
```

When a .tool-versions file is specified, that version will be used under that directory as long as it is installed.

## tflint and tfsec can be managed with asdf in the same way

```conosle
$ asdf plugin add tflint
$ asdf plugin add tfsec
```

I use this when I want to try out behavioral changes caused by version upgrades of tflint and tfsec locally.

That's all.
I hope you find this helpful.
