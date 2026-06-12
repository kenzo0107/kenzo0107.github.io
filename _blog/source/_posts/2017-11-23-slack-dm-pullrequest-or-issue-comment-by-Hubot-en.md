---
layout: post
title: Notifying Mentioned Users via Slack DM for Git Pull Request and Issue Comments with Hubot
date: 2017-11-23
lang: en
translation_id: slack-dm-pullrequest-or-issue-comment-by-Hubot
permalink: en/2017/11/23/slack-dm-pullrequest-or-issue-comment-by-Hubot/
cover: https://i.imgur.com/lAlhMpW.png
---

## Overview

I kept hearing complaints like "I missed a mention in a Git Pull Request or Issue comment because the email notification slipped by!"
So I built a mechanism that sends a Slack DM to the mentioned user.


## System Overview

This time I built it on AWS.

* Git is GHE on EC2.
    * In the case of github.com, there is the problem of IPs not being fixed, so it seems we would need a mechanism that dynamically obtains and releases IPs.
* Hubot runs on a minimal t2.nano.
    * Initially I tried building it on IBM Bluemix, but support told me that IP restrictions were not yet available, so I went with AWS.
* The entry point for Hubot from GHE is an ELB that only allows the EIP.
   * I set up the ELB with the intention of creating various entry points going forward.
   * Originally the sole purpose was to send JIRA mentions to Slack DMs, so it was placed in the same Private Subnet.

![](https://i.imgur.com/lAlhMpW.png)


## Script

* getSlackUsernameByGitUsername
    * Basically the git name and slack name followed a unified naming convention, so I resolve them by converting with a regular expression.
    * If the git name is kenzo-tanaka, it is converted to the slack name kenzo.tanaka.
    * Users that do not conform to the naming convention are left to the conversion in the `users` list below.
         * `kimika.himura` is assumed to be someone who does not want to receive DMs.
* Dependent libraries
    *   "hubot-slack": "^4.4.0"
    *   "hubot-slack-attachement": "^1.0.1"

```
users = {
    "kenzo-tanaka": "kenzo0107",
    "kimika.himura": "no_send"
}
```


The full source is below.

{% gist kenzo0107/d9f3618633d0243453bae7ab5ef5a1dd %}


## Git Configuration

Set the URL to Hubot under the Organization or Owner you want to configure, via Settings > Hooks. ((Applying a Hook to all repositories across Organizations at once seems difficult unless you write a separate script. Since GitHub also recommends having a single Organization, this is what I went with this time!))


Other settings

* Content type: `application/json`
* Let me select individual events:
    * Issues
    * Issue comment
    * Pull request
    * Pull request review
    * Pull request review comment

![](https://i.imgur.com/6lBkFAL.png)


* To make it more secure, please set a Secret.

## The notification arrived!

I immediately tried mentioning someone in a Pull Request, and the notification arrived!
The emoji came through perfectly too!
And the URL was automatically linked!

![](https://i.imgur.com/5sxmFVO.png)


That's all. I hope this is helpful to you!
