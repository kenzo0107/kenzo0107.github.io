---
title: Fixing SES Emails Landing in Spam with a Dedicated Sending Subdomain and DKIM
date: 2026-08-10
lang: en
translation_id: ses-dedicated-sending-subdomain
permalink: en/2026/08/10/ses-dedicated-sending-subdomain/
cover: /img/cover/2026-08-10-ses-dedicated-sending-subdomain.svg
categories:
- [AWS]
- [Terraform]
tags:
- AWS
- SES
- Route53
- DKIM
- SPF
- DMARC
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

Login notification emails (magic links) sent from an internal system via Lambda + SES started **landing in spam**, so I fixed it with a dedicated sending subdomain: an SES domain identity with Easy DKIM, a custom MAIL FROM domain, and DMARC.
This post covers the NS delegation design under the constraint that the parent zone lives in a different AWS account and repository, and how I staged the migration in Terraform.

<!-- more -->

## The Problem

The original SES setup was:

- The sender was an email-address-level `aws_ses_email_identity` (a personal address)
- **No DKIM signature**
- **SPF misalignment** (MAIL FROM stayed at amazonses.com and didn't align with the From domain)

With such weak signals, receivers routed the mail to the spam folder.

### Aside: SES IAM authorization also applies to the destination identity

Before the spam issue, SES sending itself had failed with `AccessDenied`. I had restricted the `ses:SendEmail` IAM resource to the sender identity only, but **when the destination is a verified identity in the same account, AWS also performs an authorization check against the destination identity** (confirmed via the actual log: `... is not authorized to perform 'ses:SendEmail' on resource 'identity/<recipient email>'`).

```hcl
  # SES checks authorization not only against the From identity, but also against
  # the destination identity when it is a verified identity in the account
  statement {
    effect = "Allow"
    actions = [
      "ses:SendEmail",
      "ses:SendRawEmail",
    ]
    resources = concat(
      [aws_ses_domain_identity.mail_from.arn],
      [for identity in aws_ses_email_identity.recipient : identity.arn]
    )
  }
```

## The Fix

Switch to a domain identity on a dedicated sending subdomain (e.g. `myapp.example.co.jp`) with the full authentication trio:

| Measure | Details |
| --- | --- |
| DKIM | Easy DKIM (3 CNAMEs) |
| SPF alignment | Custom MAIL FROM domain (`bounce.` subdomain + MX + SPF) |
| DMARC | Start with `p=none`, raise gradually after confirming DKIM/SPF pass |

The constraint: **the parent zone (`example.co.jp`) is managed in a different AWS account and a different repository**. The subdomain's hosted zone had to be created in the app repository and NS-delegated from the parent.

## NS Delegation Design: Delegate stg Inside the prd Zone

There are two environments, stg and prd. The naive approach adds two NS records to the parent zone, but I ended up with this chain:

```
example.co.jp (separate account, company-wide DNS repository)
  └─ NS delegation → myapp.example.co.jp (app prd account)
                       └─ NS delegation → stg.myapp.example.co.jp (app stg account)
```

The dependency on the company-wide DNS repository is **minimized to a single prd record**, and the stg delegation is completed inside prd's hosted zone. Rebuilding the stg environment never touches the company-wide repository — the lifecycle stays within the app's own repositories.

NS record values are not hard-coded; they reference the app-side outputs via `terraform_remote_state`.

```hcl
# App prd: delegate the stg subdomain inside this zone
# NOTE: the parent zone only delegates the prd domain; delegating stg within this zone
# keeps stg environment rebuilds from affecting the parent zone
resource "aws_route53_record" "mail_stg_delegation" {
  zone_id = aws_route53_zone.mail.zone_id
  name    = "stg.${local.mail_domain}"
  type    = "NS"
  ttl     = 300
  records = data.terraform_remote_state.stg.outputs.mail_zone_name_servers
}
```

## Terraform Implementation and Staged Migration

Domain verification cannot pass until the parent-zone NS delegation is done, so I **split "resource creation" and "verification + cutover" into two PRs**. Doing verification in the same apply risks a verification timeout and an email outage while delegation is incomplete.

### Step 1: create SES + DNS resources first (without switching the From address)

```hcl
resource "aws_ses_domain_identity" "mail_from" {
  domain = local.mail_domain # e.g. myapp.example.co.jp
}

# Easy DKIM signing
resource "aws_ses_domain_dkim" "mail_from" {
  domain = aws_ses_domain_identity.mail_from.domain
}

# Custom MAIL FROM domain for SPF alignment
resource "aws_ses_domain_mail_from" "mail_from" {
  domain           = aws_ses_domain_identity.mail_from.domain
  mail_from_domain = "bounce.${local.mail_domain}"
}
```

The DNS side is the hosted zone + verification TXT + 3 DKIM CNAMEs + MAIL FROM MX/SPF + DMARC.

```hcl
# NOTE: 3 CNAME records for Easy DKIM. dkim_tokens are unknown until after apply on
# first creation, so they cannot be for_each + toset keys — use count on the
# assumption there are always 3
resource "aws_route53_record" "mail_dkim" {
  count = 3

  zone_id = aws_route53_zone.mail.zone_id
  name    = "${aws_ses_domain_dkim.mail_from.dkim_tokens[count.index]}._domainkey.${local.mail_domain}"
  type    = "CNAME"
  ttl     = 600
  records = ["${aws_ses_domain_dkim.mail_from.dkim_tokens[count.index]}.dkim.amazonses.com"]
}

resource "aws_route53_record" "mail_from_mx" {
  zone_id = aws_route53_zone.mail.zone_id
  name    = aws_ses_domain_mail_from.mail_from.mail_from_domain
  type    = "MX"
  ttl     = 600
  records = ["10 feedback-smtp.${data.aws_region.current.region}.amazonses.com"]
}

resource "aws_route53_record" "mail_from_spf" {
  zone_id = aws_route53_zone.mail.zone_id
  name    = aws_ses_domain_mail_from.mail_from.mail_from_domain
  type    = "TXT"
  ttl     = 600
  records = ["v=spf1 include:amazonses.com ~all"]
}

# NOTE: start with p=none; raise to p=quarantine in a later PR after confirming DKIM/SPF
resource "aws_route53_record" "mail_dmarc" {
  zone_id = aws_route53_zone.mail.zone_id
  name    = "_dmarc.${local.mail_domain}"
  type    = "TXT"
  ttl     = 600
  records = ["v=DMARC1; p=none;"]
}
```

Expose the name servers as an output for the delegation:

```hcl
output "mail_zone_name_servers" {
  description = "NS records of the dedicated sending subdomain, used for parent-zone delegation"
  value       = aws_route53_zone.mail.name_servers
}
```

### Step 2: verification + cutover after NS delegation completes

Only after the delegation is in place do I add `aws_ses_domain_identity_verification` (adding it earlier makes the apply time out).

```hcl
# NOTE: waits for domain ownership verification. The TXT record must be resolvable
# through the delegated zone, hence the explicit depends_on
resource "aws_ses_domain_identity_verification" "mail_from" {
  domain = aws_ses_domain_identity.mail_from.domain

  depends_on = [aws_route53_record.mail_verification]

  timeouts {
    create = "10m"
  }
}
```

Once verification passed, I switched the From address to `noreply@myapp.example.co.jp` and deleted the old `aws_ses_email_identity`. **Keep the old identity alive until verification completes** — that is the safe order.

### Small traps

- `dkim_tokens` are unknown until after apply, so they can't be `for_each + toset` keys — write `count = 3` on the always-three assumption
- Managing the same email address in two Terraform resources (sender and recipient) means destroying one **collaterally revokes the other identity**
- I later wanted to shorten the subdomain (`mail.prd.myapp...` → `myapp...`), which meant recreating the hosted zone and redoing the NS delegation. **Decide upfront whether the subdomain will ever serve anything besides email**

## Result

The sender is now a domain identity with DKIM signing, SPF alignment, and DMARC, and the spam classification is gone. Raising DMARC from `p=none` to `p=quarantine` will follow separately while watching the reports.

## Summary

- An email-address SES identity (no DKIM, misaligned SPF) is prone to spam classification; a dedicated sending subdomain with Easy DKIM + custom MAIL FROM + DMARC fixes it
- When the parent zone is managed elsewhere, split "resource creation" and "verification + cutover" into two PRs
- Delegating stg inside the prd zone minimizes dependence on company-wide DNS
- SES IAM authorization also applies to verified destination identities

I hope this helps.

## References

- [Easy DKIM in Amazon SES](https://docs.aws.amazon.com/ses/latest/dg/send-email-authentication-dkim-easy.html)
- [Custom MAIL FROM domains in Amazon SES](https://docs.aws.amazon.com/ses/latest/dg/mail-from.html)
- [aws_ses_domain_identity_verification](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/ses_domain_identity_verification)
