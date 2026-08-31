---
title: Blocking Creation of Unused Google Cloud Services Org-Wide with IAM Deny Policies
date: 2026-08-26
lang: en
translation_id: gcp-iam-deny-policy-guardrails
permalink: en/2026/08/26/gcp-iam-deny-policy-guardrails/
cover: /img/cover/2026-08-26-gcp-iam-deny-policy-guardrails.svg
categories:
- [Google Cloud]
- [Security]
tags:
- Google Cloud
- IAM
- Organization Policy
- Security
- Terraform
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

I blocked the creation of unused Google Cloud services (Compute Engine VMs, GKE, Cloud SQL, AlloyDB, and more) **organization-wide with IAM Deny Policies**.

Running primarily on AWS and using Google Cloud only for a limited set of purposes — data analytics, a few managed services — rather than as your whole platform is a common setup. The catch is that every service you have no intention of using still sits there in a "someone could create this" state. A service nobody runs is still attack surface as long as its API is enabled and the permission to create it exists, and it leaves room for rogue VMs (cryptomining, pivoting) if credentials ever leak.

Blocking creation outright is more reliable than finding and deleting things after the fact. This post covers how I choose between Organization Policy and IAM Deny Policy, how I proved zero impact without a dry-run, and the unsupported-permission traps.

<!-- more -->

## Organization Policy vs. IAM Deny Policy

There are several guardrail mechanisms, and I use them like this:

| Mechanism | When to use | Dry-run |
| --- | --- | --- |
| Org Policy (managed constraint) | First choice when a matching built-in constraint exists | `dry_run_spec` supported |
| Org Policy (legacy constraint) | Boolean constraints with limited blast radius | **Not supported** (setting it fails the apply) |
| Org Policy (custom constraint / CEL) | When built-in constraints don't fit | Supported |
| **IAM Deny Policy** | Pinpoint-blocking **specific permissions** only | **No such feature** |

I chose an IAM Deny Policy for blocking VM creation because no managed constraint can target "VM creation only", and blocking the compute API entirely with `gcp.restrictServiceUsage` **risked breaking live VPC networking** — the Subnetworks, Firewalls, and Routes that Cloud Run VPC connectors and Cloud SQL Private IP depend on.

## No Dry-Run, So I Proved Zero Impact Three Independent Ways

IAM Deny Policies have no dry-run, and this one takes effect across every project under the organization at once. Before applying, I verified with three methods:

1. **Org-wide Cloud Asset Inventory search**: confirmed zero Instances / InstanceTemplates / InstanceGroupManagers etc. across all projects — including a **sanity check with asset types guaranteed to exist** (Buckets, Projects) to prove "zero results" didn't mean "the search wasn't working"
2. **Direct listing against projects with the Compute API enabled**: ran `gcloud compute instances list` directly, independent of any CAI cache
3. **Full audit-log review**: confirmed zero creation events like `compute.instances.insert` in two months of org-wide Admin Activity logs — positioned as **the substitute for dry-run**

```hcl
resource "google_iam_deny_policy" "deny_unused_services" {
  parent = urlencode("cloudresourcemanager.googleapis.com/organizations/${local.org_id}")
  name   = "deny-unused-gcp-services"

  rules {
    deny_rule {
      denied_principals = ["principalSet://goog/public:all"] # all principals
      denied_permissions = [
        "vmwareengine.googleapis.com/privateClouds.create",
        "gkehub.googleapis.com/memberships.create",
        "gkeonprem.googleapis.com/bareMetalAdminClusters.create",
        "gkeonprem.googleapis.com/bareMetalClusters.create",
        "gkeonprem.googleapis.com/vmwareClusters.create",
        "alloydb.googleapis.com/clusters.create",
        "alloydb.googleapis.com/instances.create",
        "container.googleapis.com/clusters.create",
        "dataproc.googleapis.com/clusters.create",
        "file.googleapis.com/instances.create",
        "redis.googleapis.com/instances.create",
        # For Cloud SQL, the FQDN in deny policies is cloudsql, not sqladmin
        "cloudsql.googleapis.com/instances.create",
      ]
    }
  }
}
```

Terraform details: `parent` requires `urlencode()`. Managing deny policies requires `roles/iam.denyAdmin` — **`roles/resourcemanager.organizationAdmin` does not include `iam.denypolicies.*`**, so the CI service account needed the extra grant.

## Traps

### An unsupported permission fails the apply with a 400

