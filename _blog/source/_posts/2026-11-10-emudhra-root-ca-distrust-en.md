---
title: Removing the emSign roots from container CA bundles after the eMudhra intermediate CA key compromise
date: 2026-11-10
lang: en
translation_id: emudhra-root-ca-distrust
permalink: en/2026/11/10/emudhra-root-ca-distrust/
cover: /img/cover/2026-11-10-emudhra-root-ca-distrust.svg
categories:
- [AWS]
- [Security]
tags:
- AWS
- ECS
- CodeBuild
- CloudWatch Agent
- Amazon Linux 2023
- CA Certificates
- eMudhra
- Security
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

As part of our security work, I responded to the eMudhra intermediate CA private key compromise. The goal was to make sure **the CA bundles shipped inside our containers no longer trust `emSign ECC Root CA - G3`**, the root above the intermediates whose keys were compromised.

I inventoried the images used by the CloudWatch Agent sidecars on ECS, by CodeBuild, and by our data platform jobs. I got as far as opening pull requests for two workarounds: a custom image that overwrites the CA bundle, and updating `ca-certificates` at build time. In the end I closed all but one of them (one was still open at the time of writing) and **moved to the fixed upstream images (CloudWatch Agent `1.300074.1`, the official CodeBuild image)**. This post covers how that went and why I chose that path.

Note: this post reflects the situation **as of November 10, 2026**. The incident is still ongoing, and vendor responses may change. I only state facts I could confirm in primary sources (Mozilla Bugzilla, the NSS release announcement, Amazon Linux ALAS, the amazon-cloudwatch-agent RELEASE_NOTES, etc.). Where information only appears in security vendor blogs or news articles, I say so.

<!-- more -->

## Conclusion

| Item | Details |
| --- | --- |
| What happened | The private keys of eight eMudhra **intermediate CAs** could be recovered from their public certificates (reported October 17, 2026) |
| Root to remove | `emSign ECC Root CA - G3` (Mozilla NSS 3.131.1 also removed `emSign Root CA - C1` / `emSign ECC Root CA - C3`, under a separate request from eMudhra itself) |
| The problem | Browsers blocked the intermediates the same day via CRLSet / OneCRL, but Go, OpenSSL, etc. inside containers read **the bundled CA file**, so they keep trusting the root until the image is updated |
| Options considered | Overwrite the CA bundle in a custom image / update `ca-certificates` at build time / wait for the upstream fix and upgrade |
| Chosen approach | Upgrade to the fixed upstream images (CloudWatch Agent `1.300074.1b2005`, official CodeBuild image 26.10.30) |
| Deciding factors | Upstream fixed it within 10 days to just under two weeks of the report. A custom image is costly to build, roll out, and later tear down, and its trusted set drifts from the vendor's |

## What happened (facts confirmed in public sources)

I started by checking the facts against primary sources.

