---
title: 'LLM Observability Tools Compared: Langfuse vs Datadog LLM Observability'
date: 2026-06-11
categories:
  - [Monitoring]
  - [AI]
lang: en
translation_id: langfuse-vs-datadog-llm-observability
permalink: en/2026/06/11/langfuse-vs-datadog-llm-observability/
categories:
- [Monitoring]
- [AI]
tags:
  - LLM
  - Langfuse
  - Datadog
  - Observability
cover: https://i.imgur.com/0WWWDfD.png
---

I compared the LLM observability tools Langfuse and Datadog LLM Observability based on primary sources (official documentation and GitHub).

* Note: This article reflects research **as of June 11, 2026**. Both products evolve rapidly, so I recommend checking the latest official documentation before adopting either one.

<!-- more -->

## Conclusion

| What you prioritize | Recommendation |
|---|---|
| Data sovereignty (self-hosting, air-gapped environments), prompt management, OSS | **Langfuse** |
| Already using Datadog, ease of instrumentation, managed evaluations and security integration | **Datadog** |

Both share the same overall structure of "tracing + evaluation + security features," but the delivery models are contrasting.

- **Langfuse**: All core features are MIT-licensed OSS. Self-hostable with no usage limits
- **Datadog**: SaaS only. Its strengths are auto-instrumentation, managed evaluations, and integration with the existing Datadog stack (APM / logs / Sensitive Data Scanner)

* Note: Datadog is in the process of renaming "LLM Observability" to "**Agent Observability**" (as of June 2026).

## Comparison Table

| Aspect | Langfuse | Datadog |
|---|---|---|
| Deployment | Both self-hosted / Cloud, air-gap capable | SaaS only |
| License | Core is MIT (Enterprise features are commercial) | Proprietary |
| Tracing | Structured recording of prompts, responses, tokens, cost, and tool calls | Auto-instrumentation requires almost no code changes |
| Evaluation | LLM-as-a-Judge, experiments, datasets | Managed evaluations + 9 templates + Custom LLM-as-a-Judge |
| Prompt management | Yes (versioning, deployment) | Could not confirm |
| Guardrails | (No clear official documentation found) | Sensitive Data Scanner integration + AI Guard (Preview) |
| Integration with existing APM | Weak out of the box | Same stack as APM / logs / RUM |
| OpenTelemetry | OTLP ingestion supported (GenAI convention compliant) | Ingests GenAI convention spans directly (no SDK required) |
| Affinity with AWS | Self-host via official Terraform module, Bedrock / AgentCore integration | Bedrock auto-instrumentation, Bedrock Agents / SageMaker integration |

## Langfuse

### Pros

**1. All core features are MIT-licensed with unlimited usage**

Tracing, LLM-as-a-Judge evaluation, prompt management, experiments, datasets, annotations, and even the playground are provided under the MIT license. The GitHub README also explicitly states "MIT licensed, except for the ee folders."

**2. Self-hostable, works even in air-gapped environments**

The official documentation explicitly states it "runs anywhere from a laptop to an air-gapped cluster with no artificial usage limits," which suits requirements where data cannot leave the organization (healthcare, finance, etc.).

**3. Clearly provides prompt management**

It offers prompt management features including versioning and deployment, a differentiator that I could not confirm on the Datadog side in this research.

**4. LLM-specific tracing data model**

It records prompts, responses, token usage, latency, tool calls, and retrieval steps in a structured way. Cost / token tracking targets generation / embedding type observations.

### Cons

- **Enterprise features require a commercial license**: When self-hosting, SCIM, audit logs, data retention policies, etc. are not included in the OSS edition
- **Operational burden is on you**: In v3, you need to build and operate the infrastructure yourself, including ClickHouse and others
- **Unified operation with existing APM / log stacks is not available out of the box**

