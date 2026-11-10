---
title: Route 53 Resolver DNS Firewall の rule group を AWS RAM で組織に共有し、ALERT から段階導入する
date: 2026-11-10
lang: ja
translation_id: route53-dns-firewall-org-share
cover: /img/cover/2026-11-10-route53-dns-firewall-org-share.svg
categories:
- [AWS]
- [Terraform]
tags:
- AWS
- Route 53
- DNS Firewall
- AWS RAM
- SCP
- Terraform
- セキュリティ
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

セキュリティ対策の一環として、**Route 53 Resolver DNS Firewall** の rule group を security 用アカウントで作り、AWS RAM で組織に共有して、各ワークロードアカウントの VPC に関連付けました。

導入は段階的に進めます。いきなり BLOCK にはせず、まず **ALERT（ブロックしない）** の rule group を関連付けて誤検知を確認し、誤検知がないことを確認した VPC から BLOCK の rule group に付け替えます。途中で SCP の明示 Deny や、関連付けの priority の予約値に引っかかったので、そのあたりも含めて残します。

※ 本記事は **2026年11月10日時点**の内容です。料金・仕様は公式ドキュメントで確認できた範囲で書いています。

<!-- more -->

## 結論

| 項目 | 内容 |
| --- | --- |
| 構成 | security 用アカウントで rule group を作成 → AWS RAM で組織に共有 → 各アカウントの Terraform で VPC に関連付け |
| rule group | ALERT 用と BLOCK 用の2つ。中身はどちらも AWS マネージドドメインリスト |
| 進め方 | まず ALERT で関連付けてクエリログで誤検知を確認し、問題のない VPC から BLOCK に付け替える |
| ハマりどころ1 | RAM 共有を絞る既存の SCP に明示 Deny され、共有できなかった |
| ハマりどころ2 | 関連付けの priority `100` は API で拒否される（`RSLVR-02017`）。`200` にした |
| ハマりどころ3 | rule group ID を remote state から読むので、Terraform 実行ロールに state の読み取り権限が必要 |
| 見る場所 | Resolver クエリログの `firewall_rule_action` / `firewall_domain_list_id` と、CloudWatch の `AWS/Route53Resolver` メトリクス |

## 背景: GuardDuty は検知するが、名前解決は止めない

GuardDuty の DNS 系 finding は、C&C ドメインなどへの名前解決を**検知**してくれますが、名前解決そのものは止めません。検証用に GuardDuty のテストドメインを引いてみると、finding は出るものの名前解決は普通に成功しました。

「検知はできているが送信側の DNS には何も対策が無い」状態だったので、送信 DNS クエリを検査・遮断できる DNS Firewall を入れることにしました。

## 構成: security アカウントで作って RAM で配る

```
[security アカウント]
  rule group: aws-managed-threat-alert (ALERT)
  rule group: aws-managed-threat-block (BLOCK / NODATA)
        │
        │ AWS RAM（組織全体に共有）
        ▼
[各ワークロードアカウント]
  VPC ── rule group association (priority 200)
      ├─ firewall config (fail open)
      └─ Resolver クエリログ → CloudWatch Logs
```

共有された rule group は、自分で作った rule group と同じように VPC へ関連付けられます。共有先のアカウントは rule group を変更・削除できないので、中身の管理を security アカウントに寄せられます（[Sharing Resolver DNS Firewall rule groups between AWS accounts](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-dns-firewall-rule-group-sharing.html) に明記されています）。

同じドキュメントには、**共有元が rule group を削除したり共有を止めたりすると、共有先で作った VPC との関連付けもすべて外れる**とも書かれています。security アカウント側の変更が全アカウントに効くので、rule group の destroy が plan に出ていないかは毎回気にしています。

### Firewall Manager ではなく RAM 共有にした理由

組織全体に配るなら AWS Firewall Manager の DNS Firewall ポリシーも候補でしたが、今回は採用しませんでした。

