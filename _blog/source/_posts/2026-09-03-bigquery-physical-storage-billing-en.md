---
title: Should You Switch BigQuery Storage to Physical Billing? Break-Even Points and Rules of Thumb
date: 2026-09-03
lang: en
translation_id: bigquery-physical-storage-billing
permalink: en/2026/09/03/bigquery-physical-storage-billing/
cover: /img/cover/2026-09-03-bigquery-physical-storage-billing.svg
categories:
- [Google Cloud]
- [Data Analytics]
tags:
- Google Cloud
- BigQuery
- Cost Optimization
- Terraform
- SQL
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

I switched a dataset's BigQuery storage billing model from LOGICAL to PHYSICAL and cut its storage cost by **68%** (from about $81/month to about $26/month).

But "how much will *we* save" is determined by compression ratio and region, so the **break-even point and the rules of thumb** are far more useful than my particular saving. That is what this post is about. I also built a calculator, so you can drop in the numbers for your own data.

Looking into it, the widely repeated rule that **physical billing wins above a 2x compression ratio** turns out to be specific to the US multi-region. The actual break-even ranges from **1.23x to 3.04x** depending on the region. For long-term storage in Tokyo (asia-northeast1) it is **1.63x** — considerably lower than most people assume.

*Note: this is based on research as of **September 3, 2026**. Rates are list prices retrieved from the Cloud Billing Catalog API and are subject to change.*

<!-- more -->

## Conclusion

| Question | Answer |
| --- | --- |
| Numbers you need | Just three: the **compression ratio** (logical ÷ physical), the **churn ratio** (how much time travel + fail-safe you carry), and the **region** |
| Break-even | "2x" applies only to the US multi-region. The real range is **1.23x–3.04x**; long-term in Tokyo is 1.63x |
| Ceiling on savings | `1 − break-even ÷ compression ratio`. Even at infinite compression you never reach 100% |
| The trap | PHYSICAL also meters time travel / fail-safe, so **a high compression ratio can still be a net loss if churn is large** |
| Data loss / performance impact | None. It only changes the metering configuration (explicitly stated in the docs) |
| Downsides | A 14-day re-change lock, and you cannot enroll at all if your organization holds legacy flat-rate slot commitments in the same region |

## The calculator

Enter the values you can pull from `INFORMATION_SCHEMA` and it computes the reduction, the saving, and the break-even point. List prices for 48 regions are embedded, retrieved from the Cloud Billing Catalog API.

**→ [BigQuery Physical Storage Billing Break-Even Calculator](/bigquery-physical-billing-calculator.html)**

The SQL for the inputs is on the calculator page too. It does exactly the same math described below.

## What determines the reduction

Here is what each model meters. The key point is that **PHYSICAL also bills time travel (7 days by default) and fail-safe (7 days) bytes**, which LOGICAL does not.

| | LOGICAL (default) | PHYSICAL |
| --- | --- | --- |
| Metered on | Uncompressed logical bytes | Compressed physical bytes |
| time travel / fail-safe | **Not billed** | **Billed** |

As a formula, the reduction comes down to just the compression ratio and the break-even point.

```
reduction = 1 − break-even ÷ effective compression ratio

  effective compression ratio = logical bytes ÷ (physical bytes + time travel + fail-safe)
  break-even = physical rate ÷ logical rate (compared within the same tier)
```

Note that time travel and fail-safe sit in the denominator. Even when the data body compresses well, heavy churn (writes and deletes) drags the effective ratio down and can push it below break-even.

## Break-even is not "2x"

Pulling every region's rates from the Cloud Billing Catalog API and computing the break-even (physical rate ÷ logical rate) gives this.

| Region | Break-even, long-term (90+ days) | Break-even, active |
| --- | --- | --- |
| me-central2 | **1.23x** | 1.73x |
| us-central1 / us-west1 / us-west8 | **1.25x** | 1.74x |
| us-east1 | 1.38x | 1.91x |
| us-east4 / us-west2 / northamerica-northeast1, etc. | 1.56x | 2.17x |
| **asia-northeast1 (Tokyo)** | **1.63x** | 2.26x |
| **US multi-region** | **2.00x** | 2.00x |
| EU multi-region | 2.20x | 2.20x |
| asia-east1 / asia-southeast1 / europe-north1 | 2.30x | 2.30x |
| southamerica-east1 | 2.19x | **3.04x** |

