---
title: 'local-llm: A Claude Code Plugin That Delegates Routine Tasks to a Local LLM'
date: 2026-08-21
lang: en
translation_id: claude-code-local-llm-plugin
permalink: en/2026/08/21/claude-code-local-llm-plugin/
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

I built [local-llm](https://github.com/kenzo0107/claude-code-plugins), a Claude Code plugin that delegates **routine tasks you don't want burning your cloud usage quota** to a local LLM running on Ollama.
It targets tasks whose output is practically equivalent whether run in the cloud or locally — commit message generation, PR body generation, and convention-based pre-reviews of Terraform and code. Run them as many times as you like; they never consume your quota.

<!-- more -->

## Why I Built It

Using Claude Code daily, you notice that a fair share of your quota goes to work that doesn't really need Claude:

- Generating a commit message from the staged diff
- Generating a PR body (Summary / Test plan) from a branch diff
- Mechanical pre-reviews against a coding convention
- First-pass diagnosis of a failed build log

These are formulaic tasks with well-defined inputs (diff, log, convention) and a fixed output shape. If a local LLM can reach practical accuracy on them, I'd rather save the cloud quota for design, implementation, and research — the work that actually needs Claude.

## What the Plugin Provides

It is a set of slash commands and auto-triggered skills that send only the generation/judgment part to the Ollama API.

| Command | What it does | Default model |
| --- | --- | --- |
| `/commit-msg` | Generate a commit message from the staged diff | qwen3.6:27b |
| `/pr-body [base]` | Generate a PR body from the branch diff | gemma4:12b |
| `/code-review [base]` | Pre-review Go/Python diffs for security and quality | gemma4:12b |
| `/tf-review [base]` | Pre-review Terraform diffs against in-house conventions | gemma4:12b |
| `/commit-push-pr` | Branch, commit, push, and open a PR in one go | qwen3.6 + gemma4 |
| `/android-build` etc. | Run Android builds; LLM only diagnoses failure logs | gemma4:12b |
| `/clean-merged-branches` | Bulk-delete merged local branches | No LLM |

The design principle is to **keep the control flow deterministic in scripts and hand only the judgment part to the LLM**. The Android commands run `./gradlew` normally and only delegate the failure-log diagnosis. Branch cleanup is pure `git branch -d` (safe delete of merged branches only) with no LLM involved.

## Implementation Notes

### Calling the Ollama API with the standard library only

I wanted zero dependencies, so the scripts hit `http://localhost:11434/api/chat` directly with Python's `urllib.request`. Review commands force structured output with `format: "json"` and stabilize it with `temperature: 0.1`.

```python
body = {
    "model": MODEL,
    "stream": False,
    "think": False,
    "format": "json",
    "options": {"temperature": 0.1, "num_ctx": 16384},
    "messages": [{
        "role": "user",
        "content": f"{PROMPT}{rules}\n\n### Diff\n```diff\n{diff}\n```",
    }],
}
req = urllib.request.Request(OLLAMA_URL, data=json.dumps(body).encode(),
                             headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req, timeout=600) as res:
    findings = json.loads(json.loads(res.read())["message"]["content"]).get("findings", [])
```

`/tf-review` loads our in-house Terraform convention (a SKILL.md managed in another plugin) at runtime and embeds it into the prompt along with the diff. The prompt pins down constraints like "only review changed lines in the diff", "only report findings backed by the convention", and "mark uncertain findings as low confidence" — low-confidence findings are treated as informational.

### Protecting the context window

Local LLMs have limited context, so huge diffs are truncated at 40,000 characters — and **which end to keep depends on the task**. Commit messages and PR bodies keep the head; build-log diagnosis keeps the tail (`log[-40000:]`) because errors show up at the end.

### Model selection based on measurements

- **gemma4:12b (~8GB)**: the default for review/diagnosis. On a Python sample with 7 intentionally planted vulnerabilities it found 6/7 in about 60 seconds, with no false positives
- **qwen3.6:27b (~17GB)**: found 7/7 on the same sample but took ~2.5 minutes, so it is the default only for commit messages. On a test diff mixing a feature, a bug fix, and a rename, gemma4:12b compressed multiple changes into one line and failed to split them into bullet points, while qwen3.6:27b matched what Claude would write

Models are swappable via environment variables (`TF_REVIEW_MODEL` / `LOCAL_REVIEW_MODEL`).

### Auto-trigger and fallback

`/tf-review`, `/commit-msg` and friends are also defined as `user-invocable: false` skills, so Claude Code invokes them autonomously at the right moments (e.g. before committing .tf files). If Ollama is not running, they are **skipped and the work falls back to the cloud** — never a blocker.
The commit-msg skill also instructs Claude to "not rethink the generated message in your own words" — if Claude starts polishing the local LLM's output, it burns tokens and defeats the whole purpose.

### Gotcha: it cannot coexist with the official commit-commands

The official `/commit` command restricts `allowed-tools` to git/gh and its prompt explicitly says not to use other tools, so auto-triggered skills that need `python3` or `curl` cannot fire during it. That's why the plugin ships its own equivalents, `/commit-msg` and `/commit-push-pr`.

## Getting Started

```
/plugin marketplace add https://github.com/kenzo0107/claude-code-plugins
/plugin install local-llm@claude-code-plugins
```

You need Ollama and the models:

```sh
brew install ollama && brew services start ollama
ollama pull gemma4:12b     # ~8GB
ollama pull qwen3.6:27b    # ~17GB (for commit-msg)
```

A Mac with 16GB+ of memory is recommended.

## Caveats

- The plugin's role is **pre-review and drafting**. Final quality assurance stays with human review and CI (fmt / tflint / trivy, etc.)
- Operations with large side effects (starting an emulator, deleting branches) are never auto-triggered
- Local LLM accuracy depends on the model and the task. The verifications above are small hand-made samples, not comprehensive benchmarks

## Summary

- A Claude Code plugin that delegates routine tasks (commit messages, PR bodies, pre-reviews, log diagnosis) to a local LLM on Ollama
- Control flow stays deterministic in scripts; only judgment goes to the LLM
- Your cloud quota is preserved for the work that actually needs Claude

Give it a try if you're interested.

- Repository: [kenzo0107/claude-code-plugins](https://github.com/kenzo0107/claude-code-plugins)

## References

- [Ollama](https://ollama.com/)
- [Claude Code plugins](https://code.claude.com/docs/en/plugins)
