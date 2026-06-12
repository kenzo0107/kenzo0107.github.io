---
layout: post
title: "Things You Can't Ask About Now: How to Read CPU and Memory Utilization"
date: 2016-08-10
category: Infrastructure
lang: en
translation_id: how-to-see-cpu-memory-utili
permalink: en/2017/08/10/how-to-see-cpu-memory-utili/
tags:
  - Linux
cover: https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170810/20170810140724.png
---

I couldn't hold back my feelings and gave this a rather cliché title.

To identify bottlenecks when monitoring server load, I'd be more than happy if you used this article as a tutorial to actually get your hands dirty, see things for yourself, and solve the problem.

## The Server Is Hard to Connect To

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170810/20170810141554.png" width="100%">
</div>

- You type a URL into your browser to access a site, but the page won't display
- The API times out

When situations like the above occur, something unusual is surely happening in your monitoring graphs.

Based on those monitoring graphs, we check the load condition that shows signs of the connectivity trouble and work to identify the bottleneck.

In what follows, to understand the underlying principles as much as possible, I'll proceed mainly using the CLI.

## Putting CPU Load on the Server

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170810/20170810142151.jpg" width="100%">
</div>

As a tool for putting load on the CPU, I borrowed the script from [Examining in Detail the Relationship Between Linux I/O and CPU Load and Load Average](http://qiita.com/kunihirotanaka/items/21194f77713aa0663e3b).
*Thank you, President @kunihirotanaka!*

- loadtest.pl <arg1> <arg2>
  - arg1: number of processes to run in parallel
  - arg2: determines whether to run a program that makes system calls

```perl
#!/usr/bin/perl

my $nprocs = $ARGV[0] || 1;
for( my $i=0; $i<$nprocs; $i++ ){
    my $pid = fork;
    die $! if( $pid < 0 );
    if( $pid == 0 ){
        while(1){
            if( $ARGV[1] ){
                open(IN, ">/dev/null");
                close(IN);
            }
        }
    }
}
wait;
```

Put CPU load on to bring the load average close to 2.

```
$ chmod +x ./loadtest.pl
$ ./loadtest.pl 2
```

## Commands for Checking CPU Usage

- Real-time monitoring → `top`, `vmstat`
- Historical check → `sar`

### Real-time Monitoring

#### Getting an Overview with `top`

```sh
$ top
```

```sh
top - 12:12:39 up 592 days, 18:55,  4 users,  load average: 1.97, 1.13, 0.46
Tasks: 125 total,   3 running, 122 sleeping,   0 stopped,   0 zombie
Cpu(s): 99.7%us,  0.2%sy,  0.0%ni,  0.0%id,  0.0%wa,  0.0%hi,  0.0%si,  0.2%st
Mem:   1020052k total,   943132k used,    76920k free,   144136k buffers
Swap:  2097148k total,   466724k used,  1630424k free,   410784k cached

  PID USER      PR  NI  VIRT  RES  SHR S %CPU %MEM    TIME+  COMMAND
29955 mameko_d  20   0 25196  520  184 R 99.9  0.1   4:04.91 loadtest.pl
29956 mameko_d  20   0 25196  516  180 R 99.5  0.1   4:04.86 loadtest.pl
24534 apache    20   0  425m  25m 7480 S  0.3  2.6   1:42.63 httpd
    1 root      20   0 19232  412  224 S  0.0  0.0   0:01.77 init
...
...
```

From the results above:

- The load average is rising
- From `%CPU` and `COMMAND`, the cause of the rise is `loadtest.pl`

As a temporary remedy, you can stop the load by killing this process.

```sh
$ kill -9 6528
$ kill -9 6529
```

If killing a process mid-execution would cause inconsistencies, you need to consider an appropriate response depending on the situation, such as separately considering adding more CPU.

#### Displaying the Top 10 by CPU Usage

```sh
$ ps ax --sort=-%cpu -o command,pid,pid,%cpu|head -n 11
```

*The reason for `-n 11` is that the first line contains the column names.*

```sh
COMMAND                       PID   PID %CPU
```

#### Looking at the Graph

Let's check this to cross-verify the conclusions we've drawn so far from the CLI.

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170810/20170810121609.png" width="100%">
</div>

- Load rises from around 12:07

* loadavg5 spikes
* CPU user spikes. CPU system has not risen that much.
  → An application process is consuming the CPU.
* memory is not being consumed

Unlike the top command, you can't tell from the graph alone which process is the cause. You access the server and identify the cause by investigating the logs from around 12:07.

##### Supplementary Note

By the way, when PHP is used as an Apache module, `httpd` is displayed in `COMMAND`. Since `fluentd` runs on ruby, it shows as `ruby`.

> PID USER PR NI VIRT RES SHR S %CPU %MEM TIME+ COMMAND
> 12376 apache 20 0 833m 115m 19m S 2.4 3.1 0:03.52 httpd
> 1455 td-agent 20 0 461m 74m 0 S 1.2 2.0 1098:30 ruby

#### Checking CPU Usage with `vmstat`

Output once per second.

```sh
$ vmstat 1

procs -----------memory---------- ---swap-- -----io---- --system-- -----cpu-----
r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
0  0 515396  80756  37120 220320    0    0    12     2    0    0  0  0 100  0  0
0  0 515396  80756  37120 220320    0    0     0     0  110  200  0  0 100  0  0
0  0 515396  80756  37120 220320    0    0     0     0  103  205  0  0 100  0  1
0  0 515396  80632  37120 220320    0    0     0     0  121  212  0  0 99  0  0
0  0 515396  80632  37120 220320    0    0     0     0  114  216  0  0 100  0  0
2  0 515328  80648  36944 220432    0    0     0     0 2092  237 100  0  0  0  0
2  0 515328  80648  36944 220432    0    0     0     0 2071  224 100  0  0  0  0
2  0 515328  81020  36952 220432    0    0     0     0 2162  381 100  1  0  0  0
2  0 515328  80896  36952 220432    0    0     0     0 2164  266 100  0  0  0  0
2  0 515328  80756  36952 220432    0    0     0     0 2139  308 100  0  0  0  0
2  0 515328  80772  36952 220432    0    0     0     0 2111  237 100  0  0  0  0
2  0 515328  80772  36952 220432    0    0     0     0 2087  238 100  0  0  0  0
2  0 515328  80772  36952 220432    0    0     0     0 2077  237 100  0  0  0  0
2  0 515328  80772  36952 220432    0    0     0     0 2076  232 99  1  0  0  0
2  0 515328  80772  36952 220432    0    0     0     0 2078  235 100  0  0  0  0
2  0 515328  80904  36952 220432    0    0     0     0 2081  231 85  0  0  0 15
0  0 515328  81448  36952 220432    0    0     0     0  267  254  6  0 94  0  0
0  0 515328  81448  36952 220432    0    0     0     0  151  250  0  0 99  0  0
0  0 515328  81448  36952 220432    0    0     0     0  230  307  0  0 99  0  0
0  0 515328  81456  36952 220432    0    0     0     0  123  230  0  0 100  0  0
```

From the above, the following can be confirmed:

- While `./loadtest.pl 2` is running, `procs r (running processes) = 2`
- `cpu us` is 100% and `cpu id` is 0%
  - `cpu id` has disappeared, and the program is eating up 100% of the CPU
- `system in` (number of interrupts) and `system cs` (number of context switches) increase
  - Context switching itself consumes CPU and raises the system load

#### Historical Check

```sh
$ sar -u -s 21:00:00 -e 22:10:00 -f /var/log/sa/sa31

21:00:01      runq-sz  plist-sz   ldavg-1   ldavg-5  ldavg-15
21:10:01            0       200      0.00      0.04      0.07
21:20:01            0       203      0.00      0.00      0.01
21:30:01            0       203      0.00      0.00      0.00
21:40:01            0       211      0.00      0.03      0.00
21:50:01            0       210      0.65      0.82      0.37
Average:            0       205      0.13      0.18      0.09
```

The sar command is handy because you can go back and check the past.

##### Each Item in the `sar -q` Output

| _Item_   | _Explain_                                                                                                                                                                     |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| runq-sz  | The number of kernel threads waiting in memory to be run on the CPU.<br/>Normally this value is less than 2.<br/>If the value is consistently greater than 2, the system may be reaching the limit of its CPU |
| plist-sz | The number of processes and threads in the process list                                                                                                                       |
| ldavg-1  | The load average over the past 1 minute                                                                                                                                       |
| ldavg-5  | The load average over the past 5 minutes                                                                                                                                      |
| ldavg-15 | The load average over the past 15 minutes                                                                                                                                     |

#### CPU Load Involving System Calls

Put CPU load on to bring the load average close to 2 while also making system calls.

```
$ ./loadtest.pl 2 1
```

#### Monitoring with vmstat

```sh
$ vmstat 1

procs -----------memory---------- ---swap-- -----io---- --system-- -----cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 0  0 597832 886856   3808  34844    0    0    12     2    0    0  0  0 100  0  0
 1  0 597828 886856   3808  34908    0    0     0     0  134  233  1  0 99  0  0
 0  0 597788 886684   3944  34876   20    0   156     0  238  307  1  1 96  4  0
 0  0 597788 886684   3944  34904    0    0     0     0  109  219  0  0 100  0  0
 2  0 597756 884044   3956  36296   96    0  1500     0 1075 1274 18 26 41 15  0  ← loadtest.pl 2 1 execution start
 2  0 597756 884044   3956  36296    0    0     0     0 2080 2265 42 58  0  0  0
 2  0 597756 884076   3956  36296    0    0     0     0 2083 2458 41 60  0  0  0
 2  0 597756 884200   3964  36292    0    0     0    32 2103 2458 42 59  0  0  0
 2  0 597756 884200   3964  36296    0    0     0     0 2079 2588 41 60  0  0  0
 3  0 597756 883952   3964  36296    0    0     0     0 2080 2209 40 60  0  0  1
 2  0 597756 884216   3964  36296    0    0     0     0 2085 2395 42 58  0  0  0
 2  0 597756 884216   3964  36296    0    0     0     0 2061 2399 43 57  0  0  0
 3  0 597756 884092   3964  36296    0    0     0     0 2061 1991 44 57  0  0  0
 2  0 597756 884216   3964  36296    0    0     0     0 2059 2333 42 58  0  0  1
 2  0 597756 884216   3964  36296    0    0     0     0 2058 2211 42 58  0  0  1
 2  0 597756 884092   3964  36296    0    0     0     0 2058 2461 43 58  0  0  0
 2  0 597756 883844   3964  36296    0    0     0     0 2059 2641 42 58  0  0  0
 2  0 597756 884216   3964  36296    0    0     0     0 2158 2715 42 59  0  0  0    ← loadtest.pl 2 1 execution end
 0  1 597744 884588   3964  36364   44    0   144     0 1995 2313 37 58  3  2  0
 0  0 597724 884388   3964  36524  208    0   380     0  173  239  0  1 95  5  0
 0  0 597724 884388   3964  36568    0    0     0     0  102  196  0  0 100  0  0
 0  0 597636 884388   3964  36568    0    0     0     0  102  203  0  0 100  0  0
 0  0 597636 884512   3964  36568    0    0     0     0  104  195  0  0 100  0  1
```

- Because loadtest.pl makes many system calls, `cpu sy` rises.

#### Looking at the Graph

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170810/20170810123318.png" width="100%">
</div>

- Load spikes from around 12:25
- loadavg5 spikes
- Both CPU user and system spike. The proportion of system is larger.
  → An application process involving system calls is consuming the CPU.
- memory is not being consumed

### Examples of Responses

- Identifying where the application is using CPU
  - Introduce APM (Application Performance Management) such as datadog or NewRelic to extract and fix application bottlenecks
    - It costs money, but it's extremely useful
- Adding more CPU
- Killing the target application's process (the process kill from earlier)
  - e.g. when an aggregation job in the admin screen put load on the DB and affected the service, kill the aggregation process

## Putting Memory Load on the Server

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170810/20170810142217.jpg" width="100%">
</div>

- memorytest.pl

Configured to consume 20MB every second.

```
#!/usr/bin/perl

while(1){
    sleep 1;
    push @h  , 1 x 1024 x 1024 x 20
}
wait;
```

- Running the memory load

```
$ chmod +x ./memorytest.pl
$ ./memorytest.pl
```

## Commands for Checking Memory Usage

- Real-time → `top -a`, `free`
- Historical check → `sar`

### Checking Remaining Memory

#### Getting an Overview with `top`

```sh
$ top -a
```

Or, after running top, press Shift + m

> PID USER PR NI VIRT RES SHR S %CPU %MEM TIME+ COMMAND
> 6780 mameko_d 20 0 385m 362m 1212 S 5.3 36.4 0:01.88 memorytest.pl

From the results above:

- From `%MEM` and `COMMAND`, the cause of the rise is `memorytest.pl`

As a temporary remedy, just like with loadtest.pl, you can stop the load by killing the process.

```sh
$ kill -9 6780
```

#### Checking Remaining Memory with `free`

```sh
$ free

             total       used       free     shared    buffers     cached
Mem:       1020052     908664     111388        572      29764     204492
-/+ buffers/cache:     674408     345644
Swap:      2097148     517696    1579452
```

Running it several times, you'll gradually see the `Mem` values:

- `used` rises
- `free` decreases
- pulled down by the decreasing free, `buffers` and `cached` decrease

##### Each Item in the `free` Output

- Mem: physical memory
- Swap: virtual memory

| _Item_  | _Explain_                                                                                                               |
| ------- | ----------------------------------------------------------------------------------------------------------------------- |
| shared  | Memory for regions that can be shared between processes                                                                |
| buffers | Memory used for buffers<br/>Memory used so that, when accessing I/O, access goes through a cache rather than going directly to I/O |
| cached  | Memory for the page cache<br/>When the application needs physical memory, the cached memory is discarded               |

#### Points to Check

From the result of the free command above, the freed memory is:

```
Mem free 111388 kB = 108 MB
```

You might be tempted to think `108 MB` is what's left, but normally, after memory is allocated to each process, the remainder is used for `buffer` and `cache` to reduce `disk I/O`, so buffer + cache are included as well.

##### Where Should You Actually Look for Remaining Memory?

`free` + `buffers` + `cached`
= 111388 + 29764 + 204492 kB
= 345644 kB
= 338 MB
= `-/+ buffers/cache free`

From the above, as a guide for remaining memory, check `-/+ buffers/cache free`, or check for thrashing.

##### How Can You Tell If Swapping Is Occurring?

Run `vmstat` and check whether thrashing is occurring.

##### How to Check for Thrashing

- If si (swap in from disk) and so (swap out to disk) occur frequently, thrashing is occurring
- If so is relatively high, there's a strong likelihood of memory shortage

```
$ vmstat 1

procs -----------memory---------- ---swap-- -----io---- --system-- -----cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 0  0 593244 211856   3704  34744    0    0     0     0  236  215  4  2 94  0  0
 1  0 593244 211876   3704  34744    0    0     0     0  144  216  1  0 98  0  0
 0  0 593244 160664   3704  34744    0    0     0     0  207  220  4  1 96  0  0
 0  0 593244 109328   3704  34744    0    0     0     0  227  226  4  2 94  0  0
 0  1 593052  58900   3704  33312    0    0     0     0  515  241  4  2 59 34  0
 0  1 618460  55144   1224  15220    0 25416     0 25416 39357  528  5 24 34 37  1  ← memorytest.pl line starts here
 0  1 670408  56644   1160  13732    0 51948     0 51948 37384  644  7 22 34 37  1
 1  1 671048  59256    456  12480    0  640     0   640  182  254  1  1 49 50  0
 0  0 735892  72040    436  10088    0 64844    96 64844 14559 1044  3 15 67 15  0
 0  0 786748  71436    436   9596    0 50856   124 50856 13678  745  4 13 69 14  1
 0  2 830880  63556    436   9504   32 44144   320 44144 15659  636  5 13 54 28  0
 0  3 849932  48976    436   8652  304 19168  1104 19168 6568  661  6  6 32 55  1
 0  1 900916  71564    776   8264   88 50992   560 50992 9549  706  1 10 27 62  0
 0  3 941292  64152   1308   9880   80 40380  2564 40380 10800  622  5 11 29 56  1
 0  1 993108  69908   1700  10656    0 51820  2024 51852 10208  848  5 12 43 40  1
 2  0 994168  71536   1700  10428    0 1060     0  1060  216  257  3  1 82 15  0
 0  0 1045720  71384   1700   9456    0 51552     0 51552 5356  789  2  9 77 12  1
 0  0 1096468  71468   1332   9012    0 50748     0 50748 15385  857  6 13 72  9  1
```

- bo (block out to device) ... blocks sent to the block device
- bi (block in from device) ... blocks received from the block device

#### Displaying the Top 10 by Physical Memory Usage (Resident Set Size)

```
$ ps ax --sort=-rss -o command,pid,ppid,vsz,rss|head -n 11
```

#### Looking at the Graph

<div style="text-align:center;">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/k/kenzo0107/20170810/20170810125452.png" width="100%">
</div>

- Memory spikes from around 12:35
- cached decreases, used increases

#### Examples of Responses

- Monitor at the process level
  - Introduce a monitoring tool such as datadog, mackerel, prometheus, or zabbix
- Adding more memory
- Killing the target application's process (the process kill from earlier)

# Disk I/O

## Checking I/O Disk Usage

```
$ sar -b -s 13:00:00 -e 14:00:00 -f /var/log/sa/sa31

13:00:01          tps      rtps      wtps   bread/s   bwrtn/s
13:10:01         0.28      0.01      0.27      0.11      2.90
13:20:01         0.28      0.00      0.28      0.05      2.99
13:30:01         0.22      0.00      0.22      0.00      2.30
13:40:01         0.24      0.00      0.24      0.00      2.50
13:50:01         0.23      0.00      0.23      0.03      2.35
Average:         0.25      0.00      0.25      0.04      2.61
```

#### Items in the `sar -b` Output

| _Item_  | _Explain_                                                          |
| ------- | ------------------------------------------------------------------ |
| tps     | The total number of transfers (I/O requests to the device) per second |
| rtps    | The total number of read I/O requests per second                  |
| wtps    | The total number of write I/O requests per second                 |
| bread/s | The total amount of data (in blocks) for read I/O requests per second |
| bwrtn/s | The total amount of data (in blocks) for write I/O requests per second |

#### Points to Check

- The mechanism by which I/O wait increases

```
Process memory consumption increases
↓
Memory can no longer be used for the cache
↓
Memory can no longer be used for Disk I/O
↓
Disk I/O increases
↓
The number of processes waiting on I/O increases
```

#### Countermeasures

- Check the memory usage and Swap

## Summary

Once you understand the principles behind why CPU and Memory utilization rise, monitoring feels completely different, and I really felt the graphs look entirely different.

In practice, you'll probably end up looking at things from the graphs. At that point, if you can picture how the numbers change when you run `top`, `vmstat`, and `sar`, it will be a big step forward in tracking down the cause.

That's all.
I hope this is even a little bit helpful.

## Reference

- [How to Read the vmstat Command](https://blogs.oracle.com/yappri/vmstat)
- [Pinning Down the True Nature of a Single Server's "Load"](http://tetsuyai.hatenablog.com/entry/20120105/1325750731)
- [Server Overload Countermeasures Even "Non-Engineers" Can Do: How to Investigate Load Average, CPU Utilization, I/O Disk Usage, and Memory Usage](https://media.accel-brain.com/server-overload-pattern/)
- [How to Explore the Cause of Server Load](http://beyondjapan.com/blog/2016/02/where-is-server-stress)
- [Linux Performance Measurements using vmstat](https://www.thomas-krenn.com/en/wiki/Linux_Performance_Measurements_using_vmstat)
- [Examining in Detail the Relationship Between Linux I/O and CPU Load and Load Average](http://qiita.com/kunihirotanaka/items/21194f77713aa0663e3b)

## Supplementary Notes

#### What Is Swap?

It indicates a state where the kernel detects and evicts memory that is barely being used.

1. Free memory is used for input/output buffers and cache
2. Furthermore, the least active parts are evicted from memory and pushed out to swap
3. They are repurposed from swap to buffers or cache

For this reason, don't panic just because swapping is occurring.

#### The Significance of Using Swap

Even when out of memory, you can continue computing by evacuating part of memory to disk. The mechanism that makes it look like memory is used up while still being usable is called `virtual memory`.

#### What Is Thrashing?

It's a phenomenon where a large amount of memory movement between physical memory and Swap occurs, delaying processing.

#### If You Don't Have the sar Command, Install It

```
// CentOS
$ yum install -y sysstat

// Ubuntu
$ apt-get install -y sysstat
```