Three things stand out.

- **The "2x" figure is the US multi-region's.** It is also the only region where both tiers land on exactly 2.00x; everywhere else the two tiers have different break-even points
- **Single regions have a low long-term break-even.** 1.25x in us-central1, 1.63x even in Tokyo. Most analytics data clears that, so **if your data is mostly long-term, physical billing wins in the majority of regions**
- **Active has a higher break-even.** In that same Tokyo region, active is 2.26x. Look carefully at datasets still being updated that have not aged into the long-term tier

The break-even for all 48 regions is tabulated on the calculator page.

## Reduction by compression ratio

Applying `reduction = 1 − break-even ÷ ratio` (assuming all long-term storage and zero churn).

| Compression ratio | us-central1<br/>(1.25x) | asia-northeast1<br/>(1.63x) | US multi<br/>(2.00x) | EU multi<br/>(2.20x) |
| --- | --- | --- | --- | --- |
| 1.5x | 17% | costs more (-8%) | costs more (-33%) | costs more (-47%) |
| 2x | 38% | 19% | 0% (break-even) | costs more (-10%) |
| 3x | 58% | 46% | 33% | 27% |
| 4x | 69% | 59% | 50% | 45% |
| 6x | 79% | 73% | 67% | 63% |
| 10x | 88% | 84% | 80% | 78% |
| 20x | 94% | 92% | 90% | 89% |

Analytics data is columnar and compresses well, typically 3x–6x; data with lots of nested and repeated structure, such as GA4 exports, can reach 10x–20x. A handy rule of thumb: **around 4x you halve the cost**.

## How much money that is

The reduction *rate* does not depend on volume, but the **saving scales with it**. Expected monthly saving in the US multi-region, all long-term storage.

| Logical volume | 3x | 4x | 6x | 10x |
| --- | --- | --- | --- | --- |
| 100 GiB | $0.3 | $0.5 | $0.7 | $0.8 |
| 1 TiB | $3.4 | $5.1 | $6.8 | $8.2 |
| 10 TiB | $34 | $51 | $68 | $82 |
| 100 TiB | $341 | $512 | $683 | $819 |
| 1 PiB | $3,495 | $5,243 | $6,990 | $8,389 |

Storage is cheap to begin with, so **below a few TiB logical you are saving a few dollars a month** — worth weighing against the effort and the 14-day lock. Above 10 TiB the effect is unambiguous. My case was 8 TiB logical, or $55/month.

Note that the 10 GiB monthly free tier makes the real saving smaller than the table suggests for small datasets.

## Churn raises the break-even

This is the biggest trap. Because time travel and fail-safe bytes land in the denominator of the effective compression ratio, heavy churn effectively raises the bar.

Expanding with US multi-region rates:

```
reduction = 1 − (2 × long-term physical + 4 × churn) ÷ logical

  churn = time travel + fail-safe + active physical
```

The coefficient on churn is **4**, not 2. Time travel and fail-safe bytes are recent, so they are metered at the active physical rate — twice the long-term rate. And indeed, the billing data after the switch shows an `Active Physical Storage (US)` SKU at 0.13 GiB-month/day, which is exactly this churn. (That is inferred from billing data; I could not find an official statement naming the tier.)

Solving for break-even gives `body compression ratio = 2 + 4c`, where the **body compression ratio** is `logical ÷ long-term physical` (churn excluded) and `c` is the churn ratio `churn ÷ long-term physical`.

| Churn ratio `c` | Required body compression ratio |
| --- | --- |
| 0 | 2.0x |
| 0.1 | 2.4x |
| 0.25 | 3.0x |
| 0.5 | 4.0x |
| 1.0 | 6.0x |

