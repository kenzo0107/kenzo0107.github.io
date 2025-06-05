---
title: Python tox を利用し複数の構文チェックツール管理
category: Python
date: 2025-06-05
---

Python の構文チェックツールが乱立しており、それぞれ用途が異なり、設定が大変だったところを [tox](https://tox.wiki/) というツールでまとめてみました。

## 利用する構文チェックツール

- requirements-dev.txt

    ```
    pytest==6.2.5
    tox==4.26.0
    black==25.1.0
    bandit==1.8.3
    flake8==7.2.0
    mypy==1.16.0
    isort==6.0.1
    ```

    | tool | explain |
    |---|---|
    | [pytest](https://docs.pytest.org/) | Python の テスト実行ツール。テスト関数を自動で見つけて実行します。 |
    | [tox](https://tox.wiki/) | 複数の環境でテストやチェックを自動化するツール。CI/CDや複数Pythonバージョン対応に使います。 |
    | [black](https://github.com/psf/black) | コード整形ツール（自動フォーマッター）。PEP8に準拠したスタイルに自動で直します。 |
    | [bandit](https://bandit.readthedocs.io/en/latest/) | Pythonコードの セキュリティチェックツール。危険なコードパターンを検出します。 |
    | [flake8](https://flake8.pycqa.org/) | Pythonコードの 文法・スタイルチェックツール。PEP8違反などを報告します。 |
    | [mypy](https://mypy-lang.org) | Pythonコードの 型チェックツール。型ヒント（type hint）が正しく使われているか確認します。 |
    | [isort](https://pycqa.github.io/isort/) | import文を自動で整理・ソートするツール。blackと一緒によく使われます。 |

## tox.ini 設定例

除外ディレクトリについて CDK プロジェクトを考慮している tox.ini の設定です。
流用十分可能です。

```ini
[tox]
# setup.py がなくとも動作する様にする為、指定している
skipsdist = True

[testenv]
# NOTE: 環境にインストールするライブラリを指定する
#   `-r` と `requirements.txt` の間にスペースを入れるとエラーになる
# NOTE: 各環境で利用ツールの version 差異が出ない様、
#   requirements-dev.txt で開発・テスト用のモジュールをバージョン管理する
deps =
    -rrequirements.txt
    -rrequirements-dev.txt
commands = pytest -rsfp

[testenv:lint]
deps = -rrequirements-dev.txt
commands =
    black . --check --skip-string-normalization
    bandit --quiet --exclude ./.tox,./.venv,./.pytest_cache --recursive .
    flake8 .
    mypy --ignore-missing-imports .
    isort . --profile black --check --diff --skip-glob .venv,./.tox,./.pytest_cache

# lint 指摘事項の自動修正. black, isoft のみ対応
[testenv:lint_auto_fix]
deps = -rrequirements-dev.txt
commands =
    black . --skip-string-normalization
    isort . --profile black --diff --skip-glob .venv,./.tox,./.pytest_cache

[flake8]
deps = -rrequirements-dev.txt

# 1行当たりの最大文字数 (default: 80)
# 119: GitHub のコードレビューが表示できる長さ
max-line-length = 119

exclude =
    .git
    __pychache__
    .tox
    .mypy_cache
    .venv
    .pytest_cache
    cdk.out
```

## 利用方法

### テスト実行方法

```shell
tox
```

### 構文チェック実行

```shell
tox -e lint
```

### 構文自動修正

```shell
tox -e lint_auto_fix
```

### GitHub Actions 設定

```yaml
name: CDK Unit Test

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 5

    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

      # Python バージョン取得
      - name: Pick python version
        id: python
        run: echo "version=$(awk '$1 ~ /^python/{print $2}' .tool-versions)" >> $GITHUB_OUTPUT

      # Python セットアップ
      - name: Set up Python
        uses: actions/setup-python@7f4fc3e22c37d6ff65e88745f38bd3157c663f7c # v4.9.1
        with:
          python-version: ${{ steps.python.outputs.version }}

      # 必要ツールの導入
      - name: Install dependencies
        run: pip install -r requirements-dev.txt

      # 構文チェック実行
      - name: Run linter
        run: tox -e lint

      # テスト実行
      - name: Run tests
        run: tox
```

## 実装例

Raspberry PI の設定で利用しました。

https://github.com/kenzo0107/raspi-talk/commits/main/tox.ini

以上
参考になれば幸いです。