**References**:
- [Langfuse Open Source](https://langfuse.com/docs/open-source)
- [Langfuse Self-Hosting](https://langfuse.com/self-hosting)
- [Langfuse Pricing (Self-Host)](https://langfuse.com/pricing-self-host)
- [GitHub - langfuse/langfuse](https://github.com/langfuse/langfuse)

## Datadog LLM Observability (Agent Observability)

### Pros

**1. Auto-instrumentation requires almost no code changes**

It integrates with OpenAI, LangChain, AWS Bedrock, Anthropic, Vertex AI, and more, automatically capturing prompts / outputs, token usage and cost, latency, errors, and model parameters (temperature, etc.) — though the SDK still needs to be enabled.

**2. Multi-layered managed evaluations**

- Managed evaluations that can be enabled from the UI without code
- Custom LLM-as-a-Judge that lets you define evaluation logic in natural language
- 9 official templates (Hallucination, Prompt Injection, Toxicity, and the agent-oriented Tool Selection / Tool Argument Correctness, etc.)

Every evaluation is tied to an individual span, and you can review the input/output that the evaluation was based on directly within the trace.

**3. Integration with the existing Datadog stack**

The same Sensitive Data Scanner used for logs / APM / RUM can automatically detect and redact sensitive information in LLM input/output (bundling 1GB of SDS allocation per 10K requests). It also provides "Patterns," which performs automatic topic clustering of production traffic, and anomaly-detection Insights.

**4. The real-time guardrail "AI Guard"**

It claims to protect against prompt injection, jailbreaks, tool misuse, and sensitive data exfiltration (**in Preview stage**).

**5. Multi-language SDKs**

Supports Python (3.7+) / Node.js (16+) / Java (8+). It supports 7 span kinds — llm, workflow, agent, tool, task, embedding, retrieval — and automatic tracing of parent-child relationships.

### Cons

- **No self-hosting (SaaS only)**: Data is sent to Datadog. This is the biggest structural difference from Langfuse
- **Prompt management features could not be confirmed**: Features such as versioning and deployment could not be confirmed from the official documentation
- **Lock-in to the Datadog ecosystem**: Strengths such as evaluations, SDS, and Patterns presuppose a Datadog contract
- **AI Guard is in Preview**: The GA timing and billing are undetermined

**References**:
- [Datadog Agent Observability](https://docs.datadoghq.com/llm_observability/)
- [Evaluations](https://docs.datadoghq.com/llm_observability/evaluations/)
- [SDK Reference](https://docs.datadoghq.com/llm_observability/instrumentation/sdk/)
- [AI Guard](https://docs.datadoghq.com/security/ai_guard/)

## Pricing Comparison (as of June 2026)

### Langfuse Cloud

| Plan | Monthly | Included units | Overage | Data retention |
|---|---|---|---|---|
| Hobby | Free | 50k/month | None (hard cap) | 30 days |
| Core | $29 | 100k/month | From $8/100k | 90 days |
| Pro | $199 | 100k/month | From $8/100k | 3 years |
| Enterprise | $2,499 | 100k/month | From $8/100k | 3 years |

- The billing unit (unit) is **every trace data point, including traces, observations, and scores**
- Overage is tiered: $8/100k up to 1M, $7/100k from 1M to 10M, decreasing down to a minimum of $6/100k
- Self-hosting (OSS) is **unlimited and free** (only Enterprise features require a commercial license)

### Datadog LLM Observability (Agent Observability)

| Plan | Monthly | Included LLM spans | Data retention |
|---|---|---|---|
| Free | Free | 40k/month | 15 days |
| Pro | From $160 | 100k/month (pay-as-you-go for overage) | 15 days (extendable to 30/60/90 days for a fee) |

- The billing unit (LLM span) is **a single call to an LLM provider**. There is no separate charge for evaluations (Evals); LLM calls issued by an evaluation are also counted as LLM spans
- The Sensitive Data Scanner includes 1GB of usage per 10K requests in the usage fee
- The published unit price for overage is not stated on the pricing page, so confirm it at contract time

### Caveats when comparing

**Because the billing units differ, you cannot make a simple quantity-based comparison.** Langfuse counts observations and scores within a single trace individually, whereas Datadog counts only LLM calls. Even for the same application, the counts can vary significantly.

In addition, Langfuse incurs zero usage-based billing if you self-host (infrastructure costs are separate), whereas Datadog is SaaS only, so usage-proportional billing always applies.

**References**:
- [Langfuse Pricing](https://langfuse.com/pricing) / [Pricing (Self-Host)](https://langfuse.com/pricing-self-host)
- [Datadog Agent Observability](https://www.datadoghq.com/products/ai/agent-observability/)

## Affinity with OpenTelemetry

Conclusion: **Both can directly ingest traces based on the OTel GenAI semantic conventions, so affinity is high.** However, there are differences in coverage.

| Aspect | Langfuse | Datadog |
|---|---|---|
| OTLP ingestion | `/api/public/otel` (HTTP/JSON, HTTP/protobuf) | OTLP endpoint (http/protobuf + `dd-otlp-source=llmobs` header) |
| gRPC | Not supported | — |
| GenAI semantic conventions | Compliant (since the conventions are still evolving, `langfuse.*` attributes take priority) | Can directly ingest GenAI convention spans from OTel 1.37+ (no SDK / Agent required) |
| OTel-based instrumentation libraries | OpenLIT, OpenLLMetry, Arize, MLflow, etc. | OpenLLMetry v0.47+ supported / **OpenInference and OpenLLMetry below v0.47 not supported** |
| OTel Collector | Configuration examples available (filtering possible) | Datadog Distribution of OTel Collector (DDOT) available |
| Limitations | Trace-level attributes (userId, etc.) need to be propagated to all spans | Via OTel, trace display has a 3-5 minute delay, and may also be recorded in APM traces |

- Langfuse can send data from an OTel SDK / Collector with just environment variable configuration, and provides endpoints for the EU / US / **Japan** / HIPAA regions
- Datadog also supports Prompt Tracking, Experiments, and external evaluations via OTel. Since vendor-neutral instrumentation (OTel) can send to either, **instrumenting with OTel keeps the cost of switching in the future low**

**References**:
- [Langfuse OpenTelemetry Integration](https://langfuse.com/integrations/native/opentelemetry)
- [Datadog OTel Instrumentation for Agent Observability](https://docs.datadoghq.com/llm_observability/instrumentation/otel_instrumentation/)
- [Datadog Distribution of OTel Collector](https://docs.datadoghq.com/opentelemetry/setup/ddot_collector/)

## Affinity with AWS

Conclusion: **The approaches differ.** Langfuse has high affinity as "a stack you self-host on AWS," while Datadog has high affinity as "a SaaS that auto-instruments Bedrock."

### Langfuse

- **Official Terraform module** ([langfuse/langfuse-terraform-aws](https://langfuse.com/changelog/2025-05-22-terraform-modules)) officially supports self-hosting on AWS. It deploys a highly available configuration including VPC / RDS / S3 / ElastiCache on ECS Fargate (Langfuse Cloud itself also runs on ECS Fargate)
- **Amazon Bedrock instrumentation**: Via frameworks such as LangChain / LlamaIndex / Vercel AI SDK, or manual instrumentation using SDK decorators. It records token counts, model IDs, parameters, and errors
- **Bedrock AgentCore support**: Receives traces from the AgentCore runtime via OTel (requires disabling ADOT). It visualizes agent execution flows, tool calls, and MCP interactions
- For Bedrock connections within the platform internals (Playground / Evals), the **AWS SDK default credentials provider chain** (IAM roles, etc.) can be used

### Datadog

- **Bedrock auto-instrumentation**: Traces Bedrock Runtime SDK (boto3 / botocore) calls without code changes. The Java SDK also supports Bedrock
- **Bedrock Agents monitoring integration**: Automatically captures details of latency, error rate, token usage, and tool calls (also featured in the [official AWS blog](https://aws.amazon.com/blogs/machine-learning/monitor-agents-built-on-bedrock-with-datadog-llm-observability/))
- **SageMaker integration**: Metrics collection, visualization, and alerting for ML endpoints / jobs (part of the existing Datadog AWS integration)
- However, since the backend is Datadog SaaS, trace data is sent outside AWS (to Datadog)

**References**:
- [Deploy Langfuse on AWS with Terraform](https://langfuse.com/self-hosting/deployment/aws)
- [Langfuse - Amazon Bedrock](https://langfuse.com/integrations/model-providers/amazon-bedrock) / [Bedrock AgentCore](https://langfuse.com/integrations/frameworks/amazon-agentcore)
- [Datadog - Monitor agents built on Amazon Bedrock](https://www.datadoghq.com/blog/llm-observability-bedrock-agents/)
- [Datadog - Amazon SageMaker](https://www.datadoghq.com/blog/monitor-sagemaker-with-datadog/)

## Things to Note
- Datadog is in the middle of a rebrand, so documentation URLs and names may change

## Summary

- **Langfuse**: For teams that want to hold data sovereignty and cost control with OSS / self-hosting, and want to use it all the way through prompt management as a single solution
- **Datadog**: For teams that have already built a monitoring stack on Datadog and want to quickly use auto-instrumentation along with managed evaluations and security integration