As a concrete example, a dataset with **20 GiB logical / 5 GiB physical (a 4x body ratio) but 8 GiB of time travel and 6 GiB of fail-safe** has an effective ratio of only 20 ÷ 19 = **1.05x**, far below the 2.00x break-even — switching would make it **90% more expensive**. In my own investigation, a small dataset with daily updates came out at **+129%** in the estimate, so I excluded it from the switch.

In short, **the smaller and more frequently updated a dataset is, the more dangerous the switch**; large and append-only is where the win is safe.

For reference, here is what drives each factor.

| | Favorable (higher effective ratio) | Unfavorable |
| --- | --- | --- |
| Compression | Low-cardinality repeated strings, time series and logs, sparse columns with many NULLs, nested and repeated structures (GA4 etc.), rows ordered by clustering | UUIDs, hashes, encrypted columns, random values, already-compressed data stored as BYTES/STRING, high cardinality |
| Churn | Append-only, updates confined to specific partitions | Frequent UPDATE / DELETE / MERGE, full partition overwrites, daily CREATE / DROP, streaming inserts |

**The time travel window can be shortened from the default 7 days to 2 days** to reduce churn, but **fail-safe is fixed at 7 days and cannot be shortened**.

## How to decide: measure your own data

### Step 1: Enable `INFORMATION_SCHEMA.TABLE_STORAGE`

You cannot judge anything without physical byte counts, and it is disabled by default. Enable it per region.

```sql
ALTER PROJECT `my-project` SET OPTIONS (`region-us.enable_info_schema_storage` = TRUE);
ALTER PROJECT `my-project` SET OPTIONS (`region-asia-northeast1.enable_info_schema_storage` = TRUE);
```

This is a configuration change only and has no impact on existing workloads, but **statistics take about a day** to accumulate. Budget that as lead time for the decision.

### Step 2: Get compression ratio and churn per dataset

```sql
SELECT
  table_schema AS dataset,
  ROUND(SUM(total_logical_bytes)  / POW(1024,3), 1) AS logical_gib,
  ROUND(SUM(total_physical_bytes) / POW(1024,3), 1) AS physical_gib,
  ROUND(SAFE_DIVIDE(SUM(total_logical_bytes), SUM(total_physical_bytes)), 2) AS compression_ratio,
  ROUND(SAFE_DIVIDE(
    SUM(active_physical_bytes + time_travel_physical_bytes + fail_safe_physical_bytes),
    SUM(long_term_physical_bytes)), 3) AS churn_ratio
FROM `my-project.region-us.INFORMATION_SCHEMA.TABLE_STORAGE`
GROUP BY 1
ORDER BY logical_gib DESC;
```

Here is what I got (run separately per region).

| Region | Dataset | logical_gib | physical_gib | compression_ratio |
| --- | --- | --- | --- | --- |
| US | Clone of an external SaaS dataset | 8,095.0 | 1,296.3 | **6.2** |
| US | Others (under 1 GiB each) | - | - | 0.3–7.8 |
| asia-northeast1 | GA4 export (`analytics_<property_id>`) | 350.5 | 16.4 | **21.3** |
| asia-northeast1 | Same, other properties (~50 GiB total) | - | - | 12.6–26.1 |

It matters that you look **per dataset rather than per region**: mixed in were small datasets whose ratio was below 1x (small enough to ignore, so I did). `TABLE_STORAGE` is a per-region view, so you need one query per region.

### Step 3: Check churn including `deleted = true`, over several days

I got this wrong once. A point-in-time snapshot showed zero time travel physical bytes for the target dataset, so I concluded it was truly static data. Re-checking with `deleted = true` history included, there were temporary tables (`_bqc_*`) created and dropped daily, each drop generating roughly 0.14–0.33 GiB of time travel bytes.

```sql
-- Check churn including deleted = true history
SELECT
  table_schema AS dataset,
  ROUND(SUM(time_travel_physical_bytes) / POW(1024,3), 2) AS time_travel_gib,
  ROUND(SUM(fail_safe_physical_bytes)   / POW(1024,3), 2) AS fail_safe_gib,
  COUNTIF(deleted) AS deleted_tables
FROM `my-project.region-us.INFORMATION_SCHEMA.TABLE_STORAGE`
WHERE deleted OR time_travel_physical_bytes > 0
GROUP BY 1
ORDER BY time_travel_gib DESC;
```

