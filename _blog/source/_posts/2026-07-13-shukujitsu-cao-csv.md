---
title: Go 製祝日ライブラリ shukujitsu の取得元を Google Calendar API から内閣府 CSV に変更しました
date: 2026-07-13
lang: ja
translation_id: shukujitsu-cao-csv
cover: /img/cover/2026-07-13-shukujitsu-cao-csv.svg
categories:
- [Go]
tags:
- Go
- 祝日
- GitHub Actions
- CSV
---

自作の日本の祝日判定 Go ライブラリ [shukujitsu](https://github.com/kenzo0107/shukujitsu) の祝日データ取得元を、Google Calendar API から**内閣府公表の「国民の祝日」CSV**（一次ソース）に変更しました。
除外リストの手動保守と API キー管理から解放され、依存パッケージも大幅に減ったので、その顛末を書きます。

<!-- more -->

## shukujitsu とは

日付→祝日名のマップ（`shukujitsu.yml`）を `go:embed` で埋め込み、`IsHoliday(t)` / `HolidayName(t)` を提供するライブラリです。データは GitHub Actions の週次 cron で自動更新しています。

## Google Calendar API の何が困っていたか

変更前は Google Calendar の日本の祝日カレンダー（`ja.japanese#holiday@group.v.calendar.google.com`）から取得していましたが、以下の問題がありました。

- **祝日でない行事が混入する**。七夕・母の日・節分・クリスマスなどがカレンダーに含まれるため、除外リストを手で保守していた

```go
var excludedSummaries = map[string]bool{
    "銀行休業日": true, "節分": true, "雛祭り": true, "母の日": true,
    "七夕": true, "七五三": true, "クリスマス": true, "大晦日": true,
}
```

- `GOOGLE_CALENDAR_API_KEY` を GitHub Secrets で管理する必要がある
- `google.golang.org/api` 系の依存が重い
- データ範囲が Google 側の応答に依存する

内閣府が公表している [国民の祝日 CSV](https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv) は一次ソースそのものなので、行事の混入がなく除外リスト自体が不要になります。

## 実装

### Shift_JIS のデコード

内閣府 CSV は **Shift_JIS** です。`golang.org/x/text` の `transform.NewReader` でストリームデコードしてから `encoding/csv` でパースします。

```go
// fetchHolidays : 内閣府 CSV (Shift_JIS) を取得し、ヘッダー行を除いたレコードを返す
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

### 日付フォーマットの罠

CSV の日付は `2021/7/22` のような**ゼロ埋めなしのスラッシュ区切り**です。Go の time レイアウトは `"2006/1/2"` を使います（`"2006/01/02"` だとパースに失敗します）。

```go
for _, row := range rows {
    date, parseErr := time.Parse("2006/1/2", strings.TrimSpace(row[0]))
    if parseErr != nil {
        return fmt.Errorf("failed to parse date %q: %w", row[0], parseErr)
    }
    data[date.Format("2006-01-02")] = row[1]
}
```

### CI から Secrets を削除

GitHub Actions からは API キーの env が消え、`go run` するだけになりました。

```yaml
-      - name: auto update shukujitsu.yml by google calendar api
+      - name: auto update shukujitsu.yml from cao.go.jp csv
         run: |
           go run ./auto_update_holiday_dataset/main.go
-        env:
-          GOOGLE_CALENDAR_API_KEY: ${{ secrets.GOOGLE_CALENDAR_API_KEY }}
```

依存も `google.golang.org/api v0.97.0` + indirect 15個 → `golang.org/x/text` のみになり、go.sum が 675 行減りました。

## 変更に伴う挙動の違い（注意点）

- **祝日名の表記が変わりました**。振替休日・国民の休日は政府 CSV の表記に合わせて「休日」に統一されます（従来は「海の日 振替休日」のような Google カレンダー由来の詳細名）。`HolidayName` の返却文字列に依存している場合は破壊的変更に近い点です
- **データ範囲が変わりました**。過去方向は 1955年〜に大幅拡充、未来方向は政府が確定発表した年まで（従来 2030年 → 現時点で 2027年）になります

## まとめ

- 祝日データの取得元を一次ソース（内閣府 CSV）に変更し、除外リストの保守・API キー管理・重い依存から解放されました
- Shift_JIS デコードは `japanese.ShiftJIS.NewDecoder()`、日付パースはレイアウト `"2006/1/2"` がポイントです
- 祝日名の表記とデータ範囲が変わる点には注意が必要です

以上です。ご利用いただけますと幸いです。

- リポジトリ: [kenzo0107/shukujitsu](https://github.com/kenzo0107/shukujitsu)

## 参考

- [内閣府 国民の祝日について](https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html)
- [PR: 祝日データの取得元を内閣府CSVに変更](https://github.com/kenzo0107/shukujitsu/pull/13)
