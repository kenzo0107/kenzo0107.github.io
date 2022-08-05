---
title: Lake Formation で生成される Python スクリプトが動作しないので修正した
date: 2022-08-05
category: AWS
---

<div class="toc">
<div class="toc-content">
<h3 class="menu-label">ToC</h3>
<!-- toc -->
</div>
</div>

---

## 概要

2022.08.02 時点、
Lake Formation blueprint incremental database で生成された Glue Workflow を実行すると異常終了する事象がありました。

## まず結論

最終的に修正されたスクリプトは以下に残しております。
対応内容はコミットログをご参照いただければと思います。

https://github.com/kenzo0107/aws-glue-jobs-incremental-database-etl

主な対応内容は以下の通りです。

1. [fix: TypeError: object of type 'filter' has no len()](https://github.com/kenzo0107/aws-glue-jobs-incremental-database-etl/commit/24e310258bc824cac981ea0bd65a18280aa39ca7)
2. [fix: TypeError: Strings must be encoded before hashing](https://github.com/kenzo0107/aws-glue-jobs-incremental-database-etl/commit/d023121709673fac768dbd2df85840e966a19955)
3. [fix: テーブルの suffix が重複する場合にテーブルが not found になる](https://github.com/kenzo0107/aws-glue-jobs-incremental-database-etl/commit/00112287a0deb5f85aeb3ba1c839271eb69fd4a3)

## まとめ

生成されたスクリプトについては AWS SA さんに共有しており
ゆくゆくご対応いただけるのではないかと思います。

以上
参考になれば幸いです。
