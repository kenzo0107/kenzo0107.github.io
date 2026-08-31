---
title: 'Replacing NAT Gateway with fck-nat: 90% Cost Cut, and Almost Getting Stuck with a Tainted ASG'
date: 2026-08-31
lang: en
translation_id: nat-gateway-to-fck-nat
permalink: en/2026/08/31/nat-gateway-to-fck-nat/
cover: /img/cover/2026-08-31-nat-gateway-to-fck-nat.svg
categories:
- [AWS]
- [Terraform]
tags:
- AWS
- NAT Gateway
- fck-nat
- Terraform
- EC2
- Cost Optimization
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

I replaced the NAT Gateway in a small internal data-analysis environment (built on AppStream 2.0) with [fck-nat](https://fck-nat.dev/) (a NAT instance), cutting the NAT cost from **about $45/month to about $4/month**.
The replacement itself is just swapping in a Terraform module, but a failed apply left the ASG **tainted**, and the replacement of a fixed-name resource kept colliding on the name. This post covers both the migration and how I recovered from that.

<!-- more -->

## Background

- Outbound traffic from private subnets went through a NAT Gateway
- The environment needs a **fixed egress IP** registered in a SaaS IP access list, so going NAT-less was not an option
- It is a small, internal-only environment with light usage, yet a NAT Gateway charges **hourly even when idle** ($0.062/hour in Tokyo ≈ about $45/month per environment)

Before deciding, I checked 24 days of actual CloudWatch metrics on the NAT Gateway.

| Metric | Observed value |
| --- | --- |
| Total transfer over the period | 3.81 GB (~5 GB/month) |
| Busiest single day | 1.7 GB |
| Peak throughput (5-min average) | 17.5 Mbps |
| Max concurrent connections | 85 |

Bulk S3 access bypasses NAT via a gateway VPC endpoint, so only API calls and Windows Update actually go through NAT.
At this scale, a **t4g.nano** (baseline bandwidth ~32 Mbps, burst up to 5 Gbps) is plenty — the observed peak is about 55% of the baseline bandwidth.

## What is fck-nat?

[fck-nat](https://github.com/AndrewGuenther/fck-nat) is an OSS project providing an AMI and Terraform/CDK modules for NAT instances. A rough comparison with NAT Gateway:

| Aspect | NAT Gateway | fck-nat (t4g.nano) |
| --- | --- | --- |
| Monthly cost (Tokyo) | ~$45 + $0.062/GB | ~$4 |
| Availability | Managed, redundant | Auto-replacement via ASG (a few minutes of downtime) |
| Bandwidth | Up to 100 Gbps | Depends on instance type (~32 Mbps to 5 Gbps burst on t4g.nano) |
| Operations | None | A self-managed instance with an OS |

On failure, ASG auto-replacement causes a few minutes of NAT downtime, which is acceptable for internal use. If usage grows, bumping to t4g.small (128 Mbps guaranteed, ~$12/month) is all it takes.

## Terraform Implementation

I used [RaJiska/fck-nat/aws](https://registry.terraform.io/modules/RaJiska/fck-nat/aws/latest) v1.6.1.
The key point is to **allocate the EIP outside the module and pass it in**. Even when the ASG replaces the instance, the egress IP stays the same, so the SaaS IP access list never needs touching.

```hcl
# Allocate the EIP outside the module so the egress IP survives instance replacement
resource "aws_eip" "nat_instance" {
  domain = "vpc"
}

module "fck_nat" {
  source  = "RaJiska/fck-nat/aws"
  version = "1.6.1"

  name      = "fck-nat"
  vpc_id    = module.vpc.vpc_id
  subnet_id = module.vpc.public_subnets[0]

  instance_type      = "t4g.nano"
  ha_mode            = true                      # auto-replacement via ASG
  eip_allocation_ids = [aws_eip.nat_instance.id] # keep the same egress IP after replacement

  update_route_tables = true
  route_tables_ids = {
    for i, rt in module.vpc.private_route_table_ids : "private-${i}" => rt
  }
}
```

For migrating from an existing NAT Gateway, I set `enable_nat_gateway = false` on the VPC module (terraform-aws-modules/vpc/aws) and **carried over the NAT Gateway's EIP with a `moved` block**, avoiding destroy/recreate of the egress IP.

```hcl
# Move the EIP that module.vpc created for the old NAT Gateway to a standalone resource.
# This avoids destroying/recreating the egress IP already registered in the IP access list.
moved {
  from = module.vpc.aws_eip.nat[0]
  to   = aws_eip.nat_instance
}
```

A few more details worth noting:

- Resources that must wait for private route tables to be configured (the AppStream fleet in my case) need an explicit `depends_on = [module.fck_nat]` — the dependency is not expressed in the graph
- When swapping routes, deletion of the old route and creation of the new one have no ordering guarantee, so you may hit `RouteAlreadyExists` (a re-apply resolves it)
- The cutover causes a few minutes of NAT downtime, so apply during off-hours

## Almost Getting Stuck with a Tainted ASG

Here comes the fun part. During the rollout to staging, the apply failed while waiting for the ASG creation to complete. The ASG actually existed in AWS with a running instance, but Terraform state recorded it as **tainted** (creation failed). Terraform marks an object tainted when it infers the object is in a degraded or partially created state, and replaces tainted objects on the next plan/apply ([Terraform: Recover infrastructure with tainted objects](https://developer.hashicorp.com/terraform/cli/state/taint)).

### Trap 1: "Re-run failed jobs" in CI re-applies a stale plan

With a GitHub Actions + tfcmt setup, re-running the failed apply job via "Re-run failed jobs" **re-applies the saved tfplan — which still says "create the ASG"** — so it collided with the existing ASG and failed with `AlreadyExists`.
Never re-apply a create plan after the resource has been created. Recovery must go through a run that generates a fresh plan (workflow_dispatch).

### Trap 2: replacing a tainted fixed-name resource always collides

Suspecting the ASG was missing from state, I opened a PR with an import block:

```hcl
import {
  to = module.fck_nat.aws_autoscaling_group.main[0]
  id = "fck-nat"
}
```

The apply failed again with `AlreadyExists`. Checking the logs revealed that **replacement of a tainted resource runs create-before-destroy (`+/-` in the plan)**, so an ASG with a fixed `name` is guaranteed to collide with itself — I confirmed the apply log never showed a Destroy.

### The fix: manual delete, then a plain create

I changed course and recovered with these steps:

1. Manually delete the ASG in AWS (`aws autoscaling delete-auto-scaling-group --force-delete`). fck-nat's ENI and EIP are separate resources, so they were unaffected
2. **Remove the import block** (an import whose target no longer exists fails the plan itself, so this is mandatory once you switch to the manual-delete approach)
3. Let the plan's refresh discard the tainted state entry, and apply as a plain create — success

In production, an apply also failed once due to a transient IAM instance profile propagation delay. That time the plan said `is tainted, so must be replaced`, which taught me that **a failed apply does not mean the resource is missing from state** — it is usually recorded as tainted and an import is a no-op. Check the plan output first.

Since fck-nat keeps the NAT's actual data path (static ENI and EIP) separate from the ASG, the egress IP never changed no matter how many times I destroyed and recreated the ASG. The external side (the IP access list) was never affected; the only impact was 3–5 minutes of NAT downtime per instance swap.

## Summary

- Replacing a NAT Gateway with fck-nat (t4g.nano) in a small environment cut costs from **~$45/month to ~$4/month** (~$82/month across stg + prd)
- Base the decision on actual CloudWatch metrics (transfer volume, throughput, concurrent connections)
- Allocate the EIP outside the module, and carry over the NAT Gateway's EIP with `moved` to migrate without changing the egress IP
- When an apply fails, start from a fresh plan — never "Re-run failed jobs"
- A tainted fixed-name resource collides on create-before-destroy; "manual delete → refresh discards the tainted entry → plain create" was the shortest path, not import

I hope this helps.

## References

- [fck-nat documentation](https://fck-nat.dev/)
- [AndrewGuenther/fck-nat](https://github.com/AndrewGuenther/fck-nat)
- [RaJiska/terraform-aws-fck-nat](https://github.com/RaJiska/terraform-aws-fck-nat)
- [AWS: NAT Gateway pricing](https://aws.amazon.com/vpc/pricing/)
- [Terraform: Recover infrastructure with tainted objects](https://developer.hashicorp.com/terraform/cli/state/taint)
