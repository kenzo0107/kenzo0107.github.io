---
title: Cutting Costs with Claude Code — AI's Real Battlefield Was "Problem Discovery," Not "Implementation"
categories:
- [AWS]
- [AI]
date: 2026-06-11
lang: en
translation_id: ai-cost-reduction-discovery
permalink: en/2026/06/11/ai-cost-reduction-discovery/
cover: /img/cover/2026-06-11-ai-cost-reduction-discovery.svg
tags:
  - Claude Code
  - SRE
  - Cost
  - AWS
---

It's tempting to see AI coding agents like Claude Code purely as "tools for writing code."
But after tackling cost reduction in my SRE work, I realized that **AI delivers its highest return on investment in the "problem discovery" phase**.

Having the AI exhaustively hunt for "where there's room to cut costs" — point it at this, and areas that were previously left untouched because the effort wasn't worth it suddenly become actionable.

<!-- more -->

## Why traditional cost reduction never makes progress

Manual cost reduction investigations usually go something like this:

1. Open Cost Explorer and eyeball costs by service
2. Drill into each service of concern one by one (manually checking the breakdown by Usage Type)
3. Check utilization in a metrics tool (flipping between dashboards in a separate tab)
4. Read the Terraform code (clone the relevant repo and check the configuration)
5. Compile the findings and hand-write an Issue

This takes **half a day to a full day per account**. With dozens of accounts, an exhaustive investigation across all of them is effectively impossible.

So what happens as a result?
**"Optimizations worth a few dozen dollars a month" get left alone because the cost of investigating them is higher than the savings.**
Since they don't justify the effort, areas no one will touch keep piling up.

## Using AI as a "problem detector"

So I turned the cost investigation into a Claude Code custom command.
Specify an account, and it automatically runs the following:

```text
① Load information about the target services
② Three-level drill-down via the Cost Explorer API
     Level 1: Cost by service     → what is expensive
     Level 2: Cost by Usage Type  → what makes up that cost
     Level 3: Root cause analysis  → why it's expensive / how to reduce it
③ Check actual resource utilization with metrics (Datadog, etc.)
④ Read the Terraform code and cross-check against the current configuration
⑤ Check for overlap with existing Issues (including rejected ones)
⑥ Present a list of cost reduction proposals
⑦ Turn only human-approved proposals into Issues
```

The three-level drill-down matters because Level 1 alone only tells you "what is expensive."
Only by breaking it down to the Usage Type (Level 2) and tracing it to the root cause (Level 3) do you arrive at a **concrete action**.

This brought the investigation of **a single account down from half a day to a full day → 15 to 30 minutes**.

| Item | Traditional (manual) | After adopting Claude Code |
| --- | --- | --- |
| Investigation time per account | Half a day to a full day | 15 to 30 minutes |
| Depth of investigation | By service + 1 or 2 drill-downs | All services → all Usage Types → root cause |
| Deliverable | Notes, or nothing | Structured Issues |
| Number of target accounts | Only a few major ones | All major accounts |

The biggest change was that **small-scale optimizations that had always been left untouched finally became reachable**.
Even for a measure worth a few dozen dollars a month, it's worth doing if the analysis and Issue creation finish in minutes.

## Make the Issue the hub — and keep the rejection reasons too

Another key part of this workflow is to **keep the investigation results structured as Issues**.

Each Issue is written to comprehensively cover "current cost, the proposal, the expected savings, and side effects/risks."
And what's important is to **keep the reason in the Issue even when a proposal is rejected**.

Cost reduction isn't a one-time activity; we run it every quarter.
If the rejection reasons are recorded, **you avoid repeating the same proposal in the next investigation**.
"Why we made this change / why we didn't" accumulates in the same place as the code.

## Where were the humans?

I don't want this to be misunderstood: **you can't just hand everything off to the AI**.
On the contrary, plenty of situations remained where human (SRE) judgment was indispensable.

| What the human judged | Example |
| --- | --- |
| Go / No Go decision | Can we reduce a redundant configuration down to one? (availability risk vs. cost) |
| Tolerance of side effects | Will halving the memory cause an OOM? |
| Organizational decision-making | Decommissioning a service → checking with users in advance |
| Prioritization | Of the many Issues, which to tackle first |
| Rejection decision | Technically correct, but we won't do it operationally |

The reason humans are needed is that there's context the AI can't see.

- **Context of the entire infrastructure**: tacit knowledge like "this redundant configuration is actually part of our DR setup"
- **Past incident history**: rules of thumb like "we cut the memory here before and OOMs became frequent"
- **Business impact**: "this service has a large campaign coming up next month"

My intuition is that **the AI handles 80% of the investigation, analysis, and implementation, while the human focuses on the 20% of judgment and decision-making**.
This division of labor was the most efficient.
Put another way, the AI's investigation speed pays off precisely because a human who understands the whole infrastructure can play the judge role and process things quickly.

## What I learned

Looking back at the whole workflow, AI proved useful in more than just implementation.

```text
1. Problem discovery:  AI exhaustively analyzes cost data → identifies room to cut   ★ this is where it helped most
2. Investigation & drill-down: AI does multi-stage analysis → identifies root causes
3. Proposal creation:  AI structures findings as Issues → organizes the decision materials
4. Judgment:     The human decides Go / No Go
5. Implementation:     AI modifies Terraform → creates the PR
6. Cross-cutting rollout:  AI applies it across multiple repositories at once
```

Implementation (5) is only one part of the whole.
**Problem discovery and investigation are the areas where AI has the greatest impact.**

And one more thing: **the design of the custom command makes or breaks the outcome.**
The three-level drill-down, the overlap check against existing Issues, the human approval flow — it was thanks to this design that the output reached a usable quality.
Without someone who can design the command, this result wouldn't have happened.

## Summary

- The main battlefield for AI coding agents isn't just "implementation" — **there's value precisely in "problem discovery"**
- Small-scale optimizations that were left untouched because they weren't worth the effort become actionable thanks to the AI's investigation speed
- Cost analysis turns into action via a **three-level drill-down**, and you **keep even the rejection reasons in the Issues**
- A division of labor where AI does 80% (investigation, analysis, implementation) and humans do 20% (judgment, decision-making) is efficient
- What makes or breaks the outcome is **the design of the custom command**

Shift your perspective one step before "having AI write code" toward "having AI find the problems," and the scope for applying it in SRE work expands even further.
