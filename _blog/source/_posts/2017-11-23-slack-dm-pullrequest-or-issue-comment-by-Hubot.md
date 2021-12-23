---
layout: post
title: Hubot で Git の Pull Request や Issue のコメントのメンション相手に Slack DM で通知
date: 2017-11-23
---

## 概要

Git での Pull Request や Issue コメントのメンションがメール通知で気づけず困った！
という声を多く聞き、メンション相手に Slack DM を通知する様な仕組みを作りました。


## システム概要

今回は AWS 上に構築しました。

* Git は GHE on EC2
    * github.com の場合だと、IP 定まらない問題があるかと思うので、動的に IP を取得して解放させる様な仕組みを入れる必要がありそう。
* hubot は t2.nano と最小
    * 当初、IBM Bluemix で構築してみましたが、サポートから IP 制限はまだできていない、とのことなので on AWS にしました。
* GHE からの hubot の受け口は ELB で EIP のみ許可させてます。
   * 今後、受け口を色々作る目的で ELB 立てました。
   * 元々は JIRA のメンションを Slack DM に送るだけの目的だったので 同一 Private Subnet に置いてました。

![](https://i.imgur.com/lAlhMpW.png)


## スクリプト

* getSlackUsernameByGitUsername
    * 基本 git name と slack name は命名規則が統一されていたので正規表現で変換させる様に解決しています。
    * git name: kenzo-tanaka だったら slack name: kenzo.tanaka に変換
    * 命名規則に即していないユーザは以下の `users` リストに変換を任せます。
         * `kimika.himura` は DM 送られたくないと言う人を想定してます。
* 依存ライブラリ
    *   "hubot-slack": "^4.4.0"
    *   "hubot-slack-attachement": "^1.0.1"

```
users = {
    "kenzo-tanaka": "kenzo0107",
    "kimika.himura": "no_send"
}
```


ソース全容は以下になります。

{% gist kenzo0107/d9f3618633d0243453bae7ab5ef5a1dd %}


## Git 設定

設定したい Organization or Owner > Settings > Hooks で hubot への URL を設定します。((Organization 跨いで一気に全部のリポジトリにHookかけるのは別途スクリプト組むなりしないと難しそう。GitHub社も Organization は 1つとすることを推奨とのことなので今回はこれで！))


その他設定

* Content type: `application/json`
* Let me select individual events:
    * Issues
    * Issue comment
    * Pull request
    * Pull request review
    * Pull request review comment

![](https://i.imgur.com/6lBkFAL.png)


※ よりセキュアにする際には Secret 設定してください。

## 通知が来た！

早速 Pull Request でメンションしてみたら通知が来ました！
絵文字もしっかり！
URL も自動でリンクされている！

![](https://i.imgur.com/5sxmFVO.png)


以上、参考になれば幸いです♪
