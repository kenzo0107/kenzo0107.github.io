---
layout: post
title: Hubot + Slack on Amazon Linux
date: 2016-01-13
tags:
- Hubot
- Slack
---

## Prerequisite

- Amazon Linux AMI 2015.09.1 (HVM), SSD Volume Type(t2.nano)
- npm 1.3.6
- hubot 2.17.0
- coffeescript 1.10.0

I use t2.nano released at December 2015.

## first to do.

- summarized in the following site.

[AWS EC2 Amazon Linuxインスタンス起動後、最初にやることまとめ](http://qiita.com/yangci/items/ef2ab9b6f0d28bad0881)


## Install npm

```
$ sudo yum install -y npm --enablerepo=epel

$ npm -v
1.3.6
```

## Install hubot, coffee-script, yo, generator-hubot

```
$ sudo npm install -g hubot coffee-script yo generator-hubot

$ hubot -v
2.17.0

$ coffee -v
CoffeeScript version 1.10.0
```

## create hubot

```
$ mkdir mybot
$ cd mybot
$ yo hubot

? ==========================================================================
We're constantly looking for ways to make yo better!
May we anonymously report usage statistics to improve the tool over time?
More info: https://github.com/yeoman/insight & http://yeoman.io
========================================================================== (Y/n) n
                     _____________________________
                    /                             \
   //\              |      Extracting input for    |
  ////\    _____    |   self-replication process   |
 //////\  /_____\   \                             /
 ======= |[^_/\_]|   /----------------------------
  |   | _|___@@__|__
  +===+/  ///     \_\
   | |_\ /// HUBOT/\\
   |___/\//      /  \\
         \      /   +---+
          \____/    |   |
           | //|    +===+
            \//      |xx|

? Owner (User <user@example.com>) tech@xxxxxxxx.jp
? Bot name (mybot) hubot
? Description xxxxxxx's hubot
? Bot adapter slack
...
...
hubot-maps@0.0.2 node_modules/hubot-maps

$ ls
Procfile   bin                    hubot-scripts.json  package.json
README.md  external-scripts.json  node_modules        scripts
```

### こんなエラーが出たときは

/root/.config へのアクセス権限がないと言われています。

```
Error: EACCES, permission denied '/root/.config'
    at Object.fs.mkdirSync (fs.js:654:18)
    at sync (/usr/lib/node_modules/yo/node_modules/configstore/node_modules/mkdirp/index.js:71:13)
    at Function.sync (/usr/lib/node_modules/yo/node_modules/configstore/node_modules/mkdirp/index.js:77:24)
    at Object.create.all.get (/usr/lib/node_modules/yo/node_modules/configstore/index.js:38:13)
    at Object.Configstore (/usr/lib/node_modules/yo/node_modules/configstore/index.js:27:44)
    at new Insight (/usr/lib/node_modules/yo/node_modules/insight/lib/index.js:37:34)
    at Object.<anonymous> (/usr/lib/node_modules/yo/lib/cli.js:156:11)
    at Module._compile (module.js:456:26)
    at Object.Module._extensions..js (module.js:474:10)
    at Module.load (module.js:356:32)
```

- 全権限付与

```
# mkdir /root/.config
# chmod -R 0777 /root/.config
```

上記で問題なくyo コマンドが通りました。ほっ(-o-)


- Initial setting hubot.

| *Item*       | *Value*                         |
| ------------ | ------------------------------- |
| Owner        | E-mail address                  |
| Bot name     | same the hubot integrated slack |
| Descriiption | -                               |
| Bot adapter  | slack                           |


![Imgur](http://i.imgur.com/AdyvxbZ.png)

## Install hubot-slack

```
$ sudo npm install hubot-slack --save
```

## modify external-scripts.json

```
$ echo '[]' > external-scripts.json

// confirm setting.
$ cat external-scripts.json
[]
```

## Add to bin/hubot
```
$ vim bin/hubot
```

- run hubot via port 80

```
#!/bin/sh

set -e

npm install
export PATH="node_modules/.bin:node_modules/hubot/node_modules/.bin:$PATH"

# add start
export HUBOT_SLACK_TOKEN=xoxb-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
export PORT=80
# add end

exec node_modules/.bin/hubot --name "hubot" "$@"
```

## creat hubot script

```
$ vim scripts/hello.coffee
```

save the belowing scripts as scripts/hello.coffee

```
# Description:
#   hubot basic command.
#
# Commands:
#   hubot who are you - I'm hubot!
#   hubot hello
#   hubot who am I - You are <user_name>
#   hubot what is this <*> - This is <$1>

module.exports = (robot) ->
  robot.respond /who are you/i, (msg) ->
    msg.send "I'm hubot!"

  robot.hear /HELLO$/i, (msg) ->
    msg.send "hello!"

  robot.respond /who am I/i, (msg) ->
    msg.send "You are #{msg.message.user.name}"

  robot.respond /what is this (.*)/i, (msg) ->
    msg.send "This is #{msg.match[1]}"
```

## run hubot

`sudo` is required and in order to access http port.
You will require hubot integrated with outside site - ex) JIRA etc...

```
$ sudo bin/hubot -a slack

[Wed Jan 13 2016 13:43:08 GMT+0900 (JST)] INFO Connecting...
[Wed Jan 13 2016 13:43:10 GMT+0900 (JST)] INFO Logged in as hubot of RUBY GROUPE, but not yet connected
[Wed Jan 13 2016 13:43:11 GMT+0900 (JST)] INFO Slack client now connected
```

- no sudo execution result ...(>_<)
Error occured!!

```
$ bin/hubot -a slack

[Wed Jan 13 2016 16:40:59 GMT+0900 (JST)] INFO Connecting...
[Wed Jan 13 2016 16:40:59 GMT+0900 (JST)] ERROR Error: listen EACCES
  at errnoException (net.js:905:11)
  at Server._listen2 (net.js:1024:19)
  at listen (net.js:1065:10)
  at net.js:1147:9
  at dns.js:72:18
  at process._tickCallback (node.js:442:13)

[Wed Jan 13 2016 16:41:00 GMT+0900 (JST)] INFO Logged in as hubot of RUBY GROUPE, but not yet connected
[Wed Jan 13 2016 16:41:02 GMT+0900 (JST)] INFO Slack client now connected
```

## Invite hubot at Slack

ex) botname=hubot

