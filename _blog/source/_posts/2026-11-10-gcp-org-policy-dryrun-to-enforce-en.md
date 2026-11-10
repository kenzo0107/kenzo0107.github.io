---
title: 'Rolling Out Google Cloud Organization Policies from Dry-Run to Enforce: Process and Pitfalls'
date: 2026-11-10
lang: en
translation_id: gcp-org-policy-dryrun-to-enforce
permalink: en/2026/11/10/gcp-org-policy-dryrun-to-enforce/
cover: /img/cover/2026-11-10-gcp-org-policy-dryrun-to-enforce.svg
categories:
- [Google Cloud]
- [Security]
- [Terraform]
tags:
- Google Cloud
- Organization Policy
- Cloud Audit Logs
- Cloud Storage
- Cloud Run
- Security Command Center
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

As part of our security work, I rolled out Google Cloud Organization Policies across the whole organization. Constraints that support dry-run (audit mode) went in as dry-run first, I watched the violations, and promoted them to enforce once I was confident nothing would break. For constraints without dry-run support, I took inventory and set up exceptions first, then enforced them directly.

This post covers that process, how I send denials to Slack, and the pitfalls I actually hit: enforcing `gcp.resourceLocations` deactivated SCC Standard automatically, and I had to deal with auto-created buckets before enforcing UBLA.

※ This post reflects the state as of **November 10, 2026**.

<!-- more -->

## Conclusion

| Item | Details |
| --- | --- |
| Constraints that support dry-run | Custom constraints, managed constraints (`*.managed.*`), and only a few legacy constraints |
| Process for dry-run-capable constraints | Add with live spec `enforce = FALSE` and `dry_run_spec` `enforce = TRUE` → watch violations → set up exceptions first → replace `dry_run_spec` with `spec` to promote |
| Process for constraints without dry-run | Org-wide inventory with Cloud Asset Inventory (CAI) → create overrides for the projects that need them → enforce directly |
| Evidence for promotion | Dry-run violation logs, a full scan of the audit log archive, CAI inventory, positive controls (probes that violate on purpose) |
| Denial notifications | Denial logs are structured differently by constraint type. Catch them with three filters and extract the constraint name in the function |
| Pitfall 1 | Enforcing `gcp.resourceLocations` can deactivate an automatically activated SCC Standard tier |
| Pitfall 2 | Before enforcing `storage.uniformBucketLevelAccess`, handle the UBLA-disabled buckets auto-created by App Engine / Cloud Build / Vertex AI |

## Constraints in scope

I mostly picked constraints from Google's [secure-by-default](https://docs.cloud.google.com/resource-manager/docs/secure-by-default-organizations) baseline (enforced by default on organizations created on or after May 3, 2024) that weren't applied in our older organization.

| Constraint | Type | Dry-run | Rollout |
| --- | --- | --- | --- |
| `iam.managed.disableServiceAccountKeyCreation` (block SA key creation) | managed | Yes | dry-run → enforce |
| `iam.managed.disableServiceAccountKeyUpload` (block SA key upload) | managed | Yes | dry-run → enforce |
| `iam.managed.preventPrivilegedBasicRolesForDefaultServiceAccounts` (block basic roles on default SAs) | managed | Yes | dry-run → enforce |
| `compute.managed.restrictProtocolForwardingCreationForTypes` (restrict protocol forwarding) | managed (with parameters) | Yes | dry-run → enforce |
| `run.managed.requireInvokerIam` (block disabling the Cloud Run invoker IAM check) | managed | Yes | dry-run → enforce |
| Domain restricted sharing (custom constraint) | custom | Yes | dry-run → enforce |
| `essentialcontacts.managed.allowedContactDomains` (restrict Essential Contacts domains) | managed (with parameters) | Yes | Enforced directly since the inventory found 0 targets |
| `gcp.resourceLocations` (Japan + global only) | legacy list | No | inventory → exceptions → enforce directly |
| `run.allowedIngress` (block ingress=all) | legacy list | No | inventory → enforce directly |
| `storage.uniformBucketLevelAccess` (require UBLA) | legacy boolean | No | handle auto-created buckets → enforce directly |

