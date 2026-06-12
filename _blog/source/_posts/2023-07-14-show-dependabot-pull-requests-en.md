---
title: A Script to Check Whether Dependabot Has Opened Pull Requests
date: 2023-07-14
lang: en
translation_id: show-dependabot-pull-requests
permalink: en/2023/07/14/show-dependabot-pull-requests/
category: Git
cover: https://i.imgur.com/dkvqPRI.png
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

## Overview

When Dependabot opens pull requests, such as updates to Terraform providers,
they are easy to miss because you are not assigned to them.

For this reason, you need to check on them periodically.

However, when you manage a large number of repositories, visiting every one of them is tedious, so let's write a script that lets us view them all at once.

<!--more-->

## Steps

Authenticate with the gh command in advance.

```
gh auth login
```

### Script

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

Console output

```sh
Showing 1 of 1 pull request in kenzo0107/xxx-terraform that matches your search

#49  Bump hashicorp/aws from 5.2.0 to 5.6.2  dependabot/terraform/hashicorp/aws-5.6.2

Showing 2 of 2 pull requests in kenzo0107/yyy-terraform that match your search

#433  Bump hashicorp/aws from 5.1.0 to 5.7.0 in /envs/prd        dependabot/terraform/envs/prd/hashicorp/aws-5.7.0
```

Since there were only a handful of projects to count, I kept the target Terraform projects in an array. If you want to make that part dynamic as well, you could instead extract repositories that contain a file identifying them as a Terraform project.

That's all.
I hope you find this helpful.
