---
title: awsume と peco を使って簡単にスイッチロールする
category: AWS
date: 2025-07-04
tags: [AWS, awsume, peco, shell, cli]
---

AWS で複数のアカウントを管理している際、プロファイルの切り替えが面倒になることがあります。
今回は `awsume` と `peco` を組み合わせたインタラクティブな AWS プロファイル選択スクリプトを紹介します。

<!-- more -->

## 概要

{%gist https://gist.github.com/kenzo0107/c647d400501a1e63c96df5389cf5dbe6 %}

このスクリプトは以下の機能を提供します：

- `awsume -l` でプロファイル一覧を取得
- `peco` でインタラクティブに選択
- 選択されたプロファイルで `awsume` を実行してスイッチロール

## 前提条件

以下のツールがインストールされている必要があります：

- `awsume`: AWS プロファイル管理ツール
- `peco`: コマンドライン選択ツール
- `~/.aws/credentials` にプロファイルが設定済み

## インストール

```bash
# awsume のインストール (例: pip経由)
pip install awsume

# peco のインストール (例: Homebrew経由)
brew install peco
```

## スクリプトの実装

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

## 使用方法

```bash
# スクリプトを実行
./awsume-switcher.sh
```

実行すると、設定されているプロファイルの一覧が表示され、矢印キーで選択、Enterで確定できます。

## 機能の詳細

### フィルタリング機能

以下の項目は自動的にリストから除外されます：

- `default` プロファイル
- ヘッダー行（`==================================AWS` など）
- `PROFILE` 文字列を含む行
- 空行
- ダッシュ行（`----` など）

### エラーハンドリング

- 必要なコマンドの存在チェック
- プロファイルが見つからない場合の処理
- 選択がキャンセルされた場合の処理
- 警告メッセージの抑制

## スクリプトの流れ

1. `awsume` と `peco` の存在確認
2. `awsume -l` でプロファイル一覧取得
3. 不要な行をフィルタリング
4. `peco` で選択画面表示
5. 選択されたプロファイルで `awsume` 実行

## 注意事項

- `awsume` の警告メッセージは `2>/dev/null` で抑制済み
- プロファイル選択をキャンセルした場合は正常終了
- エラー発生時は適切なメッセージを表示して終了

## まとめ

このスクリプトを使うことで、複数の AWS アカウントを効率的に管理できるようになります。特に多くのプロファイルを持つ環境では、視覚的に選択できる `peco` の威力を実感できるはずです。

日常的に AWS CLI を使用している方は、ぜひ試してみてください。

以上
参考になれば幸いです。
