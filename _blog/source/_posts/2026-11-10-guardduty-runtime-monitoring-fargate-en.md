---
title: Rolling Out GuardDuty Runtime Monitoring for ECS Fargate from the Delegated Administrator with Terraform
date: 2026-11-10
lang: en
translation_id: guardduty-runtime-monitoring-fargate
permalink: en/2026/11/10/guardduty-runtime-monitoring-fargate/
cover: /img/cover/2026-11-10-guardduty-runtime-monitoring-fargate.svg
categories:
- [AWS]
- [Terraform]
tags:
- AWS
- GuardDuty
- ECS
- Fargate
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

As part of our security work, I rolled out GuardDuty **Runtime Monitoring (ECS Fargate, automated agent management)** from the delegated administrator account with Terraform, one workload account at a time, stg first and then prd.

Until then, GuardDuty only looked at what happens "outside" the containers: CloudTrail, VPC Flow Logs and DNS logs. It could not tell what ran inside an ECS task. With Runtime Monitoring, GuardDuty automatically attaches a security agent sidecar to Fargate tasks and detects threats from OS-level events such as process launches and network connections.

Turning it on is a single Terraform resource, but in practice I ran into **new tasks failing to start in prd** and **a replace drift showing up in every plan**. This post records those, together with the prerequisites I check now.

※ This post reflects the state as of **November 10, 2026**. Terraform behavior was checked with `hashicorp/aws` v6.66.0 (when the drift appeared) and v6.70.0 (the fixed version). Prices are public prices for the Tokyo Region (from the AWS Price List API).

<!-- more -->

## Conclusion

| Item | Details |
| --- | --- |
| How it is enabled | In the delegated administrator account, `aws_guardduty_member_detector_feature` lists the target accounts and enables `RUNTIME_MONITORING` + `ECS_FARGATE_AGENT_MANAGEMENT` |
| Why not auto-enable for the whole organization | The sidecar shares the task's CPU and memory, so I wanted to check the impact in stg and expand account by account |
| Biggest gotcha | If the task execution role only allows ECR pulls from your own repositories, pulling the agent fails with 403 and **new tasks can't start** |
| Terraform gotcha (1) | Declaring only the ECS entry in `additional_configuration` produces an in-place diff every time, because the API returns the unspecified EKS / EC2 entries as DISABLED. Declare all three |
| Terraform gotcha (2) | AWS added `RDS_DATA_RISK` under `RDS_LOGIN_EVENTS`, so the organization-level `rds_protection` was replaced in every Region on every plan. Fixed in v6.70.0 |
| Cost | Usage-based on Fargate task vCPU × running hours. In Tokyo, $2.00 per vCPU for the first 500 vCPUs per month |
| Checking rollout status | A hand-maintained table drifts from reality, so a script builds the table from the actual AWS state |

## Setup: enable per account from the delegated administrator

GuardDuty is managed centrally from the Organizations delegated administrator (a dedicated security account), and member accounts can't enable Runtime Monitoring themselves. So the delegated administrator's Terraform lists the target accounts and enables it for them.

I didn't use organization-wide auto-enable (`aws_guardduty_organization_configuration_feature`) because the sidecar shares the task's CPU and memory. Some accounts have tasks that hit their CPU limit during batch windows, and I wanted to **check the impact in stg before turning it on in prd**, one PR per account.

```hcl
resource "aws_guardduty_member_detector_feature" "runtime_monitoring" {
  for_each = toset([
    var.account_ids["workload-a-stg"],
    var.account_ids["workload-a-prd"],
  ])

  detector_id = aws_guardduty_detector.main["ap-northeast-1"].id
  account_id  = each.key
  name        = "RUNTIME_MONITORING"
  status      = "ENABLED"

  # NOTE: Not declaring only ECS, because the API also returns unspecified entries as DISABLED
  #       and the provider compares them as an ordered list, producing a diff every time. Declare all three in API order (EKS / ECS / EC2).
  additional_configuration {
    name   = "EKS_ADDON_MANAGEMENT"
    status = "DISABLED"
  }

  additional_configuration {
    name   = "ECS_FARGATE_AGENT_MANAGEMENT"
    status = "ENABLED"
  }

  additional_configuration {
    name   = "EC2_AGENT_MANAGEMENT"
    status = "DISABLED"
  }
}
```