- Firewall Manager は**ポリシーごと・リージョンごとに月 $100**（リージョンによってはそれ以上）かかり、DNS Firewall 自体の料金は別に掛かる（[AWS Firewall Manager pricing](https://aws.amazon.com/firewall-manager/pricing/)）。見積もった DNS Firewall のクエリ料金よりこちらの方が大きかった
- Firewall Manager の管理者アカウントの設定が未了で、有効化には管理アカウント側の変更も要る
- 展開は対象アカウントを絞って順番に進めたかったので、VPC ごとに関連付ける方式の方が合っていた

Firewall Manager の DNS Firewall ポリシーに含める rule group は Firewall Manager の管理者アカウントに存在している必要があります（[DNS Firewall policies](https://docs.aws.amazon.com/waf/latest/developerguide/dns-firewall-policies.html) に「Your rule groups must already exist in the Firewall Manager administrator account」とある）。rule group は security アカウントにあるので、全アカウントへ一括で入れたくなったら、security アカウントを Firewall Manager の管理者アカウントにしたうえで同じ rule group をポリシーに載せ替えられる、という逃げ道も残しています。

## rule group の中身: AWS マネージドドメインリスト

rule group の中身は、AWS が管理する**マネージドドメインリスト**だけにしました（[Managed Domain Lists](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-dns-firewall-managed-domain-lists.html)）。公式ドキュメントに載っている Foundational のリストは次の4つです。

| リスト | 内容 |
| --- | --- |
| `AWSManagedDomainsMalwareDomainList` | マルウェアの送信・ホスト・配布に関わるドメイン |
| `AWSManagedDomainsBotnetCommandandControl` | ボットネットの C&C に関わるドメイン |
| `AWSManagedDomainsAggregateThreatList` | マルウェア・ランサムウェア・ボットネット・スパイウェア・DNS トンネリングなど複数カテゴリをまとめたもの。他のマネージドリストのドメインをすべて含む |
| `AWSManagedDomainsAmazonGuardDutyThreatList` | GuardDuty の DNS 系 finding に対応するドメイン（GuardDuty 内部の脅威インテリジェンス由来のみ） |

このうち Malware / Botnet C&C / GuardDuty Threat List の3つを1つの rule group に入れました。Aggregate を1本入れる方が簡単ですが、個別のリストに分けておくと、クエリログの `firewall_domain_list_id` で**どの種類の脅威に当たったか**が分かるので、こちらにしています（ここは私の判断で、公式の推奨ではありません）。

マネージドドメインリストについて、公式ドキュメントで確認できたことは次のとおりです。

- **ドメイン数の課金が無い**。課金は検査したクエリ数だけ（[Amazon Route 53 pricing](https://aws.amazon.com/route53/pricing/) に「No fees are charged for domain names within managed domain lists」とある）
- AWS が自動で更新する
- **中身は閲覧もダウンロードもできない**（回避策を作られないようにするため、と説明されている）
- 本番で使う前に、非本番環境で **action を Alert にして**試すことがベストプラクティスとして書かれている

最後の点がそのまま「ALERT から始める」理由です。中身が見えないリストなので、自分たちの通信が誤って当たらないかは実際に流してみるしかありません。

### Terraform（security アカウント側）

マネージドドメインリストには名前で引ける data source が無いため、ID を書いています。ID は `aws route53resolver list-firewall-domain-lists` で確認できます。

```console
$ aws route53resolver list-firewall-domain-lists \
    --query 'FirewallDomainLists[?ManagedOwnerName==`Route 53 Resolver DNS Firewall`].[Name,Id]' \
    --output table
```

ALERT と BLOCK を**別の rule group** にしているのは、共有先の VPC ごとに切り替え時期を選べるようにするためです。1つの rule group の action を書き換えると、関連付けている全 VPC に同時に効いてしまいます。

```hcl
locals {
  # NOTE: マネージドドメインリストは名前で引く data source が無いため ID を書く
  managed_domain_lists = {
    botnet_command_and_control = { id = "rslvr-fdl-xxxxxxxxxxxxxxxx", priority = 100 }
    malware                    = { id = "rslvr-fdl-xxxxxxxxxxxxxxxx", priority = 200 }
    guardduty_threat           = { id = "rslvr-fdl-xxxxxxxxxxxxxxxx", priority = 300 }
  }
}

data "aws_route53_resolver_firewall_domain_list" "managed" {
  for_each = local.managed_domain_lists

  firewall_domain_list_id = each.value.id
}

# NOTE: ALERT と BLOCK を分けるのは、共有先の VPC ごとに切り替え時期を選べるようにするため
resource "aws_route53_resolver_firewall_rule_group" "managed" {
  for_each = toset(["alert", "block"])

  name = "aws-managed-threat-${each.key}"
}

resource "aws_route53_resolver_firewall_rule" "managed" {
  for_each = {
    for pair in setproduct(["alert", "block"], keys(local.managed_domain_lists)) :
    "${pair[0]}_${pair[1]}" => { action = pair[0], domain_list = pair[1] }
  }

  name                    = data.aws_route53_resolver_firewall_domain_list.managed[each.value.domain_list].name
  action                  = upper(each.value.action)
  block_response          = each.value.action == "block" ? "NODATA" : null
  firewall_domain_list_id = data.aws_route53_resolver_firewall_domain_list.managed[each.value.domain_list].id
  firewall_rule_group_id  = aws_route53_resolver_firewall_rule_group.managed[each.value.action].id
  priority                = local.managed_domain_lists[each.value.domain_list].priority
}

resource "aws_ram_resource_share" "dns_firewall" {
  name                      = "dns-firewall-rule-groups"
  allow_external_principals = false
}

resource "aws_ram_principal_association" "organization" {
  principal          = data.aws_organizations_organization.this.arn
  resource_share_arn = aws_ram_resource_share.dns_firewall.arn
}

resource "aws_ram_resource_association" "dns_firewall" {
  for_each = aws_route53_resolver_firewall_rule_group.managed

  resource_arn       = each.value.arn
  resource_share_arn = aws_ram_resource_share.dns_firewall.arn
}

output "dns_firewall_rule_group_id" {
  value = { for k, v in aws_route53_resolver_firewall_rule_group.managed : k => v.id }
}
```

組織（Organization の ARN）を principal にするには、管理アカウントで AWS RAM の「AWS Organizations との共有」を有効にしておく必要があります（[Enable resource sharing within AWS Organizations](https://docs.aws.amazon.com/ram/latest/userguide/getting-started-sharing.html#getting-started-sharing-orgs)）。

## ハマりどころ1: SCP で RAM 共有が明示 Deny された

security アカウントの apply で、rule group と resource share の作成は通ったのに、`aws_ram_resource_association`（rule group を resource share に載せる部分）だけが `ram:AssociateResourceShare` の **SCP 明示 Deny** で失敗しました。

組織には、RAM での共有を「security アカウントのプレフィックスリストだけ」に絞る SCP が入っていました。例外を足した後の SCP を、推奨されている書き方で示すと次のようになります。

```hcl
data "aws_iam_policy_document" "deny_ram_sharing_except_allowed" {
  statement {
    effect = "Deny"
    actions = [
      "ram:CreateResourceShare",
      "ram:AssociateResourceShare",
    ]
    resources = ["*"]

    condition {
      test     = "ForAnyValue:ArnNotLike"
      variable = "ram:RequestedResourceArns"
      values = [
        "arn:aws:ec2:*:${local.security_account_id}:prefix-list/*",
        # NOTE: DNS Firewall の rule group は security アカウントが作って組織に共有する
        "arn:aws:route53resolver:*:${local.security_account_id}:firewall-rule-group/*",
      ]
    }
  }
}
```

例外として **security アカウントの `firewall-rule-group` の ARN だけ**を許可リストに追加します。共有元は security アカウントに限定したままなので、他のアカウントからの RAM 共有は引き続き Deny されます。

上の例は、[Example IAM policies for AWS RAM](https://docs.aws.amazon.com/ram/latest/userguide/security-iam-policies-examples.html) で推奨されている多値キー `ram:RequestedResourceArns` と `ForAnyValue` の組み合わせで書いています。

- `ram:RequestedResourceArns` はリクエストに含まれるリソース ARN をすべて持ち、そのアクションのどのリクエストコンテキストにも存在するので、1つの条件でリクエスト全体を評価できる
- `ArnNotLike` のような否定の演算子に複数の値を書くと NOR として評価される（[IAM のドキュメント](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_condition-logic-multiple-context-keys-or-values.html)）。つまり「許可リストのどれにも一致しない ARN が1つでも含まれていれば Deny」になる
- principal だけを追加するリクエストにはリソースが無いのでキー自体が存在せず、`ForAnyValue` の条件はマッチしない。そのため principal の追加は Deny されない

単一値キーの `ram:ResourceArn` は、そのリソースを評価するリクエストコンテキストにしか存在しないため、使う場合は `Null` 条件を併用する必要がある、とも同じドキュメントに書かれています。

なお、SCP は plan では評価されないので、**apply して初めて失敗が分かります**。rule group と resource share は作られていて、resource association だけが欠けた状態で止まるので、共有先から rule group が見えずに後続の関連付けも失敗しました。SCP を直してから security 側の apply を再実行し、共有先で `ShareStatus` が `SHARED_WITH_ME` になったことを確認してから先に進めます。

```console
$ aws route53resolver list-firewall-rule-groups \
    --query 'FirewallRuleGroups[].[Name,ShareStatus]' --output table
```

## ハマりどころ2: 関連付けの priority 100 は使えない

ワークロードアカウント側で `priority = 100` で関連付けたところ、`AssociateFirewallRuleGroup` が次のエラーで失敗しました。

```
ValidationException: [RSLVR-02017] The priority value you provided
is reserved. Provide a number between "100" and "9900".
```

[AssociateFirewallRuleGroup の API リファレンス](https://docs.aws.amazon.com/Route53/latest/APIReference/API_route53resolver_AssociateFirewallRuleGroup.html)には「allowed values for `Priority` are between 100 and 9900」とあり、エラーメッセージも「100〜9900 を指定せよ」と言っていますが、**境界値の 100 自体は予約されていて拒否されます**。100 が予約されている理由は公式ドキュメントでは確認できませんでした。同じ API リファレンスでは、後から rule group を挟めるよう間隔を空ける例として `101, 200` が挙がっています。

最終的に **200** にしました。理由は次のとおりです。

- 100 は予約で使えない
- 1つの VPC 内で priority は一意である必要があり、数字が小さい rule group から評価される。100 台を空けておけば、共有 rule group より前に評価させたい rule group（例えば特定ドメインの許可リスト）を後から挟める
- 社内で先に DNS Firewall を入れていた VPC の関連付けが 200 だったので、それに揃えた

なお、これは**関連付け**の priority の話で、rule group 内の各 rule の priority（上の例の 100 / 200 / 300）には同じ制約は無く、100 でも作成できました。この制約も plan では検出できず apply で初めて分かるので、コードにコメントを残しています。

## ハマりどころ3: remote state の読み取り権限

ワークロードアカウント側では、rule group ID を security アカウント側の Terraform の output から `terraform_remote_state` で読んでいます。

```hcl
data "terraform_remote_state" "security" {
  backend = "s3"

  config = {
    bucket = "example-terraform-backend"
    key    = "security/terraform.tfstate"
    region = "ap-northeast-1"
  }
}

resource "aws_route53_resolver_firewall_config" "main" {
  resource_id        = module.vpc.vpc_id
  firewall_fail_open = "ENABLED"
}

# NOTE: priority の下限 100 は予約されており AssociateFirewallRuleGroup が RSLVR-02017 で拒否するため 200 にする
resource "aws_route53_resolver_firewall_rule_group_association" "managed_threat" {
  name                   = "${local.prefix}-aws-managed-threat"
  firewall_rule_group_id = data.terraform_remote_state.security.outputs.dns_firewall_rule_group_id["alert"]
  priority               = 200
  vpc_id                 = module.vpc.vpc_id
}
```

私たちの環境では、Terraform の plan / apply 用ロールが読める state を**リポジトリ・環境ごとに許可リストで管理**しています。最初の plan は、そのロールに security 側の state の `s3:GetObject` が無いため 403 で止まりました。許可リストに security 側の state を追加して解消しています。

- plan 用と apply 用でロールが分かれていると、**plan は通るのに apply で 403** ということが起こる。実際、ある環境では plan 用ロールは既に読めていて、apply 用ロールだけ追加が必要だった
- 読ませる state に平文の秘密情報が入っていないかは、許可を足す前に確認した

rule group ID は変わらないので変数にベタ書きする手もありますが、rule group を作り直したときに全アカウントの書き換えが要るので、remote state 参照にしました。

## fail open にした理由

`aws_route53_resolver_firewall_config` で **fail open** を有効にしています。[DNS Firewall VPC configuration](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-dns-firewall-vpc-configuration.html) によると、デフォルトは fail closed で、DNS Firewall から応答が得られないクエリは `SERVFAIL` で落とされます（セキュリティ優先）。fail open にすると、その場合でもクエリを通します（可用性優先）。

DNS Firewall 側の障害でアプリケーションの名前解決がすべて止まるのは避けたいので、fail open を選びました。障害中は検査が効かない、というトレードオフは受け入れています。

## ログと検知の見方

### Resolver クエリログを有効にする

**どのドメインがどのリストに当たったかは、Resolver のクエリログにしか出ません**。なので rule group の関連付けと同時に、クエリログを CloudWatch Logs に出すようにしました。

```hcl
resource "aws_cloudwatch_log_group" "route53_resolver" {
  name              = "${local.prefix}/route53-resolver/query-logs"
  retention_in_days = 14
}

resource "aws_route53_resolver_query_log_config" "main" {
  name            = "${local.prefix}-main"
  destination_arn = aws_cloudwatch_log_group.route53_resolver.arn
}

resource "aws_route53_resolver_query_log_config_association" "main" {
  resolver_query_log_config_id = aws_route53_resolver_query_log_config.main.id
  resource_id                  = module.vpc.vpc_id
}
```

[Amazon Route 53 pricing](https://aws.amazon.com/route53/pricing/) に「Route 53 does not charge for VPC Resolver query logs」とあり、クエリログ自体に Route 53 側の料金は無く、出力先（今回は CloudWatch Logs の取り込みと保存）の料金だけが掛かります。

### テスト用ドメインで動作確認する

AWS はマネージドドメインリストの動作確認用ドメインを公開しています（[Managed Domain Lists](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-dns-firewall-managed-domain-lists.html)）。ブロックされなければ `1.2.3.4` に解決され、BLOCK ならそのルールの block response（今回なら NODATA）が返ります。

| リスト | テスト用ドメイン（1つ目） |
| --- | --- |
| Botnet C&C | `controldomain1.botnetlist.firewall.route53resolver.us-east-1.amazonaws.com` |
| Malware | `controldomain1.malwarelist.firewall.route53resolver.us-east-1.amazonaws.com` |
| Aggregate / GuardDuty Threat List | `controldomain1.aggregatelist.firewall.route53resolver.us-east-1.amazonaws.com` |

GuardDuty のテスト用 C&C ドメインは、マネージドドメインリストに入っているとは限らないので、DNS Firewall の確認にはこちらを使います。VPC 内のコンテナから引くと、ALERT なので名前解決はそのまま通ります。

```console
$ getent ahostsv4 controldomain1.botnetlist.firewall.route53resolver.us-east-1.amazonaws.com
1.2.3.4         STREAM controldomain1.botnetlist.firewall.route53resolver.us-east-1.amazonaws.com
```

クエリログには `firewall_rule_action: ALERT` と `firewall_domain_list_id`（Botnet C&C のリストの ID）が付いた記録が残りました。

公式ドキュメントの [Configuring logging for DNS Firewall](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/firewall-resolver-query-logs-configuring.html) には「DNS Firewall 固有のフィールドはブロックされたクエリにだけ出る」という Note がありますが、**実際には ALERT のクエリにも `firewall_rule_action` などが付いて記録されました**。同じページの冒頭には「The logs provide the domain list name for all alerts and blocking actions」ともあり、ページ内でも記述が揃っていません。どちらが正しいかの公式の説明は確認できていません。

### Logs Insights で ALERT を探す

ALERT で関連付けている間は、週1回ほど次のクエリで ALERT が出ていないかを確認します。

```
fields @timestamp, query_name, query_type, firewall_rule_action, firewall_domain_list_id, srcids.instance, srcaddr
| filter ispresent(firewall_rule_action)
| sort @timestamp desc
| limit 100
```

テスト用ドメイン以外の ALERT が出たら、`firewall_domain_list_id` でどのリストかを見て、`srcids` や `srcaddr` からどのリソースが引いたかを追います。マネージドドメインリストは中身が見えないので、「当たったドメインが本当に悪性か」は自分たちで判断する必要があります。公式ドキュメントの「Mitigating false positive scenarios」では、誤検知したドメインだけを入れたカスタムドメインリストの ALLOW ルールを、**同じ rule group 内で**マネージドリストのルールより小さい priority で追加する手順が案内されています。共有 rule group は共有先から変更できないので、security アカウント側で足すか、共有 rule group より小さい priority で VPC ごとの許可用 rule group を挟むことになると思います（後者は未検証です）。

### CloudWatch メトリクスで量を見る

`AWS/Route53Resolver` 名前空間に、DNS Firewall のメトリクスが5分間隔で出ます（[Monitoring Resolver DNS Firewall rule groups with Amazon CloudWatch](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/monitoring-resolver-dns-firewall-with-cloudwatch.html)）。

| メトリクス | ディメンション | 用途 |
| --- | --- | --- |
| `VpcFirewallQueryVolume` | `VpcId` | VPC からの DNS Firewall のクエリ数。**料金の見積もりの目安になる** |
| `FirewallRuleGroupQueryVolume` | `FirewallRuleGroupId` | rule group にマッチしたクエリ数 |
| `FirewallRuleGroupVpcQueryVolume` | `FirewallRuleGroupId`, `VpcId` | VPC × rule group でマッチしたクエリ数 |
| `FirewallRuleQueryVolume` | `FirewallRuleGroupId`, `FirewallDomainListId` | rule group 内のドメインリストごとにマッチしたクエリ数 |

`FirewallRuleQueryVolume` でリストごとの件数までは分かりますが、どのドメインが当たったかはクエリログを見る必要があります。

導入前は VPC Flow Logs の接続数から DNS クエリ数の上限を見積もっていましたが（Amazon DNS サーバー宛ての通信は [Flow Logs に記録されない](https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs-limitations.html)ため直接は数えられません）、`VpcFirewallQueryVolume` の実測は**その見積もりの数分の1**でした。アプリ側のキャッシュや keep-alive で、接続数ほどは名前解決していないためだと思います。クエリ料金は検査したクエリ 100 万件あたり $0.60（最初の 10 億件/月まで）で、私たちの規模では Firewall Manager のポリシー料金より一桁以上小さくなりました。

## 注意点・BLOCK への切り替え

- BLOCK への切り替えは、誤検知がないことを確認した VPC から、関連付ける rule group を `alert` → `block` に付け替えて行う（`dns_firewall_rule_group_id["alert"]` を `["block"]` に変えるだけ）。VPC 単位で切り替えられるので、問題があれば `alert` に戻せばよい
- BLOCK にした後も GuardDuty の DNS 系 finding が出続けるかは、公式ドキュメントでは明記を確認できていません（未確認）。既存の検知経路がそのまま使えることを前提にせず、切り替えた VPC で確かめる必要があります
- SCP と priority の予約値は **plan では検出できず apply で初めて失敗**しました。state の読み取り権限は plan 用ロールなら plan で 403 になって気付けますが、apply 用ロールの不足は plan が通っても分かりません。複数リポジトリにまたがる変更なので、マージ・apply の順番（SCP → security 側 → state 権限 → ワークロード側）を先に決めておくべきでした

## まとめ

- セキュリティ対策の一環として、DNS Firewall の rule group を security アカウントで作り、AWS RAM で組織に共有して各 VPC に関連付けた
- 中身は AWS マネージドドメインリスト。中身が見えないので、公式のベストプラクティスどおり ALERT から始めて誤検知を確認し、問題のない VPC から BLOCK に付け替える
- ALERT と BLOCK を別 rule group にしておくと、VPC ごとに切り替え時期を選べる
- RAM 共有を絞る SCP があるなら、共有したいリソースの ARN を例外に足す必要がある
- 関連付けの priority 100 は予約で使えない。後から rule group を挟めるよう 200 にした
- どのドメインが当たったかはクエリログにしか出ないので、関連付けと同時にクエリログを有効にしておく

参考になれば幸いです。

## 参考

- [Managed Domain Lists](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-dns-firewall-managed-domain-lists.html)
- [Sharing Resolver DNS Firewall rule groups between AWS accounts](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-dns-firewall-rule-group-sharing.html)
- [AssociateFirewallRuleGroup](https://docs.aws.amazon.com/Route53/latest/APIReference/API_route53resolver_AssociateFirewallRuleGroup.html)
- [DNS Firewall VPC configuration](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-dns-firewall-vpc-configuration.html)
- [Configuring logging for DNS Firewall](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/firewall-resolver-query-logs-configuring.html)
- [Route 53 VPC Resolver query log example](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-query-logs-example-json.html)
- [Monitoring Resolver DNS Firewall rule groups with Amazon CloudWatch](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/monitoring-resolver-dns-firewall-with-cloudwatch.html)
- [Example IAM policies for AWS RAM](https://docs.aws.amazon.com/ram/latest/userguide/security-iam-policies-examples.html)
- [Condition evaluation logic for multiple context keys or values (IAM)](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_condition-logic-multiple-context-keys-or-values.html)
- [Enable resource sharing within AWS Organizations](https://docs.aws.amazon.com/ram/latest/userguide/getting-started-sharing.html#getting-started-sharing-orgs)
- [Flow log limitations](https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs-limitations.html)
- [Amazon Route 53 pricing](https://aws.amazon.com/route53/pricing/)
- [AWS Firewall Manager pricing](https://aws.amazon.com/firewall-manager/pricing/)
- [DNS Firewall policies (AWS Firewall Manager)](https://docs.aws.amazon.com/waf/latest/developerguide/dns-firewall-policies.html)
