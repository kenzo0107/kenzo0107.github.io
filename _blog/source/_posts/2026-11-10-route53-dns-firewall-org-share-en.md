---
title: Sharing Route 53 Resolver DNS Firewall Rule Groups Across an Organization with AWS RAM and Rolling Out from ALERT to BLOCK
date: 2026-11-10
lang: en
translation_id: route53-dns-firewall-org-share
permalink: en/2026/11/10/route53-dns-firewall-org-share/
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
- Security
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

As part of our security measures, I created **Route 53 Resolver DNS Firewall** rule groups in our security account, shared them with the organization through AWS RAM, and associated them with the VPCs in each workload account.

The rollout is staged. Instead of jumping straight to BLOCK, you first associate the **ALERT (no blocking)** rule group to check for false positives, and then swap to the BLOCK rule group for each VPC confirmed to have none. Along the way I hit an explicit Deny from an SCP and a reserved priority value for associations, so I'm writing those down too.

Note: this post reflects the state as of **November 10, 2026**. Pricing and behavior are described only as far as I could confirm in the official documentation.

<!-- more -->

## Conclusion

| Item | Detail |
| --- | --- |
| Architecture | Create rule groups in the security account → share with the organization via AWS RAM → associate with VPCs from each account's Terraform |
| Rule groups | Two: one for ALERT and one for BLOCK. Both contain only AWS managed domain lists |
| Rollout | Associate in ALERT mode first, check the query logs for false positives, then swap to BLOCK for VPCs without issues |
| Gotcha 1 | An existing SCP that restricts RAM sharing explicitly denied the share |
| Gotcha 2 | Association priority `100` is rejected by the API (`RSLVR-02017`). I used `200` |
| Gotcha 3 | The rule group ID is read from remote state, so the Terraform execution roles need read access to that state |
| Where to look | `firewall_rule_action` / `firewall_domain_list_id` in Resolver query logs, and `AWS/Route53Resolver` metrics in CloudWatch |

## Background: GuardDuty detects, but doesn't stop resolution

GuardDuty's DNS findings **detect** lookups of C&C domains and the like, but they don't stop the lookup itself. When I resolved GuardDuty's test domain for verification, a finding was raised, yet the name resolved just fine.

We could detect, but had nothing on the outbound DNS path. So I decided to introduce DNS Firewall, which can inspect and block outbound DNS queries.

## Architecture: build in the security account, distribute with RAM

```
[security account]
  rule group: aws-managed-threat-alert (ALERT)
  rule group: aws-managed-threat-block (BLOCK / NODATA)
        │
        │ AWS RAM (shared with the whole organization)
        ▼
[each workload account]
  VPC ── rule group association (priority 200)
      ├─ firewall config (fail open)
      └─ Resolver query logs → CloudWatch Logs
```

A shared rule group can be associated with your VPCs the same way as one you created yourself. Accounts it's shared with can't change or delete it, so the contents can be managed centrally in the security account (this is stated in [Sharing Resolver DNS Firewall rule groups between AWS accounts](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-dns-firewall-rule-group-sharing.html)).

The same page also says that **if the owner deletes or stops sharing the rule group, DNS Firewall removes all VPC associations the other accounts created**. Changes in the security account affect every account, so I always check that no rule group destroy shows up in the plan.

### Why RAM sharing instead of Firewall Manager

AWS Firewall Manager's DNS Firewall policy was also a candidate for organization-wide distribution, but I didn't adopt it this time.

