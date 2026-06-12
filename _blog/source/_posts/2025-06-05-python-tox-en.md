---
title: Managing multiple Python lint tools with tox
category: Python
date: 2025-06-05
lang: en
translation_id: python-tox
permalink: en/2025/06/05/python-tox/
cover: /img/cover/2025-06-05-python-tox.svg
---

Python has a sprawl of linting and style-check tools, each with a different purpose and its own configuration, which gets tedious to manage. I pulled them together with a tool called [tox](https://tox.wiki/).

<!-- more -->

## Lint tools used

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
    | [pytest](https://docs.pytest.org/) | A test runner for Python. It automatically discovers and runs test functions. |
    | [tox](https://tox.wiki/) | A tool for automating tests and checks across multiple environments. Used for CI/CD and supporting multiple Python versions. |
    | [black](https://github.com/psf/black) | A code formatter (auto-formatter). It automatically rewrites code to a PEP8-compliant style. |
    | [bandit](https://bandit.readthedocs.io/en/latest/) | A security checker for Python code. It detects dangerous code patterns. |
    | [flake8](https://flake8.pycqa.org/) | A syntax and style checker for Python code. It reports PEP8 violations and the like. |
    | [mypy](https://mypy-lang.org) | A type checker for Python code. It verifies that type hints are used correctly. |
    | [isort](https://pycqa.github.io/isort/) | A tool that automatically organizes and sorts import statements. Often used together with black. |

## Example tox.ini configuration

This is a tox.ini that accounts for excluded directories with a CDK project in mind.
It's reusable as-is.

```ini
[tox]
# Set so it works even without a setup.py
skipsdist = True

[testenv]
# NOTE: specify the libraries to install into the environment
#   putting a space between `-r` and `requirements.txt` causes an error
# NOTE: to avoid version differences in the tools used across environments,
#   pin dev/test modules in requirements-dev.txt
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

# Auto-fix lint findings. Only black and isort are supported.
[testenv:lint_auto_fix]
deps = -rrequirements-dev.txt
commands =
    black . --skip-string-normalization
    isort . --profile black --diff --skip-glob .venv,./.tox,./.pytest_cache

[flake8]
deps = -rrequirements-dev.txt

# Max characters per line (default: 80)
# 119: the width GitHub code review can display
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

## Usage

### Running tests

```shell
tox
```

### Running lint checks

```shell
tox -e lint
```

### Auto-fixing lint findings

```shell
tox -e lint_auto_fix
```

### GitHub Actions configuration

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

      # Get the Python version
      - name: Pick python version
        id: python
        run: echo "version=$(awk '$1 ~ /^python/{print $2}' .tool-versions)" >> $GITHUB_OUTPUT

      # Set up Python
      - name: Set up Python
        uses: actions/setup-python@7f4fc3e22c37d6ff65e88745f38bd3157c663f7c # v4.9.1
        with:
          python-version: ${{ steps.python.outputs.version }}

      # Install the required tools
      - name: Install dependencies
        run: pip install -r requirements-dev.txt

      # Run lint checks
      - name: Run linter
        run: tox -e lint

      # Run tests
      - name: Run tests
        run: tox
```

## Example in practice

I used this in my Raspberry Pi setup.

https://github.com/kenzo0107/raspi-talk/commits/main/tox.ini

That's it.
I hope this helps.