At first I declared only `ECS_FARGATE_AGENT_MANAGEMENT`, and accounts that were already applied showed an in-place update in every plan. The provider fix PR ([#50445](https://github.com/hashicorp/terraform-provider-aws/pull/50445)) explicitly says that declaring only some of the entries, e.g. 1 of 3 under `RUNTIME_MONITORING`, still diffs and is out of scope. **Declaring all three is the workaround for now.**

Adding an account is a one-line change to `for_each`, and every time I checked that the plan showed exactly one `create`.

## Prerequisites: miss these and prd tasks won't start

The Fargate prerequisites are listed in [Prerequisites for AWS Fargate (Amazon ECS only) support](https://docs.aws.amazon.com/guardduty/latest/ug/prereq-runtime-monitoring-ecs-support.html). Here is what I actually checked.

| Aspect | What to check | Notes |
| --- | --- | --- |
| Platform | Fargate (Linux), platform version 1.4.0 or later | Windows isn't supported |
| Launch type | Fargate | Tasks on the EC2 launch type aren't covered by `ECS_FARGATE_AGENT_MANAGEMENT` |
| Task execution role | Can pull from the GuardDuty agent's ECR repository | **The one that bit me** |
| Network | Can reach ECR and S3 (image layers) | NAT Gateway, or ECR interface endpoints + an S3 gateway endpoint |
| Security groups | If egress is restricted, allow 443 to the S3 managed prefix list | |
| SCP / permissions boundary | Doesn't deny `guardduty:SendSecurityTelemetry` | |
| Agent connectivity | Set up by GuardDuty under automated management | See below |

### ECR permissions on the task execution role

The sidecar image lives in an ECR repository (`aws-guardduty-agent-fargate`) in an AWS-managed account, and **it is pulled with the task execution role's permissions**. With `AmazonECSTaskExecutionRolePolicy` attached it just works, since that policy uses `Resource: "*"`. But if the role restricts ECR pulls to your own repositories for security reasons, pulling the agent is denied.

That is exactly what happened right after enabling it in the prd of one workload account: task launches in the production deploy failed with this error.

```
CannotPullContainerError: ... aws-guardduty-agent-fargate:v1.17.3-Fg_x86_64: ... 403 Forbidden
```

- **Running tasks were not affected** (tasks started before enabling don't have the sidecar)
- But every task using that role **failed on deploy, run-task, scale-out and replacement of stopped tasks**
- stg happened to have this permission added earlier, so it didn't break there. **stg being fine did not mean prd was safe**

The fix is just adding the agent repository to the execution role's permissions.

```hcl
variable "guardduty_agent_ecr_repository_arn" {
  description = "ECR repository ARN of the GuardDuty agent for Fargate. See https://docs.aws.amazon.com/guardduty/latest/ug/ecs-runtime-agent-ecr-image-uri.html for per-Region values"
  type        = string
}

data "aws_iam_policy_document" "ecs_task_execution" {
  statement {
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
    ]
    resources = [
      aws_ecr_repository.app.arn,
      var.guardduty_agent_ecr_repository_arn,
    ]
  }
}
```

The fix PR I opened at the time was closed as a duplicate, because the same fix had been merged separately.

Also, [Deploying the security agent to Amazon ECS on Fargate](https://docs.aws.amazon.com/guardduty/latest/ug/how-runtime-monitoring-works-ecs-fargate.html) says:

> If the sidecar can't launch, Runtime Monitoring doesn't prevent the task from running.

[Runtime coverage and troubleshooting for Amazon ECS clusters](https://docs.aws.amazon.com/guardduty/latest/ug/gdu-assess-coverage-ecs.html) also covers the case where the sidecar image can't be pulled with `CannotPullContainerError`, and says "Your task will continue to run but GuardDuty can't detect potential threats."

In my case, though, the 403 caused by missing execution role permissions stopped the whole task from starting. I don't know why the docs and what I observed differ. At least in this setup **the pull failure did block task launch**, so rather than relying on the docs, it is safer to check the execution role's permissions beforehand.

Since then, I check the following read-only before enabling it.

```console
$ aws iam simulate-principal-policy \
    --policy-source-arn arn:aws:iam::<account-id>:role/<task-execution-role> \
    --action-names ecr:BatchGetImage ecr:GetDownloadUrlForLayer \
    --resource-arns <GuardDuty agent ECR repository ARN> \
    --query 'EvaluationResults[].[EvalActionName,EvalDecision]' --output text
```

- List not just ECS services but also **task definitions that use a different execution role**, such as release tasks or backup tasks
- Check whether a permissions boundary is attached
- Check whether egress goes through a NAT Gateway or VPC endpoints (and whether an endpoint policy restricts it)

### Agent connectivity (VPC endpoint / link-local)

One way the agent connects is through a GuardDuty-managed `com.amazonaws.<region>.guardduty-data` VPC endpoint, and its validation steps check that the endpoint's security group allows inbound 443 from the VPC CIDR ([Validating VPC endpoint configuration](https://docs.aws.amazon.com/guardduty/latest/ug/validate-vpc-endpoint-config-runtime-monitoring.html)). On the other hand, the current [How the security agent connects to GuardDuty](https://docs.aws.amazon.com/guardduty/latest/ug/runtime-monitoring-agent-connectivity.html) says that **new enablements connect over a link-local address** (agent v1.17.3 or later, supported Regions only).

- Under automated management, GuardDuty sets up either path, so there is nothing to prepare in Terraform
- A VPC that GuardDuty already set up with a `guardduty-data` endpoint keeps using it, and GuardDuty doesn't add link-local to it until you turn Runtime Monitoring off and on again
- You can tell which one is used by checking whether the subnet's route table has a `169.254.170.248/29` → `GuardDuty` route ([Troubleshooting agent connectivity](https://docs.aws.amazon.com/guardduty/latest/ug/runtime-monitoring-agent-connectivity-troubleshooting.html))
- If you filter egress on the host, allow the link-local ranges

I couldn't find an explicit statement in the official docs on whether the Tokyo Region supports link-local. I also haven't checked which path was set up in each account's VPCs.

### The sidecar is only attached to newly started tasks

Fargate tasks can't be changed after they start, so the sidecar is attached **only to tasks started after enabling**. Tasks that were already running before enabling stay `UNHEALTHY` (Agent not provisioned) in coverage, i.e. unmonitored, until they are redeployed. Plan the redeploy together with enabling.

For clusters without CPU headroom, adding the `GuardDutyManaged: false` tag to the cluster excludes it. But tasks started after the exclusion don't get the sidecar and aren't monitored (an agent that is already installed isn't uninstalled), so I see it as a design escape hatch to weigh against resource constraints.

## Rollout order

One account at a time, stg → prd, I repeated the following procedure.

| Step | Target | What to check |
| --- | --- | --- |
| 1 | stg / prd of the target workload | Before enabling, read-only check of the execution roles' ECR permissions, permissions boundaries and egress paths |
| 2 | stg | Plan shows exactly one create. After redeploy, coverage is HEALTHY, and resolving a test domain produces a Runtime finding that reaches the downstream notification |
| 3 | prd | Plan shows exactly one create. After redeploy, coverage is HEALTHY and deploys, batch jobs and other tasks start normally |

- The ECR 403 above happened in prd before step 1 existed; since then step 1 is mandatory
- One account = one PR, with "the plan diff is exactly one create for the target account" in the PR's test plan
- "Nothing happened" in stg isn't a verification, so I resolved the GuardDuty test domain ([guarddutyc2activityb.com](https://docs.aws.amazon.com/security-ir/latest/userguide/config-validation.html)) from inside a container via ECS Exec, deliberately triggering [`Backdoor:Runtime/C&CActivity.B!DNS`](https://docs.aws.amazon.com/guardduty/latest/ug/findings-runtime-monitoring.html), and confirmed the finding flowed all the way to notification

## How I estimated the cost

Runtime Monitoring for ECS Fargate is billed on **the vCPUs of monitored tasks, normalized per month** ([Amazon GuardDuty pricing](https://aws.amazon.com/guardduty/pricing/)). Tokyo Region prices from the AWS Price List API:

| vCPUs per month | Price (Tokyo) |
| --- | --- |
| First 500 vCPUs | $2.00 / vCPU |
| Next 4,500 vCPUs | $1.00 / vCPU |
| Over 5,000 vCPUs | $0.33 / vCPU |

vCPUs per month is the sum of "task vCPU × running hours ÷ hours in the month". For example, a cluster that always runs six 0.5 vCPU tasks is 0.5 × 6 = 3 vCPUs, roughly $6 per month. My estimation flow:

1. Compute "task definition vCPU × average task count" per ECS service (use the average for Auto Scaling, prorate batch jobs by run time)
2. Multiply by the prices above
3. Each feature has a **30-day free trial** per account and Region, so after enabling, check the projected cost during the trial in the GuardDuty console's usage (`get-usage-statistics`) before expanding to prd

Apart from the price, **the sidecar shares the task's CPU and memory**, which also belongs in the estimate. The agent's memory limit is fixed by task size, from 128 MB to 1 GB, so smaller tasks feel it relatively more (CPU and memory limits on the prerequisites page).

## Building the rollout table from the actual AWS state

As the number of accounts grows, you won't notice when the rollout table hand-written in an Issue drifts from reality. So I made a script that, read-only from the delegated administrator account, tabulates "are Runtime Monitoring and ECS Fargate agent management enabled" and "are the ECS clusters HEALTHY in coverage".

Below is a minimal, generalized version of our internal one.

```bash
#!/usr/bin/env bash
set -euo pipefail

# Run with the delegated administrator account's credentials
# usage: ./runtime-monitoring-status.sh stg=111111111111 prd=222222222222
REGION=${REGION:-ap-northeast-1}

[[ $# -gt 0 ]] || { echo "usage: $0 <label>=<account-id> ..." >&2; exit 1; }
for cmd in aws jq; do
  command -v "$cmd" >/dev/null || { echo "$cmd not found" >&2; exit 1; }
done
for arg in "$@"; do
  [[ ${arg#*=} =~ ^[0-9]{12}$ ]] || { echo "invalid account ID: $arg" >&2; exit 1; }
done

detector=$(aws guardduty list-detectors --region "$REGION" --output json |
  jq -er '.DetectorIds | if length == 1 then .[0] else error("expected exactly 1 detector, got \(length)") end')

echo "| Account | Runtime Monitoring | ECS Fargate agent management | HEALTHY | UNHEALTHY |"
echo "|---|---|---|---|---|"

for arg in "$@"; do
  label=${arg%%=*}
  account_id=${arg#*=}

  member=$(aws guardduty get-member-detectors --region "$REGION" \
    --detector-id "$detector" --account-ids "$account_id" --output json)
  features=$(jq -er '
    if (.UnprocessedAccounts | length) > 0 then error("unprocessed accounts: \(.UnprocessedAccounts)") else . end
    | ([.MemberDataSourceConfigurations[0].Features[]? | select(.Name == "RUNTIME_MONITORING")][0]
       // error("RUNTIME_MONITORING missing from response"))
    | [.Status, ([.AdditionalConfiguration[]? | select(.Name == "ECS_FARGATE_AGENT_MANAGEMENT")][0].Status // "-")]
    | @tsv' <<<"$member")
  IFS=$'\t' read -r runtime ecs <<<"$features"

  filter=$(jq -nc --arg a "$account_id" '{FilterCriterion: [
    {CriterionKey: "ACCOUNT_ID", FilterCondition: {Equals: [$a]}},
    {CriterionKey: "RESOURCE_TYPE", FilterCondition: {Equals: ["ECS"]}}]}')
  coverage=$(aws guardduty get-coverage-statistics --region "$REGION" --detector-id "$detector" \
    --statistics-type COUNT_BY_COVERAGE_STATUS --filter-criteria "$filter" --output json)
  counts=$(jq -er '(.CoverageStatistics.CountByCoverageStatus // {}) | [.HEALTHY // 0, .UNHEALTHY // 0] | @tsv' <<<"$coverage")
  IFS=$'\t' read -r healthy unhealthy <<<"$counts"

  printf '| %s | %s | %s | %s | %s |\n' "$label" "$runtime" "$ecs" "$healthy" "$unhealthy"
done
```

Example output (dummy values):

```
| Account | Runtime Monitoring | ECS Fargate agent management | HEALTHY | UNHEALTHY |
|---|---|---|---|---|
| stg | ENABLED | ENABLED | 3 | 0 |
| prd | ENABLED | ENABLED | 2 | 1 |
```

The main design rule was: **stop rather than print a wrong table**.

- AWS CLI failures, non-member accounts (`UnprocessedAccounts`), and unexpected response shapes (no `RUNTIME_MONITORING`, multiple detectors) all exit non-zero
- Each `aws ... | jq` is called once inside its own `$(...)` and assigned to a variable. If you bundle several `aws` calls into one `$(...)` with a loop or pipe, a failure in the middle isn't caught by `set -e`, and the incomplete result ends up in the table
- The internal version also puts downstream pieces in the same table, such as whether the EventBridge rule that notifies on findings is enabled

I verified the minimal version above with shellcheck and with the AWS CLI replaced by a stub, covering the normal case and failure cases (non-member account, CLI failure, invalid arguments). Please note I haven't run this exact minimal version against real accounts.

## Terraform: RDS_DATA_RISK causes rds_protection to be replaced on every plan

When I opened the Runtime Monitoring PR, the plan showed the unrelated `rds_protection` being replaced in every Region.

```hcl
resource "aws_guardduty_organization_configuration_feature" "rds_protection" {
  for_each    = toset(data.aws_regions.current.names)
  region      = each.key
  detector_id = aws_guardduty_detector.main[each.key].id
  name        = "RDS_LOGIN_EVENTS"
  auto_enable = "ALL"
}
```

```
  # aws_guardduty_organization_configuration_feature.rds_protection["ap-northeast-1"] must be replaced
      - additional_configuration { # forces replacement
          - auto_enable = "NONE" -> null
          - name        = "RDS_DATA_RISK" -> null # forces replacement
        }
```

The cause:

- On October 8, 2026, [RDS Protection for data activity](https://aws.amazon.com/about-aws/whats-new/2026/10/guardduty-rds-data-exfiltration/) was released, and the API started returning `RDS_DATA_RISK` under `additional_configuration` of `RDS_LOGIN_EVENTS`
- The provider at the time (v6.66.0) didn't know `RDS_DATA_RISK` as an enum value, so **writing it in HCL failed validation**, and I couldn't declare it to clear the diff
- `additional_configuration` on `aws_guardduty_organization_configuration_feature` is `ForceNew`, so the diff was a **replace**, not an in-place update
- Upstream issue: [hashicorp/terraform-provider-aws#50461](https://github.com/hashicorp/terraform-provider-aws/issues/50461)

A replace means deleting and recreating the organization feature setting, so it must not be applied. The noise also showed up in every other PR's plan, so I suppressed it with `ignore_changes` until the provider caught up.

```hcl
resource "aws_guardduty_organization_configuration_feature" "rds_protection" {
  # ...

  # NOTE: AWS now returns RDS_DATA_RISK in additional_configuration, but the provider doesn't support it yet,
  #       so it can't be written in HCL and shows up as a replace every time. Ignore it for now.
  #       Remove ignore_changes and manage RDS_DATA_RISK explicitly once the provider supports it.
  #       https://github.com/hashicorp/terraform-provider-aws/issues/50461
  lifecycle {
    ignore_changes = [additional_configuration]
  }
}
```

Later, [#50445](https://github.com/hashicorp/terraform-provider-aws/pull/50445) shipped in **v6.70.0**: `RDS_DATA_RISK` became a valid value, and the drift when `additional_configuration` is omitted was fixed ([CHANGELOG](https://github.com/hashicorp/terraform-provider-aws/releases/tag/v6.70.0)). After upgrading to v6.70.0, I removed `ignore_changes` and now manage `RDS_DATA_RISK` explicitly in HCL. Data activity monitoring costs more per vCPU than login monitoring, so the design lets us scope it per account based on cost.

```hcl
resource "aws_guardduty_organization_configuration_feature" "rds_protection" {
  for_each    = toset(data.aws_regions.current.names)
  region      = each.key
  detector_id = aws_guardduty_detector.main[each.key].id
  name        = "RDS_LOGIN_EVENTS"
  auto_enable = "ALL"

  # NOTE: Not ALL, because data activity monitoring costs more per vCPU than login monitoring,
  #       and aws_guardduty_member_detector_feature lets us decide per account.
  additional_configuration {
    name        = "RDS_DATA_RISK"
    auto_enable = "NONE"
  }
}
```

`ignore_changes` tends to stay forever unless you write down when to remove it, so leaving the upstream issue and the removal condition in the comment paid off.

## Bonus: S3 Protection and Malware Protection for S3

Around the same time, I also added S3 protection, designed so the scope can be narrowed based on cost.

| Feature | What it watches | Where it is enabled | Price (Tokyo) | How it is scoped |
| --- | --- | --- | --- | --- |
| S3 Protection (`S3_DATA_EVENTS`) | CloudTrail S3 data events (GetObject from suspicious sources, bulk downloads, etc.) | Delegated administrator (`aws_guardduty_member_detector_feature`) | $1.04 per million events for the first 500 million events/month | Target accounts can be selected |
| Malware Protection for S3 | Malware scan of newly uploaded objects | **Each account that owns the bucket** (`aws_guardduty_malware_protection_plan`) | $0.282 per 1,000 requests, $0.1185 per GB scanned (first 1,000 requests and 1 GB per month free) | Target buckets can be selected |

- The S3 Protection feature has no setting to target buckets (no `additional_configuration` in the API either), and **all S3 data events in the account are billed**, so instead of organization-wide auto-enable, the design lists target accounts on the delegated administrator side. I estimated it by multiplying the account's S3 request count (Tier1 + Tier2) by the price
- For Malware Protection for S3, the [docs](https://docs.aws.amazon.com/guardduty/latest/ug/gdu-malware-protection-s3.html) explicitly say the delegated administrator can't enable it on buckets owned by member accounts, so the design has each workload account's Terraform list the target buckets with `for_each`. The estimate is just "uploads per month" and "upload volume per month" times the price, and it often fits in the free tier

```hcl
locals {
  malware_protection_buckets = {
    uploads = aws_s3_bucket.uploads
    inbound = aws_s3_bucket.inbound
  }
}

resource "aws_guardduty_malware_protection_plan" "s3" {
  for_each = local.malware_protection_buckets

  role = aws_iam_role.guardduty_malware_protection_s3.arn

  protected_resource {
    s3_bucket {
      bucket_name = each.value.id
    }
  }

  actions {
    tagging {
      status = "ENABLED"
    }
  }
}
```

When turning an existing single resource into `for_each`, add a `moved` block from `aws_guardduty_malware_protection_plan.s3` to `aws_guardduty_malware_protection_plan.s3["uploads"]` so it isn't recreated.

## Summary

- Enabling Runtime Monitoring (ECS Fargate) from the delegated administrator with `aws_guardduty_member_detector_feature` and a list of accounts lets you roll out stg → prd one PR at a time
- The biggest pitfall is **ECR permissions on the task execution role**. If they're limited to your own repositories, the agent pull fails with 403 and new tasks can't start. Even if stg is fine, check the prd roles separately beforehand
- Declare all three `additional_configuration` entries (EKS / ECS / EC2) in API order
- The `rds_protection` replace drift caused by `RDS_DATA_RISK` is fixed in v6.70.0. Before that, suppress it with `ignore_changes` and leave the removal condition in a comment
- Cost can be estimated from "task vCPU × running hours". Separately, account for the sidecar sharing task resources
- Build the rollout status from the actual AWS state, not a hand-written table, and make the script stop rather than print wrong results

I hope this helps.

## References

- [Prerequisites for AWS Fargate (Amazon ECS only) support](https://docs.aws.amazon.com/guardduty/latest/ug/prereq-runtime-monitoring-ecs-support.html)
- [Deploying the security agent to Amazon ECS on Fargate](https://docs.aws.amazon.com/guardduty/latest/ug/how-runtime-monitoring-works-ecs-fargate.html)
- [Amazon ECR repository hosting GuardDuty agent](https://docs.aws.amazon.com/guardduty/latest/ug/runtime-monitoring-ecr-repository-gdu-agent.html)
- [How the security agent connects to GuardDuty](https://docs.aws.amazon.com/guardduty/latest/ug/runtime-monitoring-agent-connectivity.html)
- [Troubleshooting agent connectivity](https://docs.aws.amazon.com/guardduty/latest/ug/runtime-monitoring-agent-connectivity-troubleshooting.html)
- [Validating VPC endpoint configuration](https://docs.aws.amazon.com/guardduty/latest/ug/validate-vpc-endpoint-config-runtime-monitoring.html)
- [Runtime coverage and troubleshooting for Amazon ECS clusters](https://docs.aws.amazon.com/guardduty/latest/ug/gdu-assess-coverage-ecs.html)
- [GuardDuty Runtime Monitoring finding types](https://docs.aws.amazon.com/guardduty/latest/ug/findings-runtime-monitoring.html)
- [GetMemberDetectors](https://docs.aws.amazon.com/guardduty/latest/APIReference/API_GetMemberDetectors.html) / [GetCoverageStatistics](https://docs.aws.amazon.com/guardduty/latest/APIReference/API_GetCoverageStatistics.html)
- [GuardDuty Malware Protection for S3](https://docs.aws.amazon.com/guardduty/latest/ug/gdu-malware-protection-s3.html)
- [Amazon GuardDuty pricing](https://aws.amazon.com/guardduty/pricing/)
- [Amazon GuardDuty RDS Protection for data activity (What's New)](https://aws.amazon.com/about-aws/whats-new/2026/10/guardduty-rds-data-exfiltration/)
- [hashicorp/terraform-provider-aws#50461](https://github.com/hashicorp/terraform-provider-aws/issues/50461)
- [hashicorp/terraform-provider-aws#50445](https://github.com/hashicorp/terraform-provider-aws/pull/50445)
- [terraform-provider-aws v6.70.0](https://github.com/hashicorp/terraform-provider-aws/releases/tag/v6.70.0)
