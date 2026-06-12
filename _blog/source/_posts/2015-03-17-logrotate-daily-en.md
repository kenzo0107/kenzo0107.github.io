---
layout: post
title: Configuring logrotate to Append a Daily Date to Log File Names, Set Retention Period, and Compress Old Files
date: 2015-03-17
category: Infrastructure
lang: en
translation_id: logrotate-daily
permalink: en/2015/03/17/logrotate-daily/
cover: /img/cover/2015-03-17-logrotate-daily.svg
---

## Overview
The default settings in /etc/logrotate.conf have the following inconveniences:

+ Log file names are given sequential numbers like error_log.1, which makes it hard to tell the actual date.
+ By default, logs are kept for only 4 weeks, so there is only about a month's worth of information. In some cases you simply cannot go back far enough to investigate.
+ Files are not compressed, so they take up disk space.

These make investigation very inconvenient.

When httpd is installed via yum, the initial logrotate.conf settings look like this:

{% gist kenzo0107/3bda46fdda5909660441 %}



### Append the date to log file names

Add the following line to /etc/logrotate.conf:

```
dateext
```


### Set the log retention period to half a year (53/2 weeks ≒ 27)

```
# keep 4 weeks worth of backlogs
rotate 27
```

* Since disk capacity may be a concern, please consider how large the logs will grow per month before deciding on these settings.


### Date

Compress old files

```
# uncomment this if you want your log files compressed
compress
```

{% gist kenzo0107/2385d66fee8a9a9671de %}




### Rotating Apache logs by date

{% gist kenzo0107/1fb1c44ffacbb08d518e %}


### The day after applying the settings

You can see that the output looks like this:

```
error_log-20150315.gz
error_log
```

<span style="color: #ff0000">If full-width characters are present in logrotate.conf, rotation may not work correctly, so please be careful.</span>
