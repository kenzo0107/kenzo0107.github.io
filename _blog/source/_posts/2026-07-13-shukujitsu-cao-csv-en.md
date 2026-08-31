---
title: Switching My Go Holiday Library shukujitsu from the Google Calendar API to Japan's Official Cabinet Office CSV
date: 2026-07-13
lang: en
translation_id: shukujitsu-cao-csv
permalink: en/2026/07/13/shukujitsu-cao-csv/
cover: /img/cover/2026-07-13-shukujitsu-cao-csv.svg
categories:
- [Go]
tags:
- Go
- Japanese Holidays
- GitHub Actions
- CSV
---

I switched the data source of [shukujitsu](https://github.com/kenzo0107/shukujitsu), my Go library for Japanese national holidays, from the Google Calendar API to the **official CSV published by Japan's Cabinet Office** (the primary source).
This freed me from maintaining a manual exclusion list and an API key, and slashed the dependency tree. Here's the story.

<!-- more -->

## What is shukujitsu?

A library that embeds a date-to-holiday-name map (`shukujitsu.yml`) via `go:embed` and provides `IsHoliday(t)` / `HolidayName(t)`. The data is auto-updated by a weekly GitHub Actions cron.

## What Was Wrong with the Google Calendar API

The library used to fetch from Google Calendar's Japanese holiday calendar (`ja.japanese#holiday@group.v.calendar.google.com`), which had these problems:

- **Non-holiday events leak in**. The calendar includes Tanabata, Mother's Day, Setsubun, Christmas and so on, so I maintained an exclusion list by hand:

```go
var excludedSummaries = map[string]bool{
    "銀行休業日": true, "節分": true, "雛祭り": true, "母の日": true,
    "七夕": true, "七五三": true, "クリスマス": true, "大晦日": true,
}
```

- A `GOOGLE_CALENDAR_API_KEY` had to be managed in GitHub Secrets
- The `google.golang.org/api` dependency tree is heavy
- The data range depended on whatever Google returned

The Cabinet Office's [national holiday CSV](https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv) is the primary source itself — no event noise, so the exclusion list disappears entirely.

## Implementation

### Decoding Shift_JIS

The Cabinet Office CSV is encoded in **Shift_JIS**. I decode the stream with `transform.NewReader` from `golang.org/x/text` before parsing with `encoding/csv`.

```go
// fetchHolidays : fetch the Cabinet Office CSV (Shift_JIS) and return records minus the header row
func fetchHolidays() ([][]string, error) {
	resp, err := http.Get(csvURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(transform.NewReader(resp.Body, japanese.ShiftJIS.NewDecoder()))
	if err != nil {
		return nil, err
	}

	r := csv.NewReader(bytes.NewReader(body))
	rows, err := r.ReadAll()
	if err != nil {
		return nil, err
	}
	if len(rows) < 2 {
		return nil, fmt.Errorf("unexpected csv format: %d rows", len(rows))
	}
	return rows[1:], nil
}
```

### The date format trap

Dates in the CSV look like `2021/7/22` — **slash-separated without zero padding**. The Go time layout must be `"2006/1/2"` (parsing fails with `"2006/01/02"`).

```go
for _, row := range rows {
    date, parseErr := time.Parse("2006/1/2", strings.TrimSpace(row[0]))
    if parseErr != nil {
        return fmt.Errorf("failed to parse date %q: %w", row[0], parseErr)
    }
    data[date.Format("2006-01-02")] = row[1]
}
```

### Removing Secrets from CI

The workflow no longer needs an API key — it just runs `go run`:

```yaml
-      - name: auto update shukujitsu.yml by google calendar api
+      - name: auto update shukujitsu.yml from cao.go.jp csv
         run: |
           go run ./auto_update_holiday_dataset/main.go
-        env:
-          GOOGLE_CALENDAR_API_KEY: ${{ secrets.GOOGLE_CALENDAR_API_KEY }}
```

Dependencies went from `google.golang.org/api v0.97.0` plus 15 indirect packages down to just `golang.org/x/text`, removing 675 lines from go.sum.

## Behavioral Changes (Caveats)

- **Holiday name strings changed**. Substitute holidays and citizens' holidays are now uniformly named 「休日」 following the government CSV (previously they had detailed Google-derived names like 「海の日 振替休日」). If you depend on the strings returned by `HolidayName`, this is close to a breaking change
- **The data range changed**. It now extends back to 1955 (previously from 2021), and forward only to the years officially confirmed by the government (2027 at the moment, previously 2030)

## Summary

- Switched the holiday data source to the primary source (Cabinet Office CSV), eliminating the exclusion list, the API key, and heavy dependencies
- Key points: decode with `japanese.ShiftJIS.NewDecoder()`, parse dates with layout `"2006/1/2"`
- Watch out for the changed holiday name strings and data range

I hope you find it useful.

- Repository: [kenzo0107/shukujitsu](https://github.com/kenzo0107/shukujitsu)

## References

- [Cabinet Office: National Holidays](https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html)
- [PR: Switch the holiday data source to the Cabinet Office CSV](https://github.com/kenzo0107/shukujitsu/pull/13)
