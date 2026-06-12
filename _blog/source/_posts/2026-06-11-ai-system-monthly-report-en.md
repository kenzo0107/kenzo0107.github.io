---
title: Let AI Write Your System Monthly Reports ─ Automating Ops Reports with Claude Code × MCP
categories:
- [AWS]
- [AI]
date: 2026-06-11
categories:
  - [AWS]
  - [AI]
lang: en
translation_id: ai-system-monthly-report
permalink: en/2026/06/11/ai-system-monthly-report/
cover: /img/cover/2026-06-11-ai-system-monthly-report.svg
tags:
  - Claude Code
  - SRE
  - MCP
  - AWS
---

When you do SRE / infrastructure operations, you often get asked for a per-service "system monthly report."
How did costs trend last month? Are incidents or errors on the rise? Is anything approaching EOL? ── this kind of recurring observation.

This is quietly time-consuming.
Open Cost Explorer, open CloudWatch, dig through deployment history, and reorganize it all into tables. If you have multiple services, you repeat that as many times as you have services.

This post is about handing off that whole chain of work to a **Claude Code custom skill + MCP**, turning it into a "AI drafts → humans just review" workflow.

<!-- more -->

## What I Built

I built a system where **Claude Code automatically generates** a monthly report for each service in the following structure.
At the end of every report, I always put `Author: AI (Claude Code) + SRE review`. This is to make the workflow explicit: **AI doesn't do everything; AI creates the draft, and a human reviews and finalizes it.**

The report's chapter structure is fixed like this:

```text
0. 要対応サマリ      ← 全分析から自動生成。まずここだけ読めば対応要否が分かる
1. コスト           ← 月次推移 + 変動要因の深掘り + RI/SP 期限
2. パフォーマンス    ← SLO / レイテンシ / エラーレート / リソース使用量
3. デプロイ・実装変更 ← 当月マージされた PR の一覧と影響範囲
4. メンテナンス計画   ← EOL 一覧と残り日数
5. 前回アクションの進捗
6. 今月のアクションアイテム
```

The key is **the "Action-Required Summary" at the top.**
Reports tend to get long, so to ensure that a busy developer only needs to read this part first, I have it summarize urgency (🔴🟡🟢), category, and recommended actions into a table.

## How It Works ── Hitting Real Data via MCP

The heart of this report is that **the AI doesn't write from guesswork; it goes and fetches real data.**
From Claude Code, I bundle various MCP servers together to gather information across the board.

| MCP / Tool | Role |
| --- | --- |
| Cost Explorer family | Retrieve cost trends by service and by Usage Type |
| CloudWatch / Application Signals | Error rates, failed execution counts, latency |
| Datadog (if used) | Check resource utilization via metrics |
| GitHub | Collect PRs merged during the month and build deployment history |
| Notion | Turn the generated report directly into a page |

For cost analysis, I don't let it stop at simply "S3 is expensive"; I have it **dig in at three levels.**

```text
Level 1: サービス別コスト     → 何が高いか
Level 2: Usage Type 別コスト  → コストの構成要素は何か
Level 3: 根本原因の特定        → なぜ高いか / どう減らすか
```

For example, "S3 is up 16% month-over-month" alone doesn't give you a course of action, but
breaking it down to Level 2 reveals "what's increasing is standard storage ByteHrs," and
tracing it to Level 3 reveals "the main cause is data accumulation in a specific bucket, with no lifecycle policy configured" ── automatically drilling down to a **granularity you can act on.**

For deployment history too, it collects the month's PRs and formats them into a "date / PR / content / impact scope" table, so you can
**reason about cost and error fluctuations by cross-referencing them against that month's changes.**
(Insights like "the period when errors increased was right after the PR that switched the DB connection target" emerge automatically.)

## The Design I Cared About Most: Don't Bury "Fetch Failures"

The scariest thing about an auto-generated report is **having data you couldn't fetch get filled in with plausible-looking numbers.**
If that happens, the report's credibility collapses in an instant.

So for items that couldn't be fetched, instead of forcing a fill-in, I have it

```text
レイテンシ: [取得失敗] Application Signals は 24h 制限のため月次データ取得不可
GCP CUD: [取得失敗] コンソールで確認してください
```

**explicitly mark `[fetch failed]`** like this, and instead note "where you should go to check."
Writing "I don't know" when you don't know is unglamorous, but I believe it's the single most important design choice for maintaining the credibility of an automated report.

### Work Around API Range Limits by "Sliding the Window"

One thing I want to add here is that emitting `[fetch failed]` is reserved for "things that genuinely cannot be fetched no matter what."

Some metrics APIs have **an upper bound on the time range you can retrieve in a single request** (e.g., they only return up to the last 24h, or up to a maximum of N days, etc.).
It would be a waste to jump to the conclusion "monthly can't be fetched" and fall back to manual checking.

In reality, there are many cases where **you can retrieve a full month by making multiple requests with shifting ranges and concatenating them.**

```text
1 回のレンジ上限が短くても…

  [5/1 0:00 – 5/2 0:00] → [5/2 0:00 – 5/3 0:00] → … → [5/31 0:00 – 6/1 0:00]

と窓をスライドさせて取得 → 連結すれば月次データになる。
```

If you implement this paging (window sliding + concatenation) on the skill side,
only "things that genuinely can't be fetched due to API constraints" remain as `[fetch failed]`, and you can
**prevent the kind of gap where you "gave up even though it was doable."**

## The Payoff

- **Creation time**: What used to take on the order of hours to build by hand across multiple services is now dramatically shortened to running the skill + reviewing
- **Eliminating dependence on individuals**: "Whoever makes it, it comes out with the same chapter structure and the same depth," so report quality stabilizes
- **Easy to scale horizontally**: For a new service, just point the same skill at it and a report comes out
- **Humans focus on judgment**: You spend your time only on decisions like "do we tolerate this difference?" and "who will do this action?"

## Where I Stumbled / Limitations

It's not a silver bullet. Here are the caveats from actually operating it.

- **Metrics API constraints**: For APIs with an upper bound on the time range you can retrieve at once, you can cover monthly too by **fetching multiple times with shifting windows → concatenating**. If you haven't implemented it, you tend to misjudge it as "can't fetch," so be careful (as mentioned above)
- **Mistaking correlation for causation**: It links "a cost increase with PRs from the same period" by correlation, but **whether it's causal needs a human to judge**
- **Command (skill) design determines quality**: What you fetch, in what order, and how you have it structured. The quality of your prompt design directly becomes the quality of the report

I want to emphasize that last point: the key was **not throwing everything at the AI, but having a human design the right order of good questions.**
Conversely, once you've properly designed the report's template, you can then reproduce it every month.

## Wrap-Up

- For recurring-observation reports, the division of labor **AI drafts → human reviews** works well
- Use MCP to retrieve cost, metrics, and PRs across the board, and have it write **based on real data**
- Cost analysis lands on actions via the **three-level drill-down** of "service → Usage Type → root cause"
- A design that **doesn't bury `[fetch failed]`** underpins the credibility of an automated report
- The essence of efficiency isn't "letting the AI do it" but "designing the template"

If you're losing time every month to boilerplate reports, you'll likely see results by starting with fixing the chapter structure and the data sources.

By the way, I've carved this mechanism out as a Claude Code plugin.
I'm planning to release it once I've got it into a publishable shape, so if you're interested, I'd be glad if you wait patiently.
