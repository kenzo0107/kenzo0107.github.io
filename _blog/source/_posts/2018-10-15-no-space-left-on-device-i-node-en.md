---
layout: post
title: How to Investigate "No space left on device" Caused by i-node Exhaustion
date: 2018-10-15
lang: en
translation_id: no-space-left-on-device-i-node
permalink: en/2018/10/15/no-space-left-on-device-i-node/
tags:
  - i-node
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20181015/20181015001102.jpg
---

A summary of how to deal with "No space left on device" when it happens on a Linux server.

<!-- more -->

## First, try df -h

Even with `df -h`, usage tops out at 77%.
This doesn't look like something that would cause `no space left on device`.

```sh
$ df -h

Filesystem      Size  Used Avail Use% Mounted on
udev            1.9G     0  1.9G   0% /dev
tmpfs           385M   40M  346M  11% /run
/dev/nvme0n1p1   15G   11G  3.3G  77% /
tmpfs           1.9G     0  1.9G   0% /dev/shm
tmpfs           5.0M     0  5.0M   0% /run/lock
tmpfs           1.9G     0  1.9G   0% /sys/fs/cgroup
tmpfs           385M     0  385M   0% /run/user/1022
tmpfs           385M     0  385M   0% /run/user/1128
tmpfs           385M     0  385M   0% /run/user/1098
tmpfs           385M     0  385M   0% /run/user/6096
```

`-h` = `--human-readable`, which displays sizes in a human-readable format.

## Try df -i

`df -i` displays i-node information. The maximum is 95%.
This was the culprit.

```sh
$ df -i

Filesystem     Inodes  IUsed  IFree IUse% Mounted on
udev           490419    351 490068    1% /dev
tmpfs          492742    521 492221    1% /run
/dev/nvme0n1p1 983040 927212  55828   95% /
tmpfs          492742      1 492741    1% /dev/shm
tmpfs          492742      3 492739    1% /run/lock
tmpfs          492742     16 492726    1% /sys/fs/cgroup
tmpfs          492742      4 492738    1% /run/user/1022
tmpfs          492742      4 492738    1% /run/user/1128
tmpfs          492742      4 492738    1% /run/user/1098
tmpfs          492742      4 492738    1% /run/user/1142
```

Wondering what an i-node is? Take a look at something like [the "Seems understandable" / "Not quite" / "Now I get it" IT glossary, i-node edition](https://wa3.i-3-i.info/word14802.html).

To put it simply, it's data that manages a file's attribute information.

In short, as the number of files grows, the data that manages those files grows too, and the number of i-nodes keeps increasing.

Here is a summary of how to investigate it.

## Investigate which directory has the most files

The following is a "ranking of directories by file count in the current directory."

```sh
sudo find . -xdev -type f | cut -d "/" -f 2 | sort | uniq -c | sort -r
```

* Note: find's `-xdev` option prevents it from searching mounted filesystems. `-type f` searches only files.

Use this one-liner to track down the directories with the most files that are causing the problem.

## If you have a hunch, run it in that directory

For example, when there is a separate directory per user, individuals might be running `git clone` in their home directory, or running `bundle install` so that the number of files under the `vendor` directory has exploded.

If something like that seems plausible, it's a good idea to run the one-liner under the `/home/` directory to investigate the cause.

If a particular user is the cause, you can also discuss it with them and confirm whether it's okay to delete!

## The quickest approach is to run it at the root path "/"

To find out which directory has the most files, it's easier to identify by running from the topmost level, "/" (root).

However, searching every file in every directory from root consumes a lot of CPU.
After you run it, there's an anxious wait while it doesn't respond for a while.

I recommend running it while monitoring the CPU situation with a command like `top`.

On a production web server, if there's a chance it will immediately affect users, you'll want to minimize the scope of impact, for example by temporarily pulling it out of the LB, or by running it during a time with low user access.

Proceed after assessing the situation.

## The actual cause of i-node exhaustion I encountered

Under the `/usr` directory, `linux-headers-***` files had piled up, eating up nearly 30%.

The following article saved me. Thank you.

[Notes on how to delete old kernels](https://qiita.com/ytkumasan/items/d6cc70f151f130d58e9b)

### Addendum 2020-07-02

Regarding deleting `linux-headers-***` files, you can remove unnecessary, unused files with the following command.

```
sudo apt autoremove
```

#### If you want to delete them automatically

```
// Install the automatic update package
$ sudo apt-get install -y unattended-upgrades

// Enable automatic updates
$ sudo dpkg-reconfigure -plow unattended-upgrades
Select Yes
```

Edit `/etc/apt/apt.conf.d/50unattended-upgrades` as follows to add a process that runs autoremove during unattended-upgrade.

```
sudo vim /etc/apt/apt.conf.d/50unattended-upgrades
```

```
//Unattended-Upgrade::Remove-Unused-Dependencies "false";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
```

Logs of automatic updates are output to `/var/log/unattended-upgrades/`.

That's all.