- Firewall Manager costs **$100 per policy per region per month** (more in some regions), and DNS Firewall itself is charged separately ([AWS Firewall Manager pricing](https://aws.amazon.com/firewall-manager/pricing/)). That was larger than our estimated DNS Firewall query cost
- The Firewall Manager administrator account wasn't set up yet, and enabling it would require changes in the management account as well
- I wanted to roll out gradually to a limited set of accounts, which fits per-VPC association better

Rule groups included in a Firewall Manager DNS Firewall policy must exist in the Firewall Manager administrator account ([DNS Firewall policies](https://docs.aws.amazon.com/waf/latest/developerguide/dns-firewall-policies.html) says "Your rule groups must already exist in the Firewall Manager administrator account"). Since the rule groups live in the security account, there's still an escape hatch: if we later want to apply them to all accounts at once, we can make the security account the Firewall Manager administrator and put the same rule groups into a policy.

## Rule group contents: AWS managed domain lists

The rule groups contain only AWS **managed domain lists** ([Managed Domain Lists](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-dns-firewall-managed-domain-lists.html)). The official docs list these four Foundational lists.

| List | Contents |
| --- | --- |
| `AWSManagedDomainsMalwareDomainList` | Domains associated with sending, hosting, or distributing malware |
| `AWSManagedDomainsBotnetCommandandControl` | Domains associated with botnet command and control |
| `AWSManagedDomainsAggregateThreatList` | Multiple categories combined, including malware, ransomware, botnet, spyware, and DNS tunneling. Includes all domains in the other managed lists |
| `AWSManagedDomainsAmazonGuardDutyThreatList` | Domains associated with GuardDuty DNS findings (sourced only from GuardDuty's internal threat intelligence) |

I put three of them — Malware, Botnet C&C, and GuardDuty Threat List — into one rule group. A single Aggregate list would be simpler, but with separate lists, `firewall_domain_list_id` in the query logs tells you **which kind of threat matched** (this is my own judgment, not an official recommendation).

What I could confirm about managed domain lists in the official docs:

- **No per-domain charge**. You pay only for inspected queries ([Amazon Route 53 pricing](https://aws.amazon.com/route53/pricing/) says "No fees are charged for domain names within managed domain lists")
- AWS updates them automatically
- **You can't view or download the contents** (explained as a way to prevent threats designed to circumvent published lists)
- The best practice is to test them in a non-production environment **with the rule action set to Alert** before using them in production

That last point is exactly why I started with ALERT. Since you can't see what's in the lists, the only way to know whether your own traffic hits them by mistake is to actually run them.

### Terraform (security account)

There's no data source to look up a managed domain list by name, so the IDs are written out. You can find them with `aws route53resolver list-firewall-domain-lists`.

```console
$ aws route53resolver list-firewall-domain-lists \
    --query 'FirewallDomainLists[?ManagedOwnerName==`Route 53 Resolver DNS Firewall`].[Name,Id]' \
    --output table
```

ALERT and BLOCK are **separate rule groups** so each consuming VPC can pick its own switch-over timing. Changing the action of a single rule group would take effect on every associated VPC at once.

```hcl
locals {
  # NOTE: There's no data source to look up managed domain lists by name, so the IDs are written out
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

# NOTE: ALERT and BLOCK are separate so each consuming VPC can choose when to switch
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

To use the organization ARN as a principal, sharing with AWS Organizations must be enabled in AWS RAM from the management account ([Enable resource sharing within AWS Organizations](https://docs.aws.amazon.com/ram/latest/userguide/getting-started-sharing.html#getting-started-sharing-orgs)).

## Gotcha 1: an SCP explicitly denied the RAM share

In the security account's apply, the rule groups and the resource share were created, but only `aws_ram_resource_association` (adding the rule groups to the resource share) failed with an **explicit Deny from an SCP** on `ram:AssociateResourceShare`.

Our organization had an SCP that limits RAM sharing to "prefix lists in the security account only". With the exception added, and written in the recommended form, it looks like this.

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
        # NOTE: DNS Firewall rule groups are created in the security account and shared with the organization
        "arn:aws:route53resolver:*:${local.security_account_id}:firewall-rule-group/*",
      ]
    }
  }
}
```

Add **only the security account's `firewall-rule-group` ARN** to the allow list as an exception. Sharing is still restricted to the security account as the owner, so RAM shares from any other account remain denied.

The example above uses the multivalued key `ram:RequestedResourceArns` with `ForAnyValue`, as recommended in [Example IAM policies for AWS RAM](https://docs.aws.amazon.com/ram/latest/userguide/security-iam-policies-examples.html).

- `ram:RequestedResourceArns` holds every resource ARN in the request and is present in every request context for the action, so one condition evaluates the whole request
- A negated operator such as `ArnNotLike` with multiple values is evaluated as a NOR ([IAM documentation](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_condition-logic-multiple-context-keys-or-values.html)). So the statement denies the request if any ARN in it matches none of the allowed patterns
- A request that only adds principals has no resources, so the key isn't present and the `ForAnyValue` condition doesn't match. Adding principals is therefore not denied

The same page notes that the single-valued `ram:ResourceArn` is present only in the request context for the resource it describes, so a policy that uses it needs an extra `Null` condition.

SCPs aren't evaluated during plan, so **you only find out at apply time**. The apply stopped with the rule groups and resource share created but the resource associations missing, so the rule groups weren't visible to consuming accounts and the subsequent VPC association failed too. After fixing the SCP, re-run the security account's apply and confirm `ShareStatus` is `SHARED_WITH_ME` on the consuming side before moving on.

```console
$ aws route53resolver list-firewall-rule-groups \
    --query 'FirewallRuleGroups[].[Name,ShareStatus]' --output table
```

## Gotcha 2: association priority 100 can't be used

When I associated with `priority = 100` from a workload account, `AssociateFirewallRuleGroup` failed with this error.

```
ValidationException: [RSLVR-02017] The priority value you provided
is reserved. Provide a number between "100" and "9900".
```

The [AssociateFirewallRuleGroup API reference](https://docs.aws.amazon.com/Route53/latest/APIReference/API_route53resolver_AssociateFirewallRuleGroup.html) says "The allowed values for `Priority` are between 100 and 9900", and the error message says the same, but **the boundary value 100 itself is reserved and rejected**. I couldn't find the reason 100 is reserved in the official docs. The same API reference suggests leaving gaps, with `101, 200` as the example.

I settled on **200** for these reasons.

- 100 is reserved and can't be used
- Priorities must be unique within a VPC, and rule groups with lower numbers are evaluated first. Leaving the 100s free lets us later insert a rule group that should run before the shared one (for example, an allow list for specific domains)
- VPCs in our company that had adopted DNS Firewall earlier used 200 for their associations, so I matched that

This applies to the **association** priority. The priorities of rules inside a rule group (100 / 200 / 300 in the example above) don't have this restriction, and 100 worked there. This one also can't be caught by plan and only fails at apply, so I left a comment in the code.

## Gotcha 3: read access to remote state

On the workload account side, the rule group ID is read from the security account's Terraform output via `terraform_remote_state`.

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

# NOTE: The lower bound 100 is reserved and AssociateFirewallRuleGroup rejects it with RSLVR-02017, so use 200
resource "aws_route53_resolver_firewall_rule_group_association" "managed_threat" {
  name                   = "${local.prefix}-aws-managed-threat"
  firewall_rule_group_id = data.terraform_remote_state.security.outputs.dns_firewall_rule_group_id["alert"]
  priority               = 200
  vpc_id                 = module.vpc.vpc_id
}
```

In our environment, the state files that the Terraform plan/apply roles can read are **managed by an allow list per repository and environment**. The first plan stopped with a 403 because the role had no `s3:GetObject` on the security account's state. Adding that state to the allow list fixed it.

- If plan and apply use different roles, you can end up with **plan passing but apply failing with 403**. In fact, in one environment the plan role could already read the state and only the apply role needed it
- Before granting access, I checked that the state being exposed contained no plaintext secrets

Since the rule group ID doesn't change, hard-coding it in a variable is an option, but recreating the rule group would then require edits in every account, so I went with remote state.

## Why fail open

`aws_route53_resolver_firewall_config` enables **fail open**. According to [DNS Firewall VPC configuration](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-dns-firewall-vpc-configuration.html), the default is fail closed: queries that don't get a reply from DNS Firewall are dropped with `SERVFAIL` (favoring security). Fail open lets them through in that case (favoring availability).

I didn't want a DNS Firewall outage to stop all name resolution for our applications, so I chose fail open. I accept the trade-off that inspection doesn't apply during such an outage.

## Reading the logs and detections

### Enable Resolver query logging

**Which domain matched which list only shows up in the Resolver query logs**. So together with the rule group association, I sent the query logs to CloudWatch Logs.

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

[Amazon Route 53 pricing](https://aws.amazon.com/route53/pricing/) says "Route 53 does not charge for VPC Resolver query logs", so there's no Route 53 charge for the logs themselves — you only pay for the destination (here, CloudWatch Logs ingestion and storage).

### Verify with the test domains

AWS publishes test domains for the managed domain lists ([Managed Domain Lists](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-dns-firewall-managed-domain-lists.html)). If not blocked they resolve to `1.2.3.4`; with BLOCK, you get the rule's block response (NODATA in our case).

| List | Test domain (first one) |
| --- | --- |
| Botnet C&C | `controldomain1.botnetlist.firewall.route53resolver.us-east-1.amazonaws.com` |
| Malware | `controldomain1.malwarelist.firewall.route53resolver.us-east-1.amazonaws.com` |
| Aggregate / GuardDuty Threat List | `controldomain1.aggregatelist.firewall.route53resolver.us-east-1.amazonaws.com` |

GuardDuty's test C&C domain isn't necessarily in the managed domain lists, so use these for DNS Firewall checks. Resolving from a container in the VPC, the lookup goes through because we're in ALERT mode.

```console
$ getent ahostsv4 controldomain1.botnetlist.firewall.route53resolver.us-east-1.amazonaws.com
1.2.3.4         STREAM controldomain1.botnetlist.firewall.route53resolver.us-east-1.amazonaws.com
```

The query logs recorded an entry with `firewall_rule_action: ALERT` and `firewall_domain_list_id` (the ID of the Botnet C&C list).

The official [Configuring logging for DNS Firewall](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/firewall-resolver-query-logs-configuring.html) has a note saying "The query logs will show the additional DNS Firewall fields for only the queries that are blocked", but **in practice, ALERT queries were also logged with `firewall_rule_action` and friends**. The opening of the same page also says "The logs provide the domain list name for all alerts and blocking actions", so the page isn't consistent with itself either. I couldn't find an official explanation of which is correct.

### Find ALERTs with Logs Insights

While the ALERT rule group is associated, check for ALERTs roughly once a week with this query.

```
fields @timestamp, query_name, query_type, firewall_rule_action, firewall_domain_list_id, srcids.instance, srcaddr
| filter ispresent(firewall_rule_action)
| sort @timestamp desc
| limit 100
```

If an ALERT other than the test domains shows up, check `firewall_domain_list_id` for which list it was, and trace the resource that made the query via `srcids` or `srcaddr`. Since the managed lists are opaque, you have to judge for yourself whether the matched domain is really malicious. The "Mitigating false positive scenarios" section of the official docs recommends adding an ALLOW rule with a custom domain list containing only the falsely flagged domain, **inside the same rule group**, at a lower priority than the managed-list rule. Shared rule groups can't be modified by consumers, so this would mean adding it in the security account, or inserting a per-VPC allow rule group at a lower priority than the shared one (I haven't tested the latter).

### Watch volume with CloudWatch metrics

DNS Firewall metrics are published to the `AWS/Route53Resolver` namespace every five minutes ([Monitoring Resolver DNS Firewall rule groups with Amazon CloudWatch](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/monitoring-resolver-dns-firewall-with-cloudwatch.html)).

| Metric | Dimensions | Use |
| --- | --- | --- |
| `VpcFirewallQueryVolume` | `VpcId` | Number of DNS Firewall queries from the VPC. **A good guide for cost estimates** |
| `FirewallRuleGroupQueryVolume` | `FirewallRuleGroupId` | Number of queries that matched the rule group |
| `FirewallRuleGroupVpcQueryVolume` | `FirewallRuleGroupId`, `VpcId` | Queries matched per VPC × rule group |
| `FirewallRuleQueryVolume` | `FirewallRuleGroupId`, `FirewallDomainListId` | Queries matched per domain list within a rule group |

`FirewallRuleQueryVolume` gives you counts per list, but to see which domain matched you still need the query logs.

Before rollout, I estimated an upper bound on DNS queries from connection counts in VPC Flow Logs (traffic to the Amazon DNS server [isn't captured by Flow Logs](https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs-limitations.html), so it can't be counted directly). The measured `VpcFirewallQueryVolume` turned out to be **a fraction of that estimate**, probably because application-side caching and keep-alive mean far fewer lookups than connections. Queries cost $0.60 per million inspected (for the first billion per month), and at our scale this came out more than an order of magnitude cheaper than the Firewall Manager policy fee.

## Caveats and switching to BLOCK

- Switch to BLOCK by swapping the associated rule group from `alert` to `block` for each VPC confirmed to have no false positives (just change `dns_firewall_rule_group_id["alert"]` to `["block"]`). Since it's per VPC, you can switch back to `alert` if anything goes wrong
- I couldn't confirm in the official docs whether GuardDuty DNS findings keep firing after switching to BLOCK (unverified). Don't assume the existing detection pipeline works unchanged; check it on the VPCs you switch
- The SCP and the reserved priority value **slipped past plan and only failed at apply**. Missing state read permission shows up as a 403 at plan time for the plan role, but a missing permission on the apply role doesn't show up even when plan passes. Since the change spans multiple repositories, I should have fixed the merge/apply order up front (SCP → security account → state permissions → workload accounts)

## Summary

- As part of our security measures, I created DNS Firewall rule groups in the security account, shared them with the organization via AWS RAM, and associated them with each VPC
- They contain AWS managed domain lists. Since the contents are opaque, start with ALERT per the official best practice, check for false positives, and swap to BLOCK for VPCs without issues
- Keeping ALERT and BLOCK as separate rule groups lets each VPC choose when to switch
- If you have an SCP restricting RAM sharing, you need to add the ARNs of the resources you want to share as exceptions
- Association priority 100 is reserved. I used 200 to leave room for inserting rule groups later
- Which domain matched only shows up in the query logs, so enable query logging together with the association

I hope this helps.

## References

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
