---
title: The Subtleties of Date Arithmetic in JavaScript
date: 2022-10-31
lang: en
translation_id: js-get-a-last-month
permalink: en/2022/10/31/js-get-a-last-month/
cover: https://i.imgur.com/VbLapz4.png
---

Here's a quiz. What do you think the following code outputs when run?
The intent is to get the first day of the previous month.

```nodejs
let dt = new Date('2022-10-31T15:00:00+0900');
dt.setMonth(dt.getMonth() - 1);
dt.setDate(1)
console.log(dt); // => ?
```

<!-- more -->

The answer is `2022-10-01T06:00:00.000Z`.

One month before October 31 would be September 31, but since September only has 30 days, it rolls over to the next day, October 1.

To get the first day of the previous month, you need to call `setDate(1)` first.

```nodejs
let dt = new Date('2022-10-31T15:00:00+0900');
dt.setDate(1)
dt.setMonth(dt.getMonth() - 1);
console.log(dt); // => 2022-09-01T06:00:00.000Z
```

By the way, you can get the last day of the previous month by calling `setDate(0)`.

```nodejs
let dt = new Date('2022-10-31T15:00:00+0900');
dt.setDate(0);
console.log(dt); // => 2022-09-30T06:00:00.000Z
```

This was a problem I got a little stuck on when I noticed that on October 31, a Lambda function couldn't get the date one month earlier. The background is that I manage a simple Lambda script with Terraform, and I wanted to do the date calculation in Node.js with as few packages as possible.

That's all.
I hope this helps.