The re-estimate put the added cost at about **$0.35/month** in total (0.6% of the expected $61/month saving), so the conclusion did not change. The lesson did: **never conclude "zero churn" from a single point-in-time snapshot**.

### Step 4: Confirm from primary sources that there is no data loss or functional impact

> "Changing your storage billing model only changes the metering configuration. It does not involve data migration, file format conversion, or any infrastructure changes. Your data is always stored in the same compressed physical format."
>
> "Changing this setting has no impact on query performance, latency, or integration with other applications, such as Looker."
>
> — [Dataset storage billing models](https://cloud.google.com/bigquery/docs/datasets-intro#dataset_storage_billing_models)

It states explicitly that this is **a metering configuration change only**, and that data is always stored in the same compressed physical format anyway. Existing write jobs, GA4 exports, and external reads via the Storage Read API are all unaffected.

### Step 5: Prerequisite — legacy flat-rate slot commitments

> "You can't enroll a dataset in physical storage billing if your organization has any existing legacy flat-rate slot commitments located in the same region as the dataset."

**You cannot enroll if legacy flat-rate slot commitments exist in the same region.** Since this is an org-level constraint, zero reservations in the target project is not sufficient — you have to check the other projects too.

## How to apply it

```sql
ALTER SCHEMA `my-project.region-us.my_dataset`
  SET OPTIONS (storage_billing_model = 'PHYSICAL');
```

For a Terraform-managed dataset it is a single attribute.

```hcl
resource "google_bigquery_dataset" "my_dataset" {
  dataset_id            = "my_dataset"
  location              = "US"
  storage_billing_model = "PHYSICAL"
}
```

Two operational caveats:

- It can take **up to 24 hours** to take effect
- After that, **you cannot change it again for 14 days**

I had originally believed the lock was 30 days; checking the official documentation, 14 days is correct. Either way, "switch it and roll back if it looks bad" is not immediately available, which is exactly why the up-front estimate matters.

## Corroborating with measured billing data

Rather than assuming "we switched, so it must be cheaper," I measured it with the [Cloud Billing export to BigQuery](https://cloud.google.com/billing/docs/how-to/export-data-bigquery).

Listing daily cost per SKU shows there are periods right after the switch that **must not be evaluated**.

- **Transition period**: after logical storage stops being metered and before physical storage starts, two or three days record almost nothing
- **Export lag**: the most recent days are still being aggregated. Check `MAX(export_time)` and exclude days that are not final

So I took windows consisting only of stable days on each side.

```sql
WITH daily AS (
  SELECT
    DATE(usage_start_time, "Asia/Tokyo") AS day,
    sku.description AS sku,
    SUM(cost) AS cost,
    SUM(usage.amount_in_pricing_units) AS pricing_units
  FROM `billing-project.cost.gcp_billing_export_v1_XXXXXX`
  WHERE project.id = "my-project"
    AND service.description = "BigQuery"
    AND sku.description LIKE "%Storage%"
    AND sku.description NOT LIKE "%Network%"   -- exclude egress SKUs
    AND (DATE(usage_start_time, "Asia/Tokyo") BETWEEN "2026-08-18" AND "2026-08-25"   -- before
      OR DATE(usage_start_time, "Asia/Tokyo") BETWEEN "2026-08-30" AND "2026-08-31")  -- after
  GROUP BY 1, 2
)
SELECT
  IF(day <= "2026-08-25", "1_before", "2_after") AS phase,
  sku,
  ROUND(AVG(cost), 1) AS cost_per_day,
  ROUND(AVG(pricing_units), 1) AS gib_month_per_day
FROM daily
GROUP BY 1, 2
HAVING cost_per_day > 0
ORDER BY 1, 3 DESC;
```

The key point is to **aggregate to one row per day in a CTE before taking `AVG`**. Averaging without that gives you the mean per billing row, which cannot be read as a daily cost (I got the magnitude wrong the first time because of this).

| Window | SKU | Metered amount (GiB-month/day) | Cost/day | Monthly |
| --- | --- | --- | --- | --- |
| Aug 18–25 (before) | Long Term **Logical** Storage | 261.1 | $2.61 | about **$81** |
| Aug 30–31 (after) | Long-Term **Physical** Storage | 41.7 | $0.83 | about **$26** |

- **About $55/month saved, a 68% reduction**
- The metered amount went from 261.1 to 41.7 GiB-month/day, so the **measured effective compression ratio is 6.26x** — essentially matching the 6.2x computed beforehand from `INFORMATION_SCHEMA`
- Feeding that into the formula: `1 − 2.01 ÷ 6.23 = 67.8%`, matching the measured 68%
- The time travel / fail-safe surcharge I was worried about was too small to show up in daily cost

The fact that the SKU **swapped** from `Long Term Logical Storage` to `Long-Term Physical Storage` is itself corroboration that the switch took effect. The asia-northeast1 datasets I did not switch stayed flat on logical storage, and Storage Read API egress showed no trend break either (expected — the billing model does not affect egress).

It is worth checking the live setting as well.

```sql
SELECT schema_name, option_name, option_value
FROM `my-project.region-us.INFORMATION_SCHEMA.SCHEMATA_OPTIONS`
WHERE option_name = "storage_billing_model";
```

This view **only lists datasets that are on PHYSICAL**. A region you have not touched returns zero rows, so zero rows means "not configured" (i.e. the default LOGICAL).

## Gotchas

- **Don't apply "2x" to every region.** Outside the US multi-region the break-even differs, and it differs by tier (active vs. long-term) too
- **A high compression ratio can still be a net loss under heavy churn.** Don't switch small, frequently updated datasets
- **Don't conclude "zero churn" from a point-in-time snapshot.** Including `deleted = true` revealed daily temporary tables generating time travel bytes
- **`INFORMATION_SCHEMA.TABLE_STORAGE` is disabled by default**, and statistics take about a day after enabling
- **The billing export is not final for the most recent days.** Including them without checking `MAX(export_time)` overstates the saving
- **Some days right after the switch record almost nothing.** Don't average across the transition; cut separate windows of stable days
- **The 14-day re-change lock** (not 30 days). You cannot operate on the assumption that you can roll back

## Summary

- The reduction is entirely `1 − break-even ÷ effective compression ratio`. Volume affects only the dollar amount
- **Break-even is not fixed at 2x — it ranges from 1.23x to 3.04x.** The US multi-region is 2.00x; long-term in Tokyo is 1.63x. **If your data is mostly long-term, physical billing wins in most regions**
- As a rule of thumb, **4x compression roughly halves the cost**, and 6x cuts it to about a third. Analytics data lands at 3x–6x; nested structures like GA4 can hit 10x–20x
- But PHYSICAL meters time travel / fail-safe at the active rate, and **a churn ratio of 0.5 pushes the required ratio from 2x to 4x**. Leave small, high-churn datasets alone
- The switch is a metering configuration change only: no data migration, no performance impact, no impact on existing integrations. The only constraints are the 14-day lock and legacy commitments in the organization
- You can estimate your own case with the [calculator](/bigquery-physical-billing-calculator.html)

I hope this helps.

## References

- [Dataset storage billing models](https://cloud.google.com/bigquery/docs/datasets-intro#dataset_storage_billing_models)
- [Storage pricing](https://cloud.google.com/bigquery/pricing#storage)
- [TABLE_STORAGE view](https://cloud.google.com/bigquery/docs/information-schema-table-storage)
- [SCHEMATA_OPTIONS view](https://cloud.google.com/bigquery/docs/information-schema-schemata-options)
- [Export Cloud Billing data to BigQuery](https://cloud.google.com/billing/docs/how-to/export-data-bigquery)
- [Cloud Billing Catalog API](https://cloud.google.com/billing/docs/reference/rest/v1/services.skus/list)
- [google_bigquery_dataset](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/bigquery_dataset)
