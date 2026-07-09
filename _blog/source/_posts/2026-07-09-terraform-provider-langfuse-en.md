---
title: I Built a Terraform Provider for Managing Langfuse Configuration
date: 2026-07-09
lang: en
translation_id: terraform-provider-langfuse
permalink: en/2026/07/09/terraform-provider-langfuse/
category: Terraform
cover: /img/cover/2026-07-09-terraform-provider-langfuse.svg
tags:
  - Terraform
  - Go
  - Langfuse
  - LLM
  - IaC
---

I built [kenzo0107/terraform-provider-langfuse](https://github.com/kenzo0107/terraform-provider-langfuse), a Terraform provider for managing [Langfuse](https://langfuse.com/) projects, members, prompts, and evaluation settings, and published it to the Terraform Registry. It covers 18 resources and 1 data source, letting you turn Langfuse admin-console configuration into code.

<!-- more -->

## Why I built this

Langfuse lets you click through project creation, member invitations, prompt management, and evaluation settings in the Web UI. But as the number of environments grows and you want configuration you can review as a diff, the UI alone starts to fall short in a few ways:

- Keeping settings consistent across multiple projects (dev / staging / production) is hard to do by hand
- There's no easy way to review who changed what via a pull request
- Project API keys, LLM connections, and custom model pricing end up managed outside the same IaC workflow you already use for other resources (e.g. AWS)

As of July 2026, Langfuse didn't offer an official Terraform provider, so I built one myself against the Langfuse Public API, implemented with the Terraform Plugin Framework.

[kenzo0107/terraform-provider-langfuse](https://github.com/kenzo0107/terraform-provider-langfuse)

## What it covers: resources and data sources

As of now it covers 18 resources and 1 data source.

### Projects and authentication

| Resource | Purpose |
|---|---|
| `langfuse_project` | Create and manage projects |
| `langfuse_project_api_key` | Issue project API keys (`secret_key` is only available at creation time) |

The `langfuse_project` data source lets you look up an existing project.

### Members and access management

| Resource | Purpose |
|---|---|
| `langfuse_organization_member` | Manage a member's role within the organization (`OWNER`/`ADMIN`/`MEMBER`/`VIEWER`) |
| `langfuse_project_member` | Manage a member's role within a project (the user must already be an organization member) |
| `langfuse_scim_user` | Manage users via SCIM (requires an organization-scoped API key with SCIM permissions) |

### Prompts and datasets

| Resource | Purpose |
|---|---|
| `langfuse_prompt` | Manage prompts. Each update creates a new version |
| `langfuse_dataset` | Manage datasets (the API doesn't support deletion, so destroy only removes it from Terraform state) |
| `langfuse_dataset_item` | Manage items within a dataset |

### Evaluation and scoring

| Resource | Purpose |
|---|---|
| `langfuse_score` | Record a score (all attributes are immutable; any change forces a re-create) |
| `langfuse_score_config` | Define scoring criteria (deletion is unsupported; destroy archives it instead) |
| `langfuse_evaluator` | Define an evaluator such as LLM-as-a-Judge (⚠️ uses Langfuse's unstable `/api/public/unstable/` API) |
| `langfuse_evaluation_rule` | A rule that applies an evaluator to traces (⚠️ also uses the unstable API) |
| `langfuse_annotation_queue` | An annotation queue for human review |
| `langfuse_annotation_queue_item` | A trace/observation added to a queue |
| `langfuse_comment` | A comment on a trace, observation, session, or prompt (the API doesn't support updating or deleting comments) |

### Integrations and cost tracking

| Resource | Purpose |
|---|---|
| `langfuse_llm_connection` | LLM connections used by the Playground / evaluations (OpenAI, Azure OpenAI, etc.) |
| `langfuse_blob_storage_integration` | Data export configuration to S3 / GCS, etc. (`access_key_id` / `secret_access_key` are write-only) |
| `langfuse_custom_model` | Custom model definitions for cost tracking (pricing and match pattern) |

## Usage

It's published on the Terraform Registry, so you can start using it right away by adding it to `required_providers`.

```hcl
terraform {
  required_providers {
    langfuse = {
      source  = "kenzo0107/langfuse"
      version = "~> 0.2"
    }
  }
}

provider "langfuse" {
  public_key = var.langfuse_public_key
  secret_key = var.langfuse_secret_key
  # host = "https://cloud.langfuse.com" # default if omitted; change for self-hosted
}

resource "langfuse_project" "example" {
  name = "my-project"
}

resource "langfuse_project_api_key" "example" {
  project_id = langfuse_project.example.id
  note       = "CI/CD pipeline key"
}
```

Authentication uses Basic Auth via `public_key` / `secret_key` (or the `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` environment variables). Changing `host` also lets you target a self-hosted instance.

## Implementation notes

- Implemented in Go 1.24 with the Terraform Plugin Framework
- `internal/provider/` holds the per-resource implementations; `langfuse/` is a separate HTTP client for the Langfuse Public API
- Documentation is auto-generated into `docs/` via `go generate` (tfplugindocs)
- CI runs `go build` and static analysis, plus `make testacc` (acceptance tests)

## A note on testing

I haven't written acceptance tests for `langfuse_organization_member`, `langfuse_project_member`, or `langfuse_scim_user`.

Depending on your Langfuse plan (e.g. Hobby), you may not be able to invite additional members to an organization at all, so I couldn't set up a state with multiple members and verify these resources against the real API. The CRUD implementations themselves just call the API as documented, but I want to be upfront that I haven't actually confirmed the full "invite another member → change role → remove" flow end to end.

If I get access to a higher-tier plan that allows inviting multiple members, I plan to add tests. If you try these resources and run into issues, please [open an issue](https://github.com/kenzo0107/terraform-provider-langfuse/issues).

## What I'd like to improve

- `langfuse_evaluator` / `langfuse_evaluation_rule` depend on the unstable API, so they'll need to track any changes Langfuse makes there
- Acceptance tests for the member-related resources, if a plan that allows it becomes available
- Cleaning up import support gaps (some, like `project_api_key`, are unavoidable due to API constraints)

## Summary

- I built a Terraform provider wrapping the Langfuse Public API and published it to the Terraform Registry
- It covers 18 resources and 1 data source, from projects and members to prompts, datasets, evaluation, and integrations
- The three member-invitation-related resources skip real-API acceptance tests due to plan limitations
- The source is public, so if you want to manage Langfuse configuration as code, give it a try

- Repository: [kenzo0107/terraform-provider-langfuse](https://github.com/kenzo0107/terraform-provider-langfuse)
- Terraform Registry: [registry.terraform.io/providers/kenzo0107/langfuse](https://registry.terraform.io/providers/kenzo0107/langfuse/latest)
