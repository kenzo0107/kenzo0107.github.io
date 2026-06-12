---
title: Easy Role Switching with awsume and peco
category: AWS
date: 2025-07-04
lang: en
translation_id: awsume-switch-role
permalink: en/2025/07/04/awsume-switch-role/
cover: /img/cover/2025-07-04-awsume-switch-role.svg
tags: [AWS, awsume, peco, shell, cli]
---

When managing multiple AWS accounts, switching between profiles can become tedious.
In this post, I introduce an interactive AWS profile selection script that combines `awsume` and `peco`.

<!-- more -->

## Overview

{%gist https://gist.github.com/kenzo0107/c647d400501a1e63c96df5389cf5dbe6 %}

This script provides the following features:

- Retrieves the list of profiles with `awsume -l`
- Lets you select interactively with `peco`
- Runs `awsume` with the selected profile to switch roles

## Prerequisites

The following tools must be installed:

- `awsume`: An AWS profile management tool
- `peco`: A command-line selection tool
- Profiles already configured in `~/.aws/credentials`

## Installation

```bash
# awsume のインストール (例: pip経由)
pip install awsume

# peco のインストール (例: Homebrew経由)
brew install peco
```

## Implementing the Script

```bash
#!/bin/bash

# awsume-switcher.sh
# AWS プロファイル切り替えスクリプト

# 必要なコマンドの存在チェック
command -v awsume >/dev/null 2>&1 || { echo "awsume is not installed"; exit 1; }
command -v peco >/dev/null 2>&1 || { echo "peco is not installed"; exit 1; }

# プロファイル一覧を取得してフィルタリング
PROFILE=$(awsume -l 2>/dev/null | \
  grep -v "^default$" | \
  grep -v "^==================================AWS" | \
  grep -v "PROFILE" | \
  grep -v "^$" | \
  grep -v "^----" | \
  peco)

# 選択がキャンセルされた場合
if [ -z "$PROFILE" ]; then
  echo "プロファイル選択がキャンセルされました"
  exit 0
fi

# 選択されたプロファイルで awsume を実行
echo "プロファイル '$PROFILE' に切り替えます..."
awsume "$PROFILE"
```

## Usage

```bash
# スクリプトを実行
./awsume-switcher.sh
```

When you run it, the list of configured profiles is displayed, and you can select one with the arrow keys and confirm with Enter.

## Feature Details

### Filtering

The following items are automatically excluded from the list:

- The `default` profile
- Header lines (such as `==================================AWS`)
- Lines containing the `PROFILE` string
- Empty lines
- Dash lines (such as `----`)

### Error Handling

- Checking for the existence of required commands
- Handling the case where no profile is found
- Handling the case where selection is canceled
- Suppressing warning messages

## Script Flow

1. Verify the existence of `awsume` and `peco`
2. Retrieve the profile list with `awsume -l`
3. Filter out unnecessary lines
4. Display the selection screen with `peco`
5. Run `awsume` with the selected profile

## Notes

- If profile selection is canceled, the script exits normally
- On errors, it displays an appropriate message and exits

## Conclusion

Using this script makes it possible to manage multiple AWS accounts efficiently. Especially in environments with many profiles, you should be able to appreciate the power of `peco`, which lets you make selections visually.

If you use awsume on a daily basis, give it a try.

I personally use it with an alias like `alias a="$HOME/awsume-switcher.sh"`.

That's all.
I hope this is helpful.
