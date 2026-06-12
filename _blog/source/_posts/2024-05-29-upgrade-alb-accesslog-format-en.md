---
title: New Fields Added to ALB Access Logs
date: 2024-05-29
lang: en
translation_id: upgrade-alb-accesslog-format
permalink: en/2024/05/29/upgrade-alb-accesslog-format/
cover: /img/cover/2024-05-29-upgrade-alb-accesslog-format.svg
category: AWS
---

Since 2024.05.22, running Athena queries against ALB access logs started returning empty rows.
Investigating the cause, it turned out that the following fields had been added to the ALB access logs, changing their format.

- traceability_id string
- unknown_fields string

Recreating the table resolved the issue.

* Note: We use partitioning for the ALB logs, so our table definition differs slightly from the [official](https://docs.aws.amazon.com/athena/latest/ug/application-load-balancer-logs.html) one.

```diff
CREATE EXTERNAL TABLE `<table name>`(
  `type` string COMMENT '',
  `time` string COMMENT '',
  `elb` string COMMENT '',
  `client_ip` string COMMENT '',
  `client_port` int COMMENT '',
  `target_ip` string COMMENT '',
  `target_port` int COMMENT '',
  `request_processing_time` double COMMENT '',
  `target_processing_time` double COMMENT '',
  `response_processing_time` double COMMENT '',
  `elb_status_code` string COMMENT '',
  `target_status_code` string COMMENT '',
  `received_bytes` bigint COMMENT '',
  `sent_bytes` bigint COMMENT '',
  `request_verb` string COMMENT '',
  `request_url` string COMMENT '',
  `request_proto` string COMMENT '',
  `user_agent` string COMMENT '',
  `ssl_cipher` string COMMENT '',
  `ssl_protocol` string COMMENT '',
  `target_group_arn` string COMMENT '',
  `trace_id` string COMMENT '',
  `domain_name` string COMMENT '',
  `chosen_cert_arn` string COMMENT '',
  `matched_rule_priority` string COMMENT '',
  `request_creation_time` string COMMENT '',
  `actions_executed` string COMMENT '',
  `redirect_url` string COMMENT '',
  `lambda_error_reason` string COMMENT '',
  `target_port_list` string COMMENT '',
  `target_status_code_list` string COMMENT '',
  `classification` string COMMENT '',
-  `classification_reason` string COMMENT ''
+  `classification_reason` string COMMENT '',
+  `traceability_id` string COMMENT '',
+  `unknown_fields` string COMMENT ''
)
PARTITIONED BY (
  `year` int COMMENT '',
  `month` int COMMENT '',
  `day` int COMMENT '')
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.RegexSerDe'
WITH SERDEPROPERTIES (
-  'input.regex' =
-        '([^ ]*) ([^ ]*) ([^ ]*) ([^ ]*):([0-9]*) ([^ ]*)[:-]([0-9]*) ([-.0-9]*) ([-.0-9]*) ([-.0-9]*) (|[-0-9]*) (-|[-0-9]*) ([-0-9]*) ([-0-9]*) \"([^ ]*) (.*) (- |[^ ]*)\" \"([^\"]*)\" ([A-Z0-9-_]+) ([A-Za-z0-9.-]*) ([^ ]*) \"([^\"]*)\" \"([^\"]*)\" \"([^\"]*)\" ([-.0-9]*) ([^ ]*) \"([^\"]*)\" \"([^\"]*)\" \"([^ ]*)\" \"([^\s]+?)\" \"([^\s]+)\" \"([^ ]*)\" \"([^ ]*)\"')
+  'input.regex' =
+        '([^ ]*) ([^ ]*) ([^ ]*) ([^ ]*):([0-9]*) ([^ ]*)[:-]([0-9]*) ([-.0-9]*) ([-.0-9]*) ([-.0-9]*) (|[-0-9]*) (-|[-0-9]*) ([-0-9]*) ([-0-9]*) \"([^ ]*) (.*) (- |[^ ]*)\" \"([^\"]*)\" ([A-Z0-9-_]+) ([A-Za-z0-9.-]*) ([^ ]*) \"([^\"]*)\" \"([^\"]*)\" \"([^\"]*)\" ([-.0-9]*) ([^ ]*) \"([^\"]*)\" \"([^\"]*)\" \"([^ ]*)\" \"([^\s]+?)\" \"([^\s]+)\" \"([^ ]*)\" \"([^ ]*)\" ?([^ ]*)?')
STORED AS INPUTFORMAT
  'org.apache.hadoop.mapred.TextInputFormat'
OUTPUTFORMAT
  'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'
LOCATION
  's3://<s3 bucket>/<lb name>/AWSLogs/<aws account id>/elasticloadbalancing/ap-northeast-1'
TBLPROPERTIES (
  'classification'='csv',
  'compressionType'='gzip',
  'projection.day.digits'='2',
  'projection.day.range'='01,31',
  'projection.day.type'='integer',
  'projection.enabled'='true',
  'projection.month.digits'='2',
  'projection.month.range'='01,12',
  'projection.month.type'='integer',
  'projection.year.digits'='4',
  'projection.year.range'='2020,2100',
  'projection.year.type'='integer',
  'storage.location.template'='s3://<s3 bucket>/<lb name>/AWSLogs/<aws account id>/elasticloadbalancing/ap-northeast-1/${year}/${month}/${day}',
  'typeOfData'='file')
```

That's all.
I hope you find this helpful.
