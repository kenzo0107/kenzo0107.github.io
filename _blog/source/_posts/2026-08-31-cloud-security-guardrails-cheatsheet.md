---
title: Azure / AWS / Google Cloud セキュリティガードレール早見表 — Defender for Cloud は他クラウドの何にあたるか
date: 2026-08-31
cover: /img/cover/2026-08-31-cloud-security-guardrails-cheatsheet.svg
lang: ja
translation_id: cloud-security-guardrails-cheatsheet
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

Azure Policy で Microsoft Defender for Cloud の有料プラン有効化を Deny するガードレールを導入した際、「これは AWS / Google Cloud でいうと何にあたるのか」を整理する機会があったので、早見表としてまとめます。
Defender for Cloud は「設定の健全性評価（CSPM）」と「脅威検知（CWPP）」を1つに束ねたサービスのため、**機能レイヤーごとに分解**すると3クラウドの対応が見えやすくなります。

<!-- more -->

## 機能レイヤー別 対応表

対応は概念レベルの目安です。機能範囲は1対1では一致しません。

| 機能レイヤー | Azure | AWS | Google Cloud |
| --- | --- | --- | --- |
| **CSPM（基本）**<br>設定ミス検出・セキュアスコア・ベンチマーク準拠評価 | Defender for Cloud<br>**Foundational CSPM**（無料） | **AWS Security Hub**<br>（チェック件数課金） | **Security Command Center Standard**（無料） |
| **CSPM（高度）**<br>攻撃パス分析・規制標準ダッシュボード | **Defender CSPM**（有料） | Security Hub の拡張機能<br>（エクスポージャー分析等） | **SCC Premium / Enterprise**（有料） |
| **脅威検知（CWPP）** | **Defender for Servers / Storage / SQL / Containers** 等の有料プラン | **Amazon GuardDuty**<br>（解析量課金） | SCC Premium の<br>**Event / VM / Container Threat Detection** |
| **脆弱性管理** | Defender Vulnerability Management<br>（Defender for Servers / Containers に内蔵） | **Amazon Inspector** | **Artifact Analysis** + Web Security Scanner |
| **構成ルールの監査**<br>準拠の可視化（強制しない） | **Azure Policy（Audit）**（無料） | **AWS Config**（評価課金） | **Organization Policy の dry-run** + Cloud Asset Inventory |
| **予防ガードレール**<br>違反操作そのものを拒否 | **Azure Policy（Deny）** | **SCP / RCP**（Organizations） | **Organization Policy** + **IAM Deny Policy** |
| **通知・連絡先** | Security Contact | 代替連絡先（Security）+ EventBridge → SNS | Essential Contacts + SCC 通知（Pub/Sub） |

ざっくり言うと **「Defender for Cloud ≒ Security Hub + GuardDuty + Inspector + Config」「Defender for Cloud ≒ SCC + Org Policy」** で、Azure は1サービス、AWS は複数サービスの組み合わせ、Google Cloud はその中間（SCC がほぼ1対1で対応）という構図です。

## 課金モデルの違い — 「まず無料で可視化」が成立するか

3クラウドで一番差が出るのはここです。

### Azure: 可視化は完全無料

- Foundational CSPM（セキュアスコア・推奨事項・MCSB 準拠評価）は**無料**
- Azure Policy も**無料**（Azure リソースへのポリシー評価に課金なし）
- → コスト面のハードルなしに「Audit で全リソースを可視化 → 違反ゼロの実績を見て Deny に昇格」という段階適用を始められる

### AWS: 可視化の段階から従量課金

- Security Hub はセキュリティチェック件数、GuardDuty は解析量、Config はルール評価回数と、**それぞれに従量課金**が発生
- 同じ「まず可視化」でもゼロ円にはならず、対象アカウント数に応じたコスト見積もりが先に必要

### Google Cloud: 中間型

- SCC Standard（無料）で基本的な設定ミス検出までは可能
- 脅威検知・コンプライアンスダッシュボードは Premium / Enterprise（有料）で、そこから先は AWS 型の課金

## 予防ガードレール（Deny）の実装レイヤーの違い

同じ「Deny」でも、どの階層で誰が管理するかが3クラウドで異なります。

| | Azure | AWS | Google Cloud |
| --- | --- | --- | --- |
| 実装 | Azure Policy（effect: Deny） | SCP / RCP | Org Policy + IAM Deny Policy |
| 評価レイヤー | ARM（コントロールプレーン） | Organizations | 組織・フォルダ階層 |
| 適用の起点 | サブスクリプション単位から開始可 | 組織管理アカウント | 組織・フォルダ |

- **Azure**: Azure Policy が ARM レイヤーで全操作を評価するため、**ポータル / CLI / API / IaC のどの経路でも一律に拒否**できる。サブスクリプション単位から始めて管理グループへ広げられるので、1チームのスコープでもガードレールを完結させやすい
- **AWS**: SCP / RCP は Organizations の管理アカウント側で適用するため、ガードレールの管理主体が個々のアカウントではなく組織管理者に寄る
- **Google Cloud**: 役割が2系統に分かれる。「リソースをどう構成できるか」は Organization Policy、「誰がどの API を呼べるか」は IAM Deny Policy。課金設定の変更禁止のような**操作ガード**は後者の領域（IAM Deny Policy の実践は [別記事](/2026/08/31/gcp-iam-deny-policy-guardrails/) に書きました）

## ユースケース例: 「有料プランの誤有効化」を防ぐ場合

Defender for Cloud の有料プランはポータルの「すべて有効にする」ボタンや推奨事項の「修正」ボタンのワンクリックで有効化され、その瞬間から従量課金が始まります。これを防ぐガードレールを各クラウドで組むと:

- **Azure**: `Microsoft.Security/pricings` の `pricingTier = Standard` への変更を Azure Policy（Deny）で拒否。`non_compliance_message` に対処手順（IaC リポジトリでの PR 作成手順など）を書いておくと、拒否された人がその場で次のアクションを取れる
- **AWS**: `securityhub:*` や `guardduty:CreateDetector` 等の API を SCP で Deny
- **Google Cloud**: SCC の tier 変更に関わる権限を IAM Deny Policy で拒否（Organization Policy では表現しにくい領域）

## まとめ

| 観点 | Azure | AWS | Google Cloud |
| --- | --- | --- | --- |
| CSPM 可視化 | Foundational CSPM（無料） | Security Hub（有料） | SCC Standard（無料） |
| 脅威検知 | Defender 有料プラン群 | GuardDuty | SCC Premium |
| 予防（Deny） | Azure Policy | SCP / RCP | Org Policy + IAM Deny |
| 無料で始められる範囲 | 可視化 + Policy 全部 | なし（全て従量課金） | 基本の可視化まで |

マルチクラウド環境でガードレールを整備する場合、3クラウドとも「**可視化（Audit）→ 違反ゼロの実績確認 → Deny 昇格**」という段階適用のアプローチ自体は共通で使えます。違うのは無料で始められる範囲と、Deny をどの階層で当てるか、という点でした。

※ 対応関係は2026年8月時点・概念レベルの目安です。正確な仕様・料金は各クラウドの公式ドキュメントを参照してください。
