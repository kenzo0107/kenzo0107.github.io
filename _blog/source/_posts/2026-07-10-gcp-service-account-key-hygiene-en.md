---
title: "Keeping Google Cloud Service Account Keys From Going Stale"
date: 2026-07-10
lang: en
translation_id: gcp-service-account-key-hygiene
cover: /img/cover/2026-07-10-gcp-service-account-key-hygiene.svg
categories:
- [Google Cloud]
- [Security]
tags:
- Google Cloud
- IAM
- Service Account
- Security
- Workload Identity Federation
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

While auditing a Google Cloud project managed with Terraform, I once found service account (SA) keys that had sat unused and unrotated for years.
Even a key that its creator meant to use "just temporarily" turns into a long-lived credential sitting somewhere once it's forgotten.

This post walks through what I checked and the measures I'm applying (or planning to apply) to keep SA keys from being left behind.

<!-- more -->

## Conclusion

Here's the overall approach, up front.

| Phase | What to do |
| --- | --- |
| Detect | Sweep across the org with Cloud Asset Inventory to find key creation times |
| Prevent | Use org policies to block new key creation/upload |
| Replace | Move to Workload Identity Federation / impersonation wherever possible to go keyless |
| When a key is unavoidable | Rotate every 90 days and keep audit logs for traceability |

