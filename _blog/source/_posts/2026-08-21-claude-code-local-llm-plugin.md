---
title: Claude Code の定型作業をローカルLLMに委任してクラウド利用枠を節約するプラグイン local-llm を作りました
date: 2026-08-21
lang: ja
translation_id: claude-code-local-llm-plugin
cover: /img/cover/2026-08-21-claude-code-local-llm-plugin.svg
categories:
- [AI]
tags:
- Claude Code
- Ollama
- LLM
- Gemma
- Qwen
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

Claude Code の**クラウド利用枠（トークン）を消費したくない定型作業**を、Ollama 上のローカルLLMに委任する Claude Code プラグイン [local-llm](https://github.com/kenzo0107/claude-code-plugins) を作りました。
コミットメッセージ生成・PR本文生成・Terraform/コードのプレレビューなど、「クラウドで実行した場合と作業結果が同等とみなせる」タスクが対象です。何度実行しても利用枠を消費しません。

<!-- more -->

## 作った背景

Claude Code を日常的に使っていると、利用枠の消費内訳には「Claude でなくてもよい作業」がそれなりに含まれていることに気づきます。

- ステージ済み diff からのコミットメッセージ生成
- ブランチ差分からの PR 本文（Summary / Test plan）生成
- コーディング規約に照らした機械的なプレレビュー
- ビルド失敗ログの一次診断

これらは入力（diff・ログ・規約）が明確で、出力の型も決まっている定型作業です。ローカルLLM でも実用精度が出るなら、クラウド利用枠は設計・実装・調査といった「Claude でないと困る作業」に温存したい、というのが動機です。

## どんなプラグインか

コマンド（スラッシュコマンド）と自動発火スキルのセットで、生成・判断部分だけを Ollama の API に投げます。

| コマンド | 機能 | 使用モデル（既定） |
| --- | --- | --- |
| `/commit-msg` | ステージ済み diff からコミットメッセージ生成 | qwen3.6:27b |
| `/pr-body [base]` | ブランチ差分から PR 本文生成 | gemma4:12b |
| `/code-review [base]` | Go/Python 差分をセキュリティ・品質観点でプレレビュー | gemma4:12b |
| `/tf-review [base]` | Terraform 差分を社内規約に照らしてプレレビュー | gemma4:12b |
| `/commit-push-pr` | ブランチ作成〜コミット〜push〜PR作成の一括実行 | qwen3.6 + gemma4 |
| `/android-build` ほか | Android ビルド実行、失敗時のログ診断のみ LLM | gemma4:12b |
| `/clean-merged-branches` | マージ済みブランチの一括削除 | LLM 不使用 |

設計方針として、**制御フローはスクリプトで固定し、判断部分だけを LLM に渡す**ようにしています。たとえば Android 系はビルド自体を普通に `./gradlew` で実行し、失敗したときのログ診断だけを LLM に委任します。ブランチ削除も `git branch -d`（マージ済みのみ安全に削除）で完結させ、LLM は使いません。

## 実装のポイント

### Ollama API を標準ライブラリで直接叩く

依存パッケージゼロにしたかったので、Python 標準ライブラリの `urllib.request` で `http://localhost:11434/api/chat` を直接叩いています。レビュー系は `format: "json"` で構造化出力を強制し、`temperature: 0.1` で安定させています。

```python
body = {
    "model": MODEL,
    "stream": False,
    "think": False,
    "format": "json",
    "options": {"temperature": 0.1, "num_ctx": 16384},
    "messages": [{
        "role": "user",
        "content": f"{PROMPT}{rules}\n\n### 差分\n```diff\n{diff}\n```",
    }],
}
req = urllib.request.Request(OLLAMA_URL, data=json.dumps(body).encode(),
                             headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req, timeout=600) as res:
    findings = json.loads(json.loads(res.read())["message"]["content"]).get("findings", [])
```

`/tf-review` は、別プラグインとして管理している社内 Terraform 規約（SKILL.md）を実行時に読み込んで diff と一緒にプロンプトへ埋め込みます。「差分に現れた変更行だけを対象にする」「規約に根拠がある指摘のみ」「確信が持てないものは confidence を low にする」といった制約をプロンプトに明記し、低確度の指摘は参考情報扱いにしています。

### コンテキスト保護

ローカルLLM はコンテキスト長が限られるため、巨大 diff は 40,000 文字で切り詰めます。このとき**何を残すかはタスクで変えて**います。コミットメッセージ・PR 本文は先頭優先、ビルドログの診断はエラーが末尾に出るため `log[-40000:]` で末尾優先です。

### モデル選定は実測で決めた

- **gemma4:12b（約8GB）**: レビュー・診断系の既定。意図的に7件の脆弱性を仕込んだ Python サンプルで 6/7 検出（約60秒）、誤検知なし
- **qwen3.6:27b（約17GB）**: 同じサンプルで 7/7 検出（約2分30秒）。ただし重いのでコミットメッセージ生成のみ既定に採用。機能追加・バグ修正・リネームを混在させたテスト diff で、gemma4:12b は複数の変更を1行に圧縮してしまい箇条書きに分解できなかったのに対し、qwen3.6:27b は Claude が書く案と同等だった

モデルは環境変数（`TF_REVIEW_MODEL` / `LOCAL_REVIEW_MODEL`）で差し替え可能です。

### 自動発火とフォールバック

`/tf-review` `/commit-msg` などは `user-invocable: false` のスキルとしても定義してあり、.tf ファイルの commit/push 前などの場面で Claude Code が自律的に呼びます。Ollama が起動していなければ**スキップしてクラウド処理にフォールバック**し、ブロッカーにはしません。
また、commit-msg スキルには「生成結果を自分の言葉で考え直さない」という指示を入れています。Claude がローカルLLM の出力を推敲し始めると、そこでトークンを消費してしまい本末転倒だからです。

### ハマりどころ: 公式 commit-commands とは共存できない

Claude Code 公式の `/commit` コマンドは `allowed-tools` が git/gh 系に限定されており「他のツールを使うな」とプロンプトに明記されているため、`python3` や `curl` が必要な自動発火スキルは公式コマンドの実行中には発火できません。そのため同等機能の `/commit-msg` `/commit-push-pr` をプラグイン側で自前提供しています。

## 使い方

```
/plugin marketplace add https://github.com/kenzo0107/claude-code-plugins
/plugin install local-llm@claude-code-plugins
```

前提として Ollama とモデルが必要です。

```sh
brew install ollama && brew services start ollama
ollama pull gemma4:12b     # 約8GB
ollama pull qwen3.6:27b    # 約17GB（commit-msg 用）
```

メモリ 16GB 以上の Mac を推奨します。

## 注意点

- 位置づけはあくまで**プレレビュー・下書き生成**です。最終的な品質担保は人間のレビューと CI（fmt / tflint / trivy 等）が担います
- エミュレータ起動やブランチ削除など副作用の大きい操作は自動発火させていません
- ローカルLLM の出力精度はモデルとタスク次第です。上記の検証は手元の限られたサンプルによるもので、網羅的なベンチマークは取れていません

## まとめ

- Claude Code の定型作業（コミットメッセージ・PR本文・プレレビュー・ログ診断）を Ollama 上のローカルLLM に委任するプラグインを作りました
- 制御フローはスクリプトで固定し、判断部分だけを LLM に渡す設計です
- クラウド利用枠は「Claude でないと困る作業」に温存できます

よければ触ってみてください。

- リポジトリ: [kenzo0107/claude-code-plugins](https://github.com/kenzo0107/claude-code-plugins)

## 参考

- [Ollama](https://ollama.com/)
- [Claude Code plugins](https://code.claude.com/docs/en/plugins)