IAM Deny Policies **cannot deny every IAM permission** — only those listed in the official [Permissions supported in deny policies](https://cloud.google.com/iam/docs/deny-permissions-support). Including the regional MIG permission actually failed:

```
Error: Error creating DenyPolicy: googleapi: Error 400: The following permissions
are not valid on this resource type:
compute.googleapis.com/regionInstanceGroupManagers.create.
```

`regionInstanceGroupManagers` has no supported verb at all, with no substitute. Since `instanceTemplates.create` is denied, creating a regional MIG that needs a new template is effectively blocked anyway — so I removed the permission with that reasoning documented.
After this, every permission in later PRs was **checked against the supported list before apply**. Permission names have their own trap: Cloud SQL's service FQDN in deny policies is `cloudsql.googleapis.com`, not the API name `sqladmin.googleapis.com`.

### "Zero usage" alone is not sufficient grounds to block

The exclusion decisions were just as instructive:

- **Cloud Spanner / Cloud Bigtable**: some managed services **auto-provision another service as their backend** the moment you enable or register the feature. During the investigation I found resources that had been created exactly that way. This kind of indirect provisioning never shows up as "something we created", so denying it risks **breaking later at the managed service's discretion** — both were excluded from the deny list
- **Cloud TPU / Bare Metal Solution**: no permissions in the supported list at all, technically impossible to deny

In other words, zero results across CAI, audit logs, and Terraform code only proves that nobody created the service *explicitly*. A separate criterion is needed: **don't deny a service that a managed service might provision on your behalf**, even at zero observed usage.

## The Staged Rollout Pattern (Org Policy Side)

For managed constraints that do support dry-run, we template the rollout like this — currently practicing it with service account key creation (`iam.managed.disableServiceAccountKeyCreation`):

1. Introduce with `dry_run_spec` only, enforce=TRUE (audit mode)
2. Observe dry-run violations recorded in Cloud Audit Logs for a while (with Slack notifications)
3. Identify projects that permanently need key creation — from real logs and from the Terraform code of connected repositories — and **lay down exceptions first**
4. Promote the live spec to enforce

Exception projects get **both the live spec and the dry_run_spec** excepted. If dry-run violation alerts keep firing for known, accepted operations, alert fatigue makes you miss the real ones.

```hcl
resource "google_org_policy_policy" "disable_sa_key_creation_exception" {
  for_each = toset(local.sa_key_exception_projects)

  name   = "projects/${each.value}/policies/iam.managed.disableServiceAccountKeyCreation"
  parent = "projects/${each.value}"

  spec {
    inherit_from_parent = false
    rules { enforce = "FALSE" }
  }

  dry_run_spec {
    inherit_from_parent = false
    rules { enforce = "FALSE" }
  }
}
```

There were two kinds of grounds for exceptions: projects confirmed as key creators in the last 30 days of real logs, and projects with **no creation events in the audit logs but whose connected Terraform code contains `google_service_account_key` resources** that would recreate keys on rotation or state rebuilds. Third-party SaaS data connectors that don't support Workload Identity Federation and require a static key are a common pattern here, and judging such a project by "no recent creation events" alone means it breaks once you promote to enforce. You have to check the code that issues the key, not just the audit logs.

For the broader story of detecting and preventing stale service account keys, see my earlier post [Keeping Google Cloud Service Account Keys From Going Stale](/2026/07/09/2026-07-10-gcp-service-account-key-hygiene-en/).

## Summary

- To block creation of unused services, reach for IAM Deny Policies with pinpoint permissions when no built-in Org Policy constraint fits
- Deny policies have no dry-run — prove zero impact with CAI org-wide search (with sanity checks), direct listing, and a full audit-log review before applying
- Only permissions on the supported list can be denied, and some FQDNs differ from API names (Cloud SQL) — cross-check everything beforehand
- Even with zero usage, don't deny services that managed services provision indirectly (Spanner / Bigtable)
- For dry-run-capable Org Policies, template the rollout: audit mode → observe → exceptions first → enforce

I hope this helps.

## References

- [IAM Deny Policies](https://cloud.google.com/iam/docs/deny-access)
- [Permissions supported in deny policies](https://cloud.google.com/iam/docs/deny-permissions-support)
- [Organization Policy: constraints supporting dry-run](https://docs.cloud.google.com/organization-policy/test-policies)
- [google_iam_deny_policy](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/iam_deny_policy)
