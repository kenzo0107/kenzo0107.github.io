---
title: I built a soccer tactics board that runs in the browser — to explain tactics to my kid
category: AI
date: 2026-06-12
lang: en
translation_id: soccer-tactics-board
permalink: en/2026/06/12/soccer-tactics-board/
cover: /img/cover/2026-06-11-soccer-tactics-board.svg
tags:
  - JavaScript
  - Canvas
  - 個人開発
  - サッカー
---

I built a soccer tactics board where you place players, save their movements one step at a time, and play it back as a smooth animation. It's a build-free HTML + pure JavaScript app that you can drop straight onto GitHub Pages.

Repository: [kenzo0107/soccer-tactics-board](https://github.com/kenzo0107/soccer-tactics-board)

<!-- more -->

## Why I built it — a physical board couldn't explain it

It started when I bought this book to explain soccer "formations" and "numerical superiority" to my kid.

{% affiliate "小学生から知っておくべきフットボールのフォーマット" "https://m.media-amazon.com/images/P/4862557732.jpg" "https://www.amazon.co.jp/exec/obidos/ASIN/4862557732/kenzo0107-22/" "https://hb.afl.rakuten.co.jp/ichiba/54d10c45.2c0cfeee.54d10c46.43e102da/?pc=https%3A%2F%2Fitem.rakuten.co.jp%2Fbookfan%2Fbk-4862557732%2F&link_type=hybrid_url&ut=eyJwYWdlIjoiaXRlbSIsInR5cGUiOiJoeWJyaWRfdXJsIiwic2l6ZSI6IjI0MHgyNDAiLCJuYW0iOjEsIm5hbXAiOiJyaWdodCIsImNvbSI6MSwiY29tcCI6ImRvd24iLCJwcmljZSI6MSwiYm9yIjoxLCJjb2wiOjEsImJidG4iOjEsInByb2QiOjAsImFtcCI6ZmFsc2V9" %}

The content is great, but when I tried to reproduce plays on a board, I found a physical (magnet-style) tactics board hard to use for the following reasons:

- **You can't move multiple players "simultaneously."** Even shifting magnets one at a time, you can't convey the "timing" of a phase where the passer, receiver, ball, and opposing defender all move at once.
- **You can't repeat the same movement over and over.** Once you break the shape, resetting to the initial positions is a hassle, so it's hard to answer "show me one more time."
- **No trace of the movement is left.** With a still image you can't fully follow which player ran where.

So I figured it would be nice to have a tool where, **if you save the positions step by step, a single play button moves everyone simultaneously, as many times as you want** — and that's the tactics board I built. It works with touch on a phone too, so I can show it to my kid right then and there.

## What kind of app is it

On a portrait-oriented field, you can freely place red-team and blue-team players, the ball, markers, and speech bubbles (commentary text).

Here's what it looks like when you actually play back a "2v1 (breaking through with numerical superiority)" tactic. The banner on the field is the current step, and the dotted arrows are the movement traces from the previous step.

<p align="center"><img src="https://i.imgur.com/kajriPz.gif" alt="2v1 tactic animation" width="320"></p>

Unlike a still magnet board, **all players and the ball move simultaneously**, and the dotted lines leave behind **who ran where**. Playback loops, so there's no need for "one more time."

## How to use it

### Launch

No build required. Just clone the repo and start a local HTTP server (it uses ES Modules, so open it over HTTP rather than via a `file://` direct open).

```bash
git clone https://github.com/kenzo0107/soccer-tactics-board.git
cd soccer-tactics-board
python3 -m http.server 8000
# Open http://localhost:8000/ in your browser
```

### 1. Place players and the ball

Place them from the vertical toolbar on the right of the screen.

| Button | Role |
|---|---|
| 🔴 +Red player | Add a red-team player |
| 🔵 +Blue player | Add a blue-team player |
| ⚽ +Ball | Add a ball |
| 🔘 +Marker | Add a cone / marker |
| 💬 +Speech bubble | Add a speech bubble with commentary text |
| 🗑 Delete | Delete the selected object |

You can move placed objects freely by dragging with the mouse (or touch on a phone). Tap a player to also edit their facing direction (triangle marker), jersey number, and name.

### 2. Save movements as steps

This is the heart of the app. With the **＋ (save step)** on the controller at the bottom, you record the entire arrangement at that instant as one frame.

1. Set the initial arrangement and save with **＋** (STEP 1)
2. Move players and the ball, then **＋** again (STEP 2)
3. Repeat this to build up the phase

| Button | Role |
|---|---|
| ＋ | Save the current arrangement as a new step |
| ✓ | Overwrite the displayed step with the current arrangement |
| − | Delete the displayed step |
| ◀ / ▶ | Go to the previous / next step |
| Slider | Jump to any step |

### 3. Play it back

Press **▶ Play** and it auto-plays, interpolating between the saved steps. Rather than teleporting from frame to frame, it accelerates and decelerates with `easeInOutQuad`, so it looks closer to how real players start and stop.

Even as players increase, like in a 3v2, everyone moves at once.

<p align="center"><img src="https://i.imgur.com/JGC6KKE.gif" alt="3v2 tactic animation" width="320"></p>

If you place speech bubbles on each step, you can leave the **coaching intent** alongside it too — "draw the defender in here," "pass into the open space." Here's what it looks like when you play back a training drill (a 9-step 2v1 training session).

<p align="center"><img src="https://i.imgur.com/5sTp9h8.gif" alt="2v1 training drill animation" width="320"></p>

### 4. Save and share

- **Save to the browser**: it auto-saves to LocalStorage and is restored even after a reload
- **JSON export / import**: export and import a tactic as a `.json` file. You can share it with family or teammates.
- **GIF export**: export the tactic animation as a GIF (the GIFs in this article were generated from data in this same format)
- **Presets**: load standard patterns prepared in advance, like 2v1 and 3v2, from the menu

## Technical notes

- Draws the field and players with the **HTML5 Canvas API**
- **Pure JavaScript (ES Modules)** only. No frameworks or build tools.
- Animation is implemented as "linear interpolation between steps + easing" (`requestAnimationFrame`)
- Persistence via **LocalStorage**, with JSON for import/export
- Responsive, so it's operable on PC, phone, or tablet

Since it's entirely self-contained with static files, you can put it straight onto GitHub Pages or any static hosting.

## Closing

I built it because I wanted to solve the things a physical board makes hard: "moving everyone simultaneously," "repeating as many times as you want," and "leaving a trace of the movement." Beyond explaining things to my kid, it's also useful for sharing tactics within a team and recording training drills.

The source is public, so please give it a try if you like.

- Repository: [kenzo0107/soccer-tactics-board](https://github.com/kenzo0107/soccer-tactics-board)