```
/invite @hubot
```

![Imgur](http://i.imgur.com/v3MK8VL.png)

## Input text at Slack

```
[me]    hubot hello
[hubot] hello!
```

![Imgur](http://i.imgur.com/in4XiYj.png)

---

# daemonize hubot

## Install forever

```
$ sudo npm install --save forever

$ forever --version
v0.15.1
```

## set path as not root user.

```
$ echo 'export PATH=$PATH:/home/<user>/mybot/node_modules/forever/bin' >> ~/.bashrc
$ source ~/.bashrc
```

- root user too.

```
// change to super user.
$ sudo su
# echo 'export PATH=$PATH:/home/<user>/mybot/node_modules/forever/bin' >> ~/.bashrc
# source ~/.bashrc
# echo $PATH
.......:/home/<user>/mybot/node_modules/forever/bin:......
```

## Modify bin/hubot

{% gist kenzo0107/c6c713835918c3a75159 %}



## daemonize start hubot - `sudo bin/hubot -a slack`

```
$ sudo bin/hubot start
```

## stop daemonized hubot

```
$ sudo bin/hubot stop
```

## restart hubot

```
$ sudo bin/hubot restart
```

## check forever list

```
$ sudo su
# forever list

info:    Forever processes running
data:        uid  command script                           forever pid   id logfile                 uptime
data:    [0] sICk coffee  node_modules/.bin/hubot -a slack 30494   30496    /root/.forever/sICk.log 0:0:5:35.399
```

## another way stop forever process

- check process. kill -9 process

```
$ ps aux | grep hubot | grep -v grep

root     31144  0.3  3.1 723820 32392 ?        Ssl  17:58   0:00 /usr/bin/node /home/hu/mybot/node_modules/forever/bin/monitor node_modules/.bin/hubot
root     31146  1.1  6.7 979588 69196 ?        Sl   17:58   0:00 node node_modules/hubot/node_modules/.bin/coffee /home/hu/mybot/node_modules/.bin/hubot -a slack

// kill forcibly process
$ sudo kill -9 31146
```

- another one.

```
# ps aux | grep hubot | grep -v grep | awk '{print "kill -9", $2}' | sh
```

Thanks.