Just deleting keys you find isn't enough — it'll happen again. I try to think in three parts: **prevent (stop people from creating keys) → detect (sweep for what's already there) → replace (move toward keyless)**.

## Why leaving SA keys around is a problem

A service account key is a single JSON file that stays valid for a long time. Without rotation, it effectively becomes a "credential with no expiration."

In AWS terms, **this is the equivalent of an IAM user's credentials (an AWS Access Key ID / Secret Access Key)**. The same reasoning that pushes AWS users to avoid long-lived IAM user access keys and prefer IAM roles (temporary credentials) applies here: GCP SA keys should likewise be avoided where possible, in favor of temporary credentials like impersonation or Workload Identity Federation.

- Downloaded JSON files tend to multiply in places nobody's watching — local machines, CI secret stores, accidentally committed to Git
- If only the key is stolen, the access looks legitimate, which makes misuse much harder to detect

Google Cloud's own documentation states plainly that "service account keys are powerful credentials, and improper management poses a security risk," and that using a key at all should be conditional on confirming there's no safer authentication method available.

## Detection

Start by finding out how many keys currently exist.

To check the keys and creation times for a single service account:

```bash
# List user-managed keys with their creation time
gcloud iam service-accounts keys list \
  --iam-account=my-iam-account@my-project.iam.gserviceaccount.com \
  --managed-by=user
```

`--created-before` narrows this down to keys created before a given date:

```bash
# Only list user-managed keys created before July 19, 2015 (candidates for rotation)
gcloud iam service-accounts keys list \
  --iam-account=my-iam-account@my-project.iam.gserviceaccount.com \
  --managed-by=user --created-before=2015-07-19T12:00:00Z
```

That command is scoped to a single service account, though. To sweep across an entire org or multiple projects, Cloud Asset Inventory's `search-all-resources` is more practical.

```bash
# Search across every project under the org for SA keys created before a given date
gcloud asset search-all-resources \
  --scope="organizations/123456789012" \
  --query="createTime < 2023-03-10" \
  --asset-types="iam.googleapis.com/ServiceAccountKey" \
  --order-by="createTime"
```

This gives you a full list of which project, which service account, and when each remaining key was created.

## Prevention

Deleting what you find isn't a fix by itself, so the next step is to stop new keys from being created in the first place.

### Block key creation/upload with org policies

Google Cloud has org policy constraints specifically for this:

| Constraint | Effect |
| --- | --- |
| `iam.disableServiceAccountKeyCreation` (legacy) | Blocks creating new user-managed keys |
| `iam.managed.disableServiceAccountKeyCreation` (new) | Same, via the newer managed constraint |
| `iam.disableServiceAccountKeyUpload` (legacy) | Blocks uploading an existing public key |
| `iam.managed.disableServiceAccountKeyUpload` (new) | Same, via the newer managed constraint |

These can be enforced at the project, folder, or organization level, e.g.:

```bash
gcloud resource-manager org-policies enable-enforce \
  --organization='ORGANIZATION_ID' \
  iam.disableServiceAccountKeyCreation
```

Once enforced, attempting to create a key fails with `Key creation is not allowed on this service account` — key creation is blocked outright.

Note that **organizations created on or after May 3, 2024 have this constraint enforced by default**, so if your org is relatively new, key creation may already be blocked (worth checking when your org was created).

### Defining exceptions for cases where a key is still unavoidable

Blocking key creation org-wide will inevitably run into cases that can't move to WIF or impersonation:

- **SDKs, client libraries, or tools that don't support the `external_account` credential type used by WIF**: Workload Identity Federation works by exchanging an external token via Security Token Service, but the calling library or tool has to support `external_account`-style credentials to use it at all. Older library versions, or third-party SaaS/BI tools whose only supported GCP connection method is "upload a service account JSON key," simply have no non-key option
- **Execution environments that can't issue OIDC/SAML tokens**: Workload Identity Federation assumes an OIDC/SAML 2.0-compatible identity provider on the other end. Older on-prem infrastructure or batch servers that can't issue an external token in the first place can't use it

Google Cloud's own documentation recommends that, in these cases, you "grant an exception to the policy constraint, as narrowly as possible." Enforcing the block at the org/folder level while overriding the parent policy only for the specific projects that need an exception keeps that scope narrow.

```yaml
# Block key creation org-wide (/tmp/org_policy.yaml)
name: organizations/ORGANIZATION_ID/policies/iam.disableServiceAccountKeyCreation
spec:
  rules:
  - enforce: true
```

```yaml
# Override the parent policy only for the project that needs the exception (/tmp/project_policy.yaml)
name: projects/PROJECT_ID/policies/iam.disableServiceAccountKeyCreation
spec:
  rules:
  - enforce: false
```

```bash
gcloud org-policies set-policy /tmp/org_policy.yaml
gcloud org-policies set-policy /tmp/project_policy.yaml

# Check the effective policy (after inheritance/override)
gcloud org-policies describe iam.disableServiceAccountKeyCreation \
  --effective --project=PROJECT_ID
```

For finer granularity than a whole project, tag-based conditional policies are also available — a condition expression like `resource.matchTag('ORGANIZATION_ID/TAG_KEY', 'TAG_VALUE')` can scope the exception to specific resources. The full steps for creating the tag keys/values themselves live in the tag-management docs, though, and I haven't verified those details for this post.

Either way, keeping the default **"blocked by default, exceptions granted explicitly, one at a time"** prevents key creation from quietly spreading back out.

### Replacing keys with keyless authentication

Beyond blocking key creation, it's worth asking whether the use case that needed a key can be replaced with a keyless approach entirely.

- **Workload Identity Federation**: lets you use credentials from an external identity provider — AWS, Azure, GitHub, GitLab, Kubernetes, Active Directory, or any OIDC/SAML 2.0-compatible IdP — to access Google Cloud directly. The external token is verified by Security Token Service and exchanged for a short-lived OAuth 2.0 access token, so there's no JSON key to issue or distribute
- **Workloads on GCE / GKE**: use the managed workload identity (an attached service account) so a key never needs to leave the environment
- **Local developer environments**: use service account impersonation, borrowing permissions temporarily from the developer's own Google account credentials

If you're using GitHub Actions for CI/CD, switching to Workload Identity Federation eliminates the entire pattern of storing a GCP JSON key as a repository secret — it's one of the highest-value places to prioritize.

## When a key really is unavoidable

Some use cases can't move to impersonation or Workload Identity Federation and still need a key. For those, stick to the following:

- **Rotate every 90 days**: the official documentation recommends rotating keys "at least every 90 days to reduce the risk posed by leaked keys." The flow is: identify the key to rotate → create a new key for the same service account → replace the old key across all applications → disable the old key and confirm nothing breaks → delete the old key
- **Keep audit logs for traceability**: enable data access logs for the IAM API and Security Token Service API, and correlate them with your CI/CD logs and Cloud Audit Logs, so that even key-based operations can be traced back to "which pipeline run did what, and when"

## Summary

- SA keys effectively become "credentials with no expiration," and left alone they tend to linger in places nobody's watching
- Think in three parts: **prevent** (block key creation/upload via org policy) → **detect** (sweep with Cloud Asset Inventory) → **replace** (go keyless with Workload Identity Federation, etc.)
- Where a key is truly unavoidable, pair 90-day rotation with audit log traceability

My own environment is still mid-way through this audit and policy rollout, so I plan to write a follow-up once I've finished applying it.
I hope this helps.

## References

- [Best practices for managing service account keys | IAM Documentation](https://cloud.google.com/iam/docs/best-practices-service-accounts)
- [Restricting service accounts | Resource Manager Documentation](https://cloud.google.com/resource-manager/docs/organization-policy/restricting-service-accounts)
- [Workload identity federation | IAM Documentation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [Rotate service account keys | IAM Documentation](https://cloud.google.com/iam/docs/key-rotation)
