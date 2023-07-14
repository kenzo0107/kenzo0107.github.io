---
title: dependabot が pull request を作成しているか確認するスクリプト
date: 2023-07-14
category: GitHub
cover: https://i.imgur.com/dkvqPRI.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

## 概要

terraform provider の更新等、 dependabot で Pull Request の作成をしていると
自分がアサインされていないので気づきにくいです。

その為、定期的に見ておく必要があります。

ですが、管理するリポジトリが多いと全て見に行くのは手間なのでまとめてスクリプトで見れる様にします。

## 手順

事前に gh コマンドで認証を済ませておく

```
gh auth login
```

### スクリプト

```zsh
#!/bin/zsh

repos=(
xxx-terraform
yyy-terraform
)


WORKDIR=$HOME/ghq/github.com/kenzo0107

for repo in "${repos[@]}"
do
    cd $WORKDIR/$repo
    gh pr list -A app/dependabot
done
```

console 実行結果

```sh
Showing 1 of 1 pull request in kenzo0107/xxx-terraform that matches your search

#49  Bump hashicorp/aws from 5.2.0 to 5.6.2  dependabot/terraform/hashicorp/aws-5.6.2

Showing 2 of 2 pull requests in kenzo0107/yyy-terraform that match your search

#433  Bump hashicorp/aws from 5.1.0 to 5.7.0 in /envs/prd        dependabot/terraform/envs/prd/hashicorp/aws-5.7.0
```

ある程度数える程度だったので対応する terraform プロジェクトは配列で持たせましたが、
そこも動的にしたい場合は terraform プロジェクトとわかるファイルがあるリポジトリを抽出してもよいと思います。

以上
参考になれば幸いです。