- **October 17, 2026 (UTC)**: It was reported that the private keys of eight eMudhra intermediate CAs were compromised. The report was forwarded to Mozilla via the Chrome Root Program, and Mozilla finished blocking them through OneCRL the same day ([Bugzilla 2083449](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449)). Chrome also blocked them through CRLSet (Chrome Root Program, [comment 50](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c50)). The reporter's [comment 2](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c2) says the CRLSet fetched at 22:46 UTC that day already listed the six TLS intermediates as revoked
- The root cause was flawed key generation. The affected P-384 keys had extremely small private scalars; Bugzilla says "The 8 impacted keys all used integers less than 256". eMudhra explained that weak keys produced by a buggy key generation script were mistakenly used to create the CSRs (Bugzilla 2083449, eMudhra's initial explanation)
- **October 18**: eMudhra revoked the eight intermediates with reason `caCompromise` (Bugzilla 2083449)
- **October 19**: Sectigo revoked the cross-certificates for the eight intermediates ([Sectigo advisory](https://www.sectigo.com/resource-library/advisory-on-compromised-emudhra-intermediate-certificates)). The cross-certificates were issued from `AAA Certificate Services` ([Bugzilla 2083449 comment 30](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c30))
- **October 19**: Go 1.27.3 / 1.26.10 were released. The [release history](https://go.dev/doc/devel/release) only says "security fixes to the `crypto/x509` package", but the Go vulnerability database ([GO-2026-6809](https://pkg.go.dev/vuln/GO-2026-6809), CVE-2026-111943) says "a denylist was added in crypto/x509", so `Verify` no longer returns chains containing the affected intermediates ([golang/go#82345](https://go.dev/issue/82345))
- **October 20**: NSS 3.131.1 was released and removed trust in three roots: `emSign Root CA - C1`, `emSign ECC Root CA - C3`, and `emSign ECC Root CA - G3` ([release announcement](https://groups.google.com/a/mozilla.org/g/dev-tech-crypto/c/vSxZxnOMMvs), [repost to oss-security](https://www.openwall.com/lists/oss-security/2026/10/20/30)). The incident response was the G3 removal ([Bug 2084101](https://bugzilla.mozilla.org/show_bug.cgi?id=2084101)); C1 / C3 were removed at eMudhra's own request as part of retiring its dual-purpose roots ([Bug 2083709](https://bugzilla.mozilla.org/show_bug.cgi?id=2083709)). At that point Mozilla said "At this time we are not removing trust in emSign Root CA - G1." ([Bugzilla 2083449 comment 18](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c18))
- **October 21**: Red Hat published [RHSB-2026-012](https://access.redhat.com/security/vulnerabilities/RHSB-2026-012), stating that the compromised intermediates were signed by the `Comodo AAA Services root` and `emSign ECC Root CA - G3`
- **October 24**: Amazon Linux 2023 `ca-certificates` was marked Fixed under ALAS2023-2026-3306 ([CVE-2026-113470](https://explore.alas.aws.amazon.com/CVE-2026-113470.html)). The description says "Amazon Linux will remove the affected eMudhra root certificates from the package."
- **October 27**: The amazon-cloudwatch-agent `1.300074.1` [RELEASE_NOTES](https://github.com/aws/amazon-cloudwatch-agent/blob/v1.300074.1/RELEASE_NOTES) include "[Container] Remove root certificates that are no longer trusted from the container image CA bundle". The same version also lists "[Agent] Build the agent with Go 1.27.3"
- **October 30**: The official CodeBuild image Dockerfiles started updating `ca-certificates` ([the commit in aws/aws-codebuild-docker-images](https://github.com/aws/aws-codebuild-docker-images/commit/e2842e2))
- **November 5**: Mozilla landed an NSS change that removes email trust from `emSign Root CA - G1` and sets its TLS distrust-after date to 2026-11-16 23:59:59 UTC ([Bug 2089115](https://bugzilla.mozilla.org/show_bug.cgi?id=2089115)). Rather than removing the root, this stops trusting TLS certificates issued after that date

One clarification on terminology. The compromised keys belonged to **intermediate CAs**, not to the root CA. However, with those keys anyone could issue a certificate for any domain that validates up to the root. That is why trust stores responded by distrusting the whole root.

### What I could not confirm, and where sources disagree

- **How `AAA Certificate Services` (Sectigo's legacy root) is handled**: Sectigo wrote on Bugzilla that this root had already been removed from the Chrome and Mozilla root stores and remains trusted by Microsoft and Apple ([comment 6](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c6)). Indeed, it was in neither the CloudWatch Agent bundles below nor the `tls-ca-bundle.pem` of the pre-fix Amazon Linux 2023 image (`2023.12.20261021.0`). According to Sectigo's notices, Microsoft removed it from the Microsoft Root Store on October 25 ([Sectigo notice](https://www.sectigo.com/resource-library/removal-of-aaa-certificate-services-from-the-microsoft-root-store)), and Apple is shipping an update in the week of November 2 that removes it from parts of macOS ([Sectigo notice](https://www.sectigo.com/resource-library/removal-of-aaa-certificate-services-from-the-apple-root-store)). I have not seen Microsoft's or Apple's own announcements
- **eMudhra exiting the public TLS business**: eMudhra announced in an October 22 press release that it has "decided to voluntarily withdraw from the global SSL/TLS certificate business" ([eMudhra press release](https://emudhra.com/en/press-release/emudhra-to-exit-global-ssl-tls-certificate-business)). I have not confirmed the timeline or how existing certificates will be handled
- **Root cause explanation**: The root cause above is eMudhra's initial explanation. On November 2, eMudhra wrote that its earlier answers were based on what its internal teams could gather up to that point, and that it had appointed KPMG for an independent review ([comment 73](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c73)). I have not seen the final report

## How I identified what was affected

Browsers were protected the same day by their own mechanisms. Server-side processes (Go agents, curl, Python's `urllib`, etc.), however, read **the CA bundle inside the image**, and mechanisms like CRLSet or OneCRL do not apply to them. So I listed the running images and grouped them by where their CA bundle comes from.

### 1. List the images in use

Extract images from ECS task definitions and CodeBuild projects.

```console
$ aws ecs list-task-definitions --status ACTIVE --query 'taskDefinitionArns[]' --output text \
  | tr '\t' '\n' \
  | xargs -I{} aws ecs describe-task-definition --task-definition {} \
      --query 'taskDefinition.containerDefinitions[].image' --output text \
  | tr '\t' '\n' | sort -u

$ aws codebuild batch-get-projects \
    --names $(aws codebuild list-projects --query 'projects[]' --output text) \
    --query 'projects[].[name,environment.image]' --output text
```

CodeBuild-hosted GitHub Actions runners can also override the image via workflow labels, so I grepped `runs-on` for `image:` and label values as well.

### 2. Group them by where the CA bundle comes from

| Type | Example | CA bundle location | Fix |
| --- | --- | --- | --- |
| Distro-based images | CodeBuild standard image (AL2023), runners | OS trust store (`/etc/pki/ca-trust`, etc.) | Update `ca-certificates` |
| scratch / distroless | CloudWatch Agent container image | `/etc/ssl/certs/ca-certificates.crt` baked into the image | Rebuild the image (yourself or upstream) |
| Bundled with a language/tool | AWS CLI v2 (botocore), certifi, Java cacerts | Bundle inside the package | Update each package |

The third row is the one to watch. Updating the OS `ca-certificates` does not change **AWS CLI v2, which uses the CA bundle shipped with botocore**. I had to think per process about what a given fix actually covered.

On Linux, Go loads roots from the first file it finds in a fixed list of paths, including `/etc/ssl/certs/ca-certificates.crt`, plus the files in directories such as `/etc/ssl/certs` ([root_linux.go](https://github.com/golang/go/blob/master/src/crypto/x509/root_linux.go), [root.go](https://github.com/golang/go/blob/master/src/crypto/x509/root.go)). In the CloudWatch Agent image, the only file in those locations is `/etc/ssl/certs/ca-certificates.crt`.

### 3. Inspect the CA bundle without running the image

The CloudWatch Agent image is scratch-based and has no shell. Since I could not `docker run` it and look inside, I pulled the layers through the registry API and extracted just the CA bundle.

```bash
#!/usr/bin/env bash
set -euo pipefail

repo=cloudwatch-agent/cloudwatch-agent
tag=${1:?tag}
accept="Accept: application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json"

token=$(curl -fsS "https://public.ecr.aws/token/?scope=repository:${repo}:pull" | jq -r .token)
digest=$(curl -fsS -H "Authorization: Bearer ${token}" -H "${accept}" \
  "https://public.ecr.aws/v2/${repo}/manifests/${tag}" \
  | jq -r '.manifests[] | select(.platform.architecture=="arm64") | .digest')

: > bundle.pem
for layer in $(curl -fsS -H "Authorization: Bearer ${token}" -H "${accept}" \
    "https://public.ecr.aws/v2/${repo}/manifests/${digest}" | jq -r '.layers[].digest'); do
  curl -fsSL -H "Authorization: Bearer ${token}" "https://public.ecr.aws/v2/${repo}/blobs/${layer}" -o layer.tgz
  if tar -tzf layer.tgz | grep -x 'etc/ssl/certs/ca-certificates.crt' >/dev/null; then
    tar -xzOf layer.tgz etc/ssl/certs/ca-certificates.crt > bundle.pem
  fi
done
[ -s bundle.pem ] || { echo "CA bundle not found in ${tag}" >&2; exit 1; }

openssl crl2pkcs7 -nocrl -certfile bundle.pem | openssl pkcs7 -print_certs -noout | grep -c '^subject='
openssl crl2pkcs7 -nocrl -certfile bundle.pem | openssl pkcs7 -print_certs -noout | grep -E '^subject=.*(emSign|AAA Certificate Services)' || true
```

Here are the results when I re-ran it while writing this post (arm64).

| Tag | Certificates | emSign ECC Root CA - G3 | emSign Root CA - C1 / ECC C3 | emSign Root CA - G1 | AAA Certificate Services |
| --- | --- | --- | --- | --- | --- |
| `1.300072.0b1766` | 143 | present | present | present | absent |
| `1.300074.0b1920` | 143 | present | present | present | absent |
| `1.300074.1b2005` | 140 | **absent** | **absent** | present | absent |

The three removed certificates match the three roots dropped in NSS 3.131.1. `emSign Root CA - G1` remaining is also consistent with Mozilla's decision as of October 20. After the November 5 distrust-after change (Bug 2089115), `emSign Root CA - G1` was also gone from the `tls-ca-bundle.pem` in the latest Amazon Linux 2023 image (`2023.12.20261109.0`).

### 4. Check the fix mechanically

For distro-based images, I added a check that **fails the job** if `emSign ECC Root CA - G3` is still in the CA bundle. If the bundle has no label lines (`# <name>`), the check would pass silently, so that case fails too. In the actual pull requests, `AAA Certificate Services` / `Comodo AAA Services root` were failure conditions as well. As noted above, though, Mozilla-derived bundles never contained that root, so the examples in this post fail only on `emSign ECC Root CA - G3` and just log whether the AAA root is present. The Dockerfile and buildspec examples below do the same.

```bash
bundle=/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem
grep -q '^# ' "$bundle" || { echo "no certificate labels in $bundle" >&2; exit 1; }
if grep -E '^# emSign ECC Root CA - G3$' "$bundle"; then
  echo 'emSign ECC Root CA - G3 is still in the CA bundle' >&2
  exit 1
fi
grep -E '^# (AAA Certificate Services|Comodo AAA Services root)$' "$bundle" || echo 'AAA root: not found'
```

## The three options I considered

### Option 1: Overwrite the CA bundle in a custom image

When I investigated on October 28, even the latest CloudWatch Agent tag `1.300074.0b1920` still contained `emSign ECC Root CA - G3`, so bumping the tag would not help. Because the image is scratch-based, I could not update packages inside it either.

So I wrote a multi-stage build that installs the fixed `ca-certificates` on Amazon Linux 2023 and copies the resulting bundle over the CloudWatch Agent image's bundle.

```dockerfile
FROM public.ecr.aws/amazonlinux/amazonlinux:2023 AS ca-certificates
RUN dnf upgrade -y --releasever=latest ca-certificates && \
    dnf clean all && \
    if grep -E '^# emSign ECC Root CA - G3$' /etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem; then exit 1; fi

FROM public.ecr.aws/cloudwatch-agent/cloudwatch-agent:1.300072.0b1766
COPY --from=ca-certificates /etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem /etc/ssl/certs/ca-certificates.crt
```

The `--releasever=latest` flag is there because **AL2023 locks the repository version to the release the image was built from** ([Deterministic upgrades through versioned repositories on AL2023](https://docs.aws.amazon.com/linux/al2023/ug/deterministic-upgrades.html)). Without it, an older image cannot see the fixed `ca-certificates`.

In my local build, the certificate count dropped from 143 to 140. The Amazon roots remained, and TLS verification to the X-Ray endpoint still succeeded. Getting this into production, however, took many steps.

- Create a place for the custom image (an ECR repository)
- Add build and push steps to the application's deploy workflow
- Switch the image in the task definitions. If you apply before the image is pushed, new tasks cannot pull it and will not start (even with `essential = false` on the sidecar, a failed pull keeps the task from starting)
- The base image also contained what looked like a leftover build artifact with the same bundle (`/tmp/ca-bundle.crt`), which image scanning kept flagging. It had to be overwritten too
- Remove all of this once upstream ships a fix

### Option 2: Update `ca-certificates` at build time

The CodeBuild standard image `amazonlinux-aarch64-standard:3.0` (AL2023) also still had the same root. This one is distro-based, so it can be updated in the buildspec `install` phase.

```yaml
version: 0.2
phases:
  install:
    commands:
      - dnf upgrade -y --releasever=latest ca-certificates
      - grep -q '^# ' /etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem
      - if grep -E '^# emSign ECC Root CA - G3$' /etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem; then exit 1; fi
```

The tricky part was **CodeBuild-hosted GitHub Actions runners**. Projects running as runners normally do not execute a buildspec. Adding a step to the job works, but you cannot add steps to a job that calls a reusable workflow. So I gave the runner project a buildspec and appended `-with-buildspec` to the `runs-on` label. This runs the `INSTALL` / `PRE_BUILD` / `POST_BUILD` phases ([Label overrides supported with the CodeBuild-hosted GitHub Actions runner](https://docs.aws.amazon.com/codebuild/latest/userguide/sample-github-action-runners-update-labels.html)).

```yaml
jobs:
  plan:
    runs-on: codebuild-my-runner-${{ github.run_id }}-${{ github.run_attempt }}-arm-3.0-small-with-buildspec
```

This option has its own downsides.

- Every build fetches from the package repository, which adds time and one more external dependency
- As noted above, **bundled stores such as AWS CLI v2 and certifi do not change**
- The workflows and labels to fix are scattered across repositories

### Option 3: Wait for the upstream fix and upgrade

This is the most straightforward option. But on October 28, I could not see a fixed CloudWatch Agent image and had no idea when one would ship. So I first worked on options 1 and 2. Then, **on October 29, we decided as a team response policy not to use custom-image workarounds and to wait for the upstream fix**.

Later, CloudWatch Agent `1.300074.1b2005` (the same digest as `latest` as of November 5) turned out to be fixed. The official CodeBuild image 26.10.30 also added `dnf -y upgrade --releasever=latest ca-certificates` to its Dockerfile ([the commit in aws/aws-codebuild-docker-images](https://github.com/aws/aws-codebuild-docker-images/commit/e2842e2)). CodeBuild switched to the fixed image while we kept specifying `:3.0`. On November 5, I inspected the CA bundle inside a job and confirmed that `emSign ECC Root CA - G3` was gone.

One thing I noticed: the RELEASE_NOTES list `1.300074.1` with the date October 27. When I checked on October 28, however, I could not find any tag newer than `1.300074.0b1920`. I have not been able to confirm whether the public image was published later than the release notes date or whether I simply missed it. Either way, I think it is safer to **check what is actually inside the image rather than relying on release notes alone**.

## Comparison

| Aspect | Option 1: Custom image | Option 2: Update ca-certificates | Option 3: Upgrade to official fix |
| --- | --- | --- | --- |
| Applies to | Anything, including scratch / distroless | Distro-based images only | Whatever upstream has fixed |
| Time to effect | Fast (you build it yourself) | Fast | Depends on upstream (10 days to just under two weeks after the report this time) |
| Amount of change | Large: ECR, build, deploy, task definitions | Scattered across buildspecs / workflows | Just a tag bump |
| Deployment ordering constraints | Yes (push the image → switch task definitions) | Almost none | None |
| Trusted certificate set | Replaced by AL2023's, drifts from upstream | Becomes the OS's | Stays upstream's |
| Bundled stores (botocore, etc.) | Depends on the image | Unchanged | Depends on upstream |
| Cleanup | Required (remove the custom image and pipeline) | Required (remove the no-longer-needed update step) | Not needed |

## Why I chose option 3

In the end I went with option 3 (upgrade to the official fix).

- **Upstream was fast**. Both the CloudWatch Agent (October 27 in the RELEASE_NOTES) and the official CodeBuild image (October 30 commit) were fixed within 10 days to just under two weeks of the report
- With a custom image, building it is the easy part. **Rolling it out and eventually removing it** is where the effort goes, and a wrong deployment order can keep tasks from starting
- Replacing the CA bundle with one from another distro makes the trusted set drift from what the vendor expects. This time I confirmed that the Amazon roots remained, but the drift itself becomes something new to investigate
- I sized the risk of waiting by looking at where the traffic goes. The compromised intermediates are revoked, but the Go agent does not check revocation, so while the root remained it could have accepted a forged certificate. On the other hand, its destinations are limited to AWS endpoints, and an attack would require a man-in-the-middle position on the network path. So I judged the waiting period acceptable
- I judged success not by "the tag was bumped" but by **the target roots being absent from the image's CA bundle**, with the pre-fix version alongside as a positive control

I closed all but one of the pull requests I had opened, including the ECR repository for the custom image, the Dockerfile, the task definition switch, and the `ca-certificates` update steps (one was still open at the time of writing). That work ended up being thrown away. Still, having it ready to ship if the upstream fix was delayed made it easier to decide to wait.

## Summary

- What was compromised were eMudhra's **intermediate CA keys**; trust stores responded by distrusting the roots (`emSign ECC Root CA - G3`, etc.)
- Browsers were protected the same day, but processes inside containers read **their bundled CA file**, so the images themselves need updating
- I identified what was affected in this order: list the images → group them by CA bundle source (OS / baked in / bundled with a language) → extract the layers and inspect the contents
- I got as far as opening pull requests for a custom image and for `ca-certificates` updates, but chose to upgrade to the fixed upstream images (CloudWatch Agent `1.300074.1b2005`, official CodeBuild image 26.10.30)
- Updating `ca-certificates` on AL2023 requires `--releasever=latest`
- Judge the fix by the contents of the image's CA bundle, not by release notes

I hope this helps.

## References

- [Bugzilla 2083449 - eMudhra: Private key compromise of Intermediate Certificates](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449)
- [NSS 3.131.1 release announcement (dev-tech-crypto)](https://groups.google.com/a/mozilla.org/g/dev-tech-crypto/c/vSxZxnOMMvs)
- [NSS 3.131.1 release announcement (oss-security)](https://www.openwall.com/lists/oss-security/2026/10/20/30)
- [RHSB-2026-012 Certificate compromise - eMudhra](https://access.redhat.com/security/vulnerabilities/RHSB-2026-012)
- [Amazon Linux Security Center - CVE-2026-113470](https://explore.alas.aws.amazon.com/CVE-2026-113470.html)
- [Advisory on compromised eMudhra intermediate certificates (Sectigo)](https://www.sectigo.com/resource-library/advisory-on-compromised-emudhra-intermediate-certificates)
- [Bug 2083709 - Remove eMudhra emSign Root CA - C1 and emSign ECC Root CA - C3 from NSS](https://bugzilla.mozilla.org/show_bug.cgi?id=2083709)
- [Bug 2084101 - Remove eMudhra emSign Root CA - G3 from NSS](https://bugzilla.mozilla.org/show_bug.cgi?id=2084101)
- [Bug 2089115 - Remove email trust and set TLS distrust-after to 2026-11-16 23:59:59 UTC for emSign Root CA - G1](https://bugzilla.mozilla.org/show_bug.cgi?id=2089115)
- [eMudhra to exit global SSL/TLS certificate business (eMudhra)](https://emudhra.com/en/press-release/emudhra-to-exit-global-ssl-tls-certificate-business)
- [GO-2026-6809 (Go vulnerability database)](https://pkg.go.dev/vuln/GO-2026-6809)
- [amazon-cloudwatch-agent RELEASE_NOTES (v1.300074.1)](https://github.com/aws/amazon-cloudwatch-agent/blob/v1.300074.1/RELEASE_NOTES)
- [aws/aws-codebuild-docker-images: Update Docker image versions for 26.10.30](https://github.com/aws/aws-codebuild-docker-images/commit/e2842e2)
- [Deterministic upgrades through versioned repositories on AL2023](https://docs.aws.amazon.com/linux/al2023/ug/deterministic-upgrades.html)
- [Label overrides supported with the CodeBuild-hosted GitHub Actions runner](https://docs.aws.amazon.com/codebuild/latest/userguide/sample-github-action-runners-update-labels.html)
- [Go release history](https://go.dev/doc/devel/release)
- [crypto/x509/root_linux.go](https://github.com/golang/go/blob/master/src/crypto/x509/root_linux.go)
- [crypto/x509/root.go](https://github.com/golang/go/blob/master/src/crypto/x509/root.go)
