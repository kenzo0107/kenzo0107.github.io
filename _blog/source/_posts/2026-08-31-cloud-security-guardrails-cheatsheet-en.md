---
title: "Azure / AWS / Google Cloud Security Guardrails Cheat Sheet: What Defender for Cloud Maps To"
date: 2026-08-31
cover: /img/cover/2026-08-31-cloud-security-guardrails-cheatsheet-en.svg
lang: en
translation_id: cloud-security-guardrails-cheatsheet
permalink: en/2026/08/31/cloud-security-guardrails-cheatsheet/
categories:
- [Security]
- [Azure]
- [AWS]
- [Google Cloud]
tags:
- Azure
- AWS
- Google Cloud
- Security
- Defender for Cloud
- Security Hub
- GuardDuty
- Security Command Center
- CSPM
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

While building an Azure Policy guardrail that denies enabling paid Microsoft Defender for Cloud plans, I had a chance to map out what each piece corresponds to in AWS and Google Cloud. This post is that mapping, organized as a cheat sheet.
Defender for Cloud bundles "configuration health assessment (CSPM)" and "threat detection (CWPP)" into a single service, so **breaking it down by functional layer** makes the cross-cloud correspondence much clearer.

<!-- more -->

## Mapping by Functional Layer

These mappings are conceptual approximations — feature scopes do not match one-to-one.

| Functional layer | Azure | AWS | Google Cloud |
| --- | --- | --- | --- |
| **CSPM (basic)**<br>Misconfiguration detection, secure score, benchmark compliance | Defender for Cloud<br>**Foundational CSPM** (free) | **AWS Security Hub**<br>(billed per security check) | **Security Command Center Standard** (free) |
| **CSPM (advanced)**<br>Attack path analysis, regulatory compliance dashboards | **Defender CSPM** (paid) | Security Hub extended features<br>(exposure analysis, etc.) | **SCC Premium / Enterprise** (paid) |
| **Threat detection (CWPP)** | Paid plans: **Defender for Servers / Storage / SQL / Containers**, etc. | **Amazon GuardDuty**<br>(billed by analyzed volume) | SCC Premium's<br>**Event / VM / Container Threat Detection** |
| **Vulnerability management** | Defender Vulnerability Management<br>(built into Defender for Servers / Containers) | **Amazon Inspector** | **Artifact Analysis** + Web Security Scanner |
| **Configuration auditing**<br>Visibility without enforcement | **Azure Policy (Audit)** (free) | **AWS Config** (billed per evaluation) | **Organization Policy dry-run** + Cloud Asset Inventory |
| **Preventive guardrails**<br>Denying the violating operation itself | **Azure Policy (Deny)** | **SCP / RCP** (Organizations) | **Organization Policy** + **IAM Deny Policy** |
| **Notifications / contacts** | Security Contact | Alternate contact (Security) + EventBridge → SNS | Essential Contacts + SCC notifications (Pub/Sub) |

Roughly speaking, **"Defender for Cloud ≈ Security Hub + GuardDuty + Inspector + Config"** on AWS, and **"Defender for Cloud ≈ SCC + Org Policy"** on Google Cloud. Azure packs it into one service, AWS composes it from several, and Google Cloud sits in between (SCC maps almost one-to-one).

## Pricing Models — Can You "Start with Free Visibility"?

This is where the three clouds differ the most.

### Azure: visibility is completely free

- Foundational CSPM (secure score, recommendations, MCSB compliance assessment) is **free**
- Azure Policy is also **free** (no charge for policy evaluation on Azure resources)
- → You can start the staged approach — "make everything visible in Audit mode → confirm zero violations → promote to Deny" — with no cost barrier at all

### AWS: metered billing starts at the visibility stage

- Security Hub bills per security check, GuardDuty by analyzed volume, Config per rule evaluation — **each layer is metered**
- Even "just visibility" is not free; you need a cost estimate based on the number of target accounts first

### Google Cloud: in between

- SCC Standard (free) covers basic misconfiguration detection
- Threat detection and compliance dashboards require Premium / Enterprise (paid), where AWS-style billing kicks in

## Where the Preventive "Deny" Lives

The same "deny" is implemented at different layers, managed by different owners.

| | Azure | AWS | Google Cloud |
| --- | --- | --- | --- |
| Implementation | Azure Policy (effect: Deny) | SCP / RCP | Org Policy + IAM Deny Policy |
| Evaluation layer | ARM (control plane) | Organizations | Organization / folder hierarchy |
| Starting scope | Can start per subscription | Org management account | Organization / folder |

- **Azure**: Azure Policy evaluates every operation at the ARM layer, so it **uniformly rejects portal, CLI, API, and IaC paths alike**. You can start at subscription scope and later expand to management groups, so a single team can own the guardrail end to end
- **AWS**: SCPs / RCPs are applied from the Organizations management account, so guardrail ownership shifts to the org admins rather than individual accounts
- **Google Cloud**: two separate mechanisms. "How resources may be configured" is Organization Policy; "who may call which API" is IAM Deny Policy. Operation guards like blocking billing-tier changes fall to the latter (I wrote about a hands-on IAM Deny Policy rollout in [another post](/en/2026/08/31/gcp-iam-deny-policy-guardrails/))

## Example Use Case: Preventing Accidental Paid-Plan Enablement

Defender for Cloud's paid plans can be enabled with a single click — the "Enable all" button in Environment Settings or the "Fix" button on a recommendation — and metered billing starts the moment it happens. Building a guardrail against this on each cloud looks like:

- **Azure**: deny changes of `Microsoft.Security/pricings` to `pricingTier = Standard` with an Azure Policy (Deny). Putting remediation steps (e.g., how to open a PR in your IaC repo) into `non_compliance_message` lets whoever gets blocked take the next action immediately
- **AWS**: deny APIs such as `securityhub:*` or `guardduty:CreateDetector` with an SCP
- **Google Cloud**: deny the permissions involved in changing the SCC tier with an IAM Deny Policy (hard to express with Organization Policy)

## Summary

| Aspect | Azure | AWS | Google Cloud |
| --- | --- | --- | --- |
| CSPM visibility | Foundational CSPM (free) | Security Hub (paid) | SCC Standard (free) |
| Threat detection | Defender paid plans | GuardDuty | SCC Premium |
| Prevention (Deny) | Azure Policy | SCP / RCP | Org Policy + IAM Deny |
| What's free to start | Visibility + Policy, all of it | Nothing (all metered) | Basic visibility |

For multi-cloud guardrails, the staged approach itself — **visibility (Audit) → confirm zero violations → promote to Deny** — works the same way on all three clouds. What differs is how much you can do for free, and at which layer the Deny is enforced.

*The mappings reflect my understanding as of August 2026 and are conceptual approximations. Check each cloud's official documentation and pricing pages for exact specifications.*