The Limitations section of [Test organization policies](https://docs.cloud.google.com/organization-policy/test-policies) states clearly that dry-run is only available for custom constraints, managed constraints, and certain legacy managed constraints (Restrict service usage / Restrict endpoint usage / Restrict TLS versions / Restrict TLS cipher suites). Creating a dry-run policy with any other constraint results in an error. Legacy constraints like `gcp.resourceLocations` and `storage.uniformBucketLevelAccess` can't be dry-run, so they needed a different approach.

Also, the built-in domain restricted sharing constraint `iam.allowedPolicyMemberDomains` is a legacy list constraint and can't be dry-run ([Restricting identities by domain](https://docs.cloud.google.com/organization-policy/restrict-domains)). Its managed counterpart `iam.managed.allowedPolicyMembers` does support dry-run, but this time I **rewrote it as a custom constraint, which supports dry-run**.

## Dry-run-capable constraints: audit mode → observe → promote

### Add in audit mode

Set the live `spec` to `enforce = "FALSE"` (a no-op) and only the `dry_run_spec` to `enforce = "TRUE"`.

```hcl
resource "google_org_policy_policy" "disable_sa_key_upload" {
  name   = "organizations/${var.org_id}/policies/iam.managed.disableServiceAccountKeyUpload"
  parent = "organizations/${var.org_id}"

  spec {
    rules {
      enforce = "FALSE"
    }
  }

  dry_run_spec {
    inherit_from_parent = false

    rules {
      enforce = "TRUE"
    }
  }
}
```

When I wrote only `dry_run_spec` and omitted `spec`, the API rejected it with `DryRun feature is not available for the resource`, so I keep a no-op live spec alongside it (I couldn't find this behavior documented officially).

Managed constraints with parameters take their values through `parameters`, not `values`. Here's an example that restricts protocol forwarding to `INTERNAL`.

```hcl
resource "google_org_policy_policy" "restrict_protocol_forwarding" {
  name   = "organizations/${var.org_id}/policies/compute.managed.restrictProtocolForwardingCreationForTypes"
  parent = "organizations/${var.org_id}"

  spec {
    rules {
      enforce = "FALSE"
    }
  }

  dry_run_spec {
    inherit_from_parent = false

    rules {
      enforce = "TRUE"
      parameters = jsonencode({
        allowedSchemes = ["INTERNAL"]
      })
    }
  }
}
```

The Essential Contacts domain restriction uses the same shape (`allowedDomains = ["@example.com"]`). CAI showed zero Contacts across the organization, so I enforced this one directly without audit mode.

The domain restricted sharing custom constraint uses nearly the same CEL as the "Only allow organization members to be granted roles" use-case example in the [official docs](https://docs.cloud.google.com/iam/docs/org-policy-custom-constraints).

```hcl
resource "google_org_policy_custom_constraint" "domain_restricted_sharing" {
  name         = "custom.domainRestrictedSharing"
  parent       = "organizations/${var.org_id}"
  display_name = "Domain restricted sharing"
  description  = "Only allow IAM grants to principals in the organization"

  action_type    = "ALLOW"
  method_types   = ["CREATE", "UPDATE"]
  resource_types = ["iam.googleapis.com/AllowPolicy"]
  condition      = <<-EOT
    resource.bindings.all(binding,
      binding.members.all(member,
        MemberInPrincipalSet(member, ['//cloudresourcemanager.googleapis.com/organizations/${var.org_id}'])
      )
    )
  EOT
}
```

The official docs say the organization principal set includes Workspace identities, the organization's workforce identity pools, all service accounts and workload identity pools in the organization, and service agents tied to resources in the organization, so grants to WIF and service agents aren't denied. Note that a custom constraint's `name` can't be changed later (changing it recreates the constraint), so pick the first name carefully. Early on, the condition allowed `allUsers` / `allAuthenticatedUsers` for public endpoints, and the name reflected that. After the public endpoints were gone, **I removed that condition in the same change that promoted the policy to enforce**; only the name remains as a leftover.

### Observe

Dry-run violations are recorded in the Cloud Audit Logs policy log (`cloudaudit.googleapis.com%2Fpolicy`) as `OrgPolicyDryRunAuditMetadata` with `dryRunResult: "DENIED"` / `liveResult: "ALLOWED"` ([Test organization policies](https://docs.cloud.google.com/organization-policy/test-policies)). I sent these to Slack through the notification function described below and watched for roughly one week to about three months, depending on the constraint.

The dry-run violation count alone is weak evidence, so before promoting I gathered these four things:

- **Dry-run violation notifications**: zero violations during the audit period, or only known ones (such as positive controls)
- **A full scan of the audit log archive**: go back several months through the activity logs we store in GCS via an org sink (`include_children = true`) and find the sources of the target operations (`CreateServiceAccountKey`, `UploadServiceAccountKey`, `SetIamPolicy` with `allUsers`, etc.). This also shows operations from before dry-run started
- **Org-wide CAI inventory**: count existing resources that could get caught on update after enforcement (Cloud Run with `invokerIamDisabled=true`, ForwardingRules, etc.)
- **Positive controls**: deliberately violate the constraint in a test project and confirm it's logged and reaches Slack. This backs up that "zero violations" doesn't mean "not detected"

Positive controls also helped in an unexpected place. For the default SA basic-role constraint, a project that enabled the Compute Engine API during the audit period triggered a dry-run violation notification when a Google service agent automatically granted editor to the default SA. **After enforcement, enabling an API no longer gives the default SA editor**, so this was a prompt to check for procedures that relied on that editor grant.

### Set up exceptions before promoting

For projects that really need the violating operation, create project-level overrides **before** promoting. If the exception overrides both the live spec and `dry_run_spec`, dry-run notifications won't keep firing for known, accepted operations (details in my [IAM Deny Policy post](/en/2026/08/26/gcp-iam-deny-policy-guardrails/)).

Promotion is just removing `dry_run_spec` and setting `spec` to `enforce = "TRUE"`.

```hcl
resource "google_org_policy_policy" "disable_sa_key_upload" {
  name   = "organizations/${var.org_id}/policies/iam.managed.disableServiceAccountKeyUpload"
  parent = "organizations/${var.org_id}"

  spec {
    rules {
      enforce = "TRUE"
    }
  }
}
```

All the constraints covered here evaluate only new creates and updates, and don't apply retroactively to existing keys, bindings, or forwarding rules. Existing USER_MANAGED keys keep working after enforcing the SA key creation block. I wrote about handling keys in general in my [SA key post](/2026/07/09/2026-07-10-gcp-service-account-key-hygiene-en/).

## Constraints without dry-run: inventory → exceptions → enforce directly

For `gcp.resourceLocations`, I used CAI to take inventory of resource locations across the organization (tens of thousands of resources) and identified the projects with real resources outside `asia-northeast1`. I created overrides for those projects first, then enforced at the organization level.

```hcl
locals {
  allowed_locations = ["in:jp-locations", "global"]

  # project ID => additional value groups to allow
  resource_location_overrides = {
    "example-analytics" = ["in:us-locations"]
  }
}

resource "google_org_policy_policy" "resource_locations_override" {
  for_each = local.resource_location_overrides

  name   = "projects/${each.key}/policies/gcp.resourceLocations"
  parent = "projects/${each.key}"

  spec {
    inherit_from_parent = true

    rules {
      values {
        allowed_values = concat(local.allowed_locations, each.value)
      }
    }
  }
}

resource "google_org_policy_policy" "resource_locations" {
  name   = "organizations/${var.org_id}/policies/gcp.resourceLocations"
  parent = "organizations/${var.org_id}"

  spec {
    rules {
      values {
        allowed_values = local.allowed_locations
      }
    }
  }

  # NOTE: if the org policy took effect before the overrides, overseas regions would be denied temporarily in override projects
  depends_on = [google_org_policy_policy.resource_locations_override]
}
```

This constraint only affects newly created resources; existing resources keep running ([Restricting resource locations](https://docs.cloud.google.com/resource-manager/docs/organization-policy/defining-locations)). Here's what I paid attention to when designing the allowed values:

- `in:jp-locations` is the value group for Tokyo and Osaka. I included Osaka with domestic DR in mind
- `global` is required. Secret Manager secrets with automatic replication fail to create if `global` isn't allowed ([Services that support restricting resource locations](https://docs.cloud.google.com/organization-policy/reference/restrict-locations-supported-services))
- Projects using BigQuery US multi-region or App Engine (`us-central`, whose region can't be changed after creation) can get caught on new creates or autoscaling, so allow them via overrides
- Also list the org-level allowed values explicitly in the overrides. That way, whichever side takes effect first, there's no window where domestic regions get denied

`run.allowedIngress` (allowing only `internal` / `internal-and-cloud-load-balancing`) is also a legacy list constraint without dry-run. I confirmed via CAI that there were effectively zero Cloud Run services with `ingress=all`, then enforced it directly with no exceptions. I cover `storage.uniformBucketLevelAccess` in the pitfalls section.

## Denial notifications

I send not only dry-run violations but also post-enforcement denials to Slack. The goal is to know that someone's work got blocked before they come asking. The pipeline is org sink → Pub/Sub → Cloud Run functions (Node.js) → Slack.

### Denial log structure differs by constraint type

Comparing logs I captured by triggering real denials, the structure was completely different depending on the constraint type.

| Type | Where it's logged | Denial signal | Constraint name |
| --- | --- | --- | --- |
| Dry-run violation | policy log | `protoPayload.metadata.dryRunResult="DENIED"` | `metadata.constraint` |
| Managed constraint enforce denial | activity log (same `methodName` as the original operation) | `status.code=9` and `policyViolationInfo.orgPolicyViolationInfo.violationInfo[]` | `violationInfo[].constraint` (`constraints/...`) |
| Legacy constraint enforce denial | activity log | Only `status.code=9` and `status.message` (no `policyViolationInfo`, no `status.details`) | `constraints/...` inside `status.message` |
| Custom constraint enforce denial | activity log | `status.code=9` and `status.message`. Some services also set `status.details[].reason="CUSTOM_ORG_POLICY_VIOLATION"` | **`customConstraints/...`** inside `status.message` |

For example, when I tried to create a bucket in the US, the legacy constraint denial only had `'us' violates constraint 'constraints/gcp.resourceLocations'` in `status.message`. At first I was only checking for `violationInfo`, so I missed these.

I could confirm the `ViolationInfo` fields (`constraint` / `checkedValue` / `errorMessage` / `policyType`) in the [AuditLog reference](https://docs.cloud.google.com/php/docs/reference/cloud-common-protos/latest/Audit.ViolationInfo). However, **I couldn't find official documentation that clearly says which fields get filled for which constraint type**. The table above is based on logs I captured in our environment. As for where denials are logged, the table in [Test organization policies](https://docs.cloud.google.com/organization-policy/test-policies) says an organization policy audit log is generated when the live policy denies an operation, but in our environment, after removing `dry_run_spec` and enforcing, SA key creation denials were recorded in the activity log with the same `methodName` as the original operation, and I couldn't find them in the policy log.

Also, the [official docs](https://docs.cloud.google.com/iam/docs/org-policy-custom-constraints) say that if an IAM custom constraint causes a `setIamPolicy` on the organization resource itself to fail, no audit log is generated. Log-based notifications can't catch denials on that path.

### Sink filter

This catches all three cases. The `status.message` clause is narrowed to "`code=9` and contains a constraint name" so it doesn't pick up other `FAILED_PRECONDITION` errors.

```hcl
locals {
  org_policy_denial_filter = join(" OR ", [
    "protoPayload.metadata.dryRunResult=\"DENIED\"",
    "protoPayload.policyViolationInfo.orgPolicyViolationInfo.violationInfo.constraint:*",
    "(protoPayload.status.code=9 AND protoPayload.status.message:\"constraints/\")",
  ])
}

resource "google_pubsub_topic" "org_policy_denials" {
  name = "org-policy-denials"
}

resource "google_logging_organization_sink" "org_policy_denials" {
  name             = "org-policy-denials"
  org_id           = var.org_id
  include_children = true
  destination      = "pubsub.googleapis.com/${google_pubsub_topic.org_policy_denials.id}"
  filter           = local.org_policy_denial_filter
}

resource "google_pubsub_topic_iam_member" "sink_publisher" {
  topic  = google_pubsub_topic.org_policy_denials.id
  role   = "roles/pubsub.publisher"
  member = google_logging_organization_sink.org_policy_denials.writer_identity
}
```

Custom constraint names start with `customConstraints/`, but the Logging query language is case-insensitive except for regular expressions and logical operators ([Logging query language](https://docs.cloud.google.com/logging/docs/view/logging-query-language)), so `"constraints/"` also caught custom constraint denials (also confirmed with `gcloud logging read`).

### Classify in the function

The trouble was on the function side. JavaScript string comparison is case-sensitive, so looking only for `constraints/` left the constraint name as `unknown` for custom constraint denials. Worse, a denied grant on project IAM was **wrongly reported as "a privileged role was granted (SetIamPolicy)"**, because a failed `SetIamPolicy` is logged in the activity log with the same `methodName` as a successful one.

I ended up with a classification like this (a simplified version of the implementation).

```js
const CONSTRAINT_NAME_PATTERN = /\b(?:customConstraints|constraints)\/[A-Za-z0-9._-]+/g;

const orgPolicyViolation = (proto) => {
  const status = proto.status || {};
  const violations = proto.policyViolationInfo?.orgPolicyViolationInfo?.violationInfo || [];
  const fromViolationInfo = violations.map((v) => v.constraint).filter(Boolean);
  const fromMessage = status.code === 9 ? String(status.message || '').match(CONSTRAINT_NAME_PATTERN) || [] : [];
  const constraints = [...new Set([...fromViolationInfo, ...fromMessage])];
  const deniedByDetails = (status.details || []).some((d) => String(d.reason || '').includes('ORG_POLICY_VIOLATION'));

  return { denied: constraints.length > 0 || deniedByDetails, constraints };
};

const classify = (proto) => {
  if (proto.metadata?.dryRunResult === 'DENIED') {
    return { title: 'Organization Policy dry-run violation detected', constraints: [proto.metadata.constraint] };
  }

  const violation = orgPolicyViolation(proto);
  if (violation.denied) {
    return { title: 'Operation denied by Organization Policy', constraints: violation.constraints };
  }

  if (proto.methodName?.endsWith('SetIamPolicy') && proto.status?.code) {
    return { title: 'IAM policy change failed (SetIamPolicy)', error: proto.status.message };
  }

  return null;
};

module.exports = { classify };
```

The key points:

- Take constraint names from both `violationInfo` and `status.message`, and include `customConstraints/`
- Evaluate the Org Policy denial check **before** the "success" notifications for `SetIamPolicy` or `CreateServiceAccountKey`
- Report a `SetIamPolicy` with a non-zero `status.code` as "failed", not "granted"
- Use the captured real logs as test fixtures and run `node --test` in CI. I confirmed the fixtures fail with the old code before fixing it

## Pitfall 1: `gcp.resourceLocations` deactivated SCC Standard

About a week after enforcing `gcp.resourceLocations`, every Terraform plan / apply stopped. Refreshing the Security Command Center NotificationConfig failed because the SCC v2 API had started returning a 400 `Security Command Center Legacy has been permanently disabled` across the organization.

This is documented behavior. The [official docs](https://docs.cloud.google.com/security-command-center/docs/migrate-standard-legacy) say that if Standard tier was automatically activated and you then enable an organization policy that restricts resource locations, Security Command Center might be automatically deactivated within seven days after the policy is deployed. Organizations are excluded if they changed the data residency configuration before enabling the policy, enabled Vulnerability Assessment for Google Cloud after the automatic activation and before deploying the policy, or upgraded to Premium / Enterprise after the automatic activation.

- **Check the state**: if `gcloud scc notifications list --organization=ORG_ID --location=global` returns the 400 above, it's been deactivated
- **Recover**: reactivate manually from the Console. Existing findings are stored in `global`, so you need to keep the data residency at `global` or you lose access to them (this is in the official docs)
- After manual reactivation, the deactivation hasn't recurred even with `gcp.resourceLocations` still enforced. However, **the official docs don't explicitly say manual activation is exempt from automatic deactivation** (they do say manual activation doesn't restrict the data residency configuration even if it conflicts with resource locations policies), so this is an observation from our environment

If you're about to roll out `gcp.resourceLocations`, I think it's worth checking how SCC was activated and its data residency settings before enforcing.

## Pitfall 2: handle auto-created buckets before enforcing UBLA

I enforced `storage.uniformBucketLevelAccess` at the organization level to close the external-sharing loophole via object ACLs. The domain restricted sharing custom constraint only evaluates IAM AllowPolicy, so it can't stop sharing through Cloud Storage ACLs (the official docs also say default grants via ACLs are out of scope).

This constraint denies "creating a new bucket with UBLA disabled" and "disabling UBLA on an existing bucket"; existing buckets with UBLA disabled keep working ([Organization policy constraints](https://docs.cloud.google.com/resource-manager/docs/organization-policy/org-policy-constraints)). Here's what I saw in a test project:

| Create request | Result after enforcement |
| --- | --- |
| UBLA not specified (same shape as the `_cloudbuild` bucket that `gcloud builds submit` creates) | Succeeds. UBLA is enabled automatically |
| UBLA explicitly disabled (`iamConfiguration.uniformBucketLevelAccess.enabled: false`) | Denied with HTTP 412 |

Even though existing buckets aren't affected, leaving them with UBLA disabled leaves the ACL loophole open too. All Terraform-managed buckets already had `uniform_bucket_level_access = true`; what remained were **buckets that App Engine / Cloud Build / Vertex AI had auto-created on the service side** (`<project>.appspot.com`, `staging.<project>.appspot.com`, `<project>_cloudbuild`, `cloud-ai-platform-*`).

I brought these into Terraform with `import` blocks and enabled only UBLA.

```hcl
import {
  id = "example-project/example-project.appspot.com"
  to = google_storage_bucket.app_engine_default
}

resource "google_storage_bucket" "app_engine_default" {
  project  = "example-project"
  name     = "example-project.appspot.com"
  location = "US"

  uniform_bucket_level_access = true

  lifecycle {
    prevent_destroy = true
  }
}
```

- Write the existing settings (location, storage class, lifecycle, CORS) exactly as imported, and confirm the plan diff is only `uniform_bucket_level_access` `false -> true`
- Beforehand, confirm the bucket ACL only has `project-owners/editors/viewers`, equivalent to IAM (`legacyBucketOwner` / `legacyBucketReader`), and that Data Access logs show no unexpected access. Object ACLs (OWNER for the uploader or a service agent) stop working, so also check that the creating service's service agent has the roles it needs in project IAM
- UBLA can be disabled within 90 days of enabling it ([Uniform bucket-level access](https://docs.cloud.google.com/storage/docs/uniform-bucket-level-access)). After 90 days you can't go back. The same page also lists, as a requirement for disabling, that the bucket isn't subject to the `storage.uniformBucketLevelAccess` constraint, so once it's enforced at the organization level you can't go back even within 90 days unless the bucket is taken out of the constraint's scope
- After apply, delete the `import` blocks. If the owning product repo keeps managing the bucket, keep the resource definition; if you don't want to manage it, drop it from state with a `removed` block

```hcl
removed {
  from = google_storage_bucket.app_engine_default

  lifecycle {
    destroy = false
  }
}
```

One thing that bit me was **buckets in projects with billing disabled**. The plan (a read) passed, but apply failed with `Error 403: The billing account for the owning project is disabled in state absent, accountDisabled`. The import made it into state but the UBLA update was rejected, and since main's apply would fail every time, I removed them from state with `removed`. In our environment, the UBLA update on buckets in billing-disabled projects was rejected with this 403, and they couldn't be changed without enabling billing (I couldn't find this behavior documented in the Cloud Storage docs). Since apply can fail even when plan passes, it's worth checking the billing state with `gcloud billing projects describe` beforehand.

## Summary

- Dry-run is only available for custom constraints, managed constraints, and a few legacy constraints. For the rest, use CAI inventory and set up exceptions first
- Add dry-run as "live spec no-op, `dry_run_spec` enforced", and promote only after gathering violation logs, a full audit-log scan, CAI inventory, and positive controls
- Post-enforcement denial logs differ across managed / legacy / custom. Look at `status.message` (including `customConstraints/`) as well as `violationInfo`, and tell failed `SetIamPolicy` apart from grants
- Enforcing `gcp.resourceLocations` can deactivate an automatically activated SCC Standard within seven days. Recover by manually reactivating from the Console with `global`
- Before `storage.uniformBucketLevelAccess`, import the service-created UBLA-disabled buckets and enable UBLA. In our environment, buckets in billing-disabled projects couldn't be updated

I hope this helps.

## References

- [Test organization policies (dry-run)](https://docs.cloud.google.com/organization-policy/test-policies)
- [Organization policy constraints](https://docs.cloud.google.com/resource-manager/docs/organization-policy/org-policy-constraints)
- [Secure by default organizations](https://docs.cloud.google.com/resource-manager/docs/secure-by-default-organizations)
- [Use custom organization policies for IAM](https://docs.cloud.google.com/iam/docs/org-policy-custom-constraints)
- [Restricting identities by domain](https://docs.cloud.google.com/organization-policy/restrict-domains)
- [Restricting resource locations](https://docs.cloud.google.com/resource-manager/docs/organization-policy/defining-locations)
- [Services that support restricting resource locations](https://docs.cloud.google.com/organization-policy/reference/restrict-locations-supported-services)
- [Security Command Center: Standard tier migration and automatic deactivation](https://docs.cloud.google.com/security-command-center/docs/migrate-standard-legacy)
- [Uniform bucket-level access](https://docs.cloud.google.com/storage/docs/uniform-bucket-level-access)
- [Logging query language](https://docs.cloud.google.com/logging/docs/view/logging-query-language)
- [Cloud Run ingress](https://docs.cloud.google.com/run/docs/securing/ingress)
- [Allowing public (unauthenticated) access - Cloud Run](https://docs.cloud.google.com/run/docs/authenticating/public)
- [AuditLog ViolationInfo reference](https://docs.cloud.google.com/php/docs/reference/cloud-common-protos/latest/Audit.ViolationInfo)
- [google_org_policy_policy](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/org_policy_policy)
