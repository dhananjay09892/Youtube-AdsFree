# 📖 Doc 1 — What Are We Building?

> Read this first. It explains the whole project in simple words.

---

## 🧒 The Simple Explanation

Think of YouTube like a big pizza with too many toppings.
Some people just want plain cheese pizza — no extra stuff.

**YouTube AppView** removes the toppings you don't want.

It does this in two ways:

### Way 1 — Browser Extension 🌐
A small plugin you add to Brave or Chrome.
When you go to YouTube, it automatically makes it look clean and app-like.

### Way 2 — Mobile App 📱
A real app for Android and iPhone.
It shows YouTube content inside a beautiful, clean design.
No ads. No distractions. Just videos.

---

## 🗺️ The Big Picture

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   User opens YouTube (browser or phone)         │
│              ↓                                  │
│   YouTube AppView activates                     │
│              ↓                                  │
│   ┌──────────────────────────────────┐          │
│   │  Hides: Ads, Shorts, Trending   │          │
│   │  Shows: Clean player + videos   │          │
│   │  Saves: Your mode preferences   │          │
│   └──────────────────────────────────┘          │
│              ↓                                  │
│   User watches videos distraction-free! 🎉      │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🎯 What Problem Are We Solving?

| Problem | Our Solution |
|---|---|
| YouTube has too many ads | Hide ad containers from the page |
| Shorts are addictive & distracting | Hide all Shorts sections |
| Homepage is overwhelming | Focus mode shows only what matters |
| Web YouTube doesn't feel like an app | We restyle it to look like a native app |
| No mobile version of this tool | We build a React Native app |

---

## 🚫 What We Are NOT Building

It is important to know what we are NOT doing:

- ❌ We are NOT replacing YouTube
- ❌ We are NOT downloading YouTube videos
- ❌ We are NOT collecting user data
- ❌ We are NOT building a YouTube competitor
- ❌ We are NOT modifying YouTube's servers

We are only **changing how YouTube looks** in the browser and on mobile.

---

## 👤 Who Will Use This?

**Person 1: The Student 📚**
Opens YouTube to study. Gets distracted by Shorts and trending videos.
Our app removes all distractions so they can focus.

**Person 2: The Professional 💼**
Uses YouTube for research and tutorials.
Wants a clean, fast interface that feels like a real app.

**Person 3: The Minimalist 🧘**
Doesn't like cluttered UIs.
Wants just the video and nothing else.

---

## 📊 Project Phases

| Phase | What Gets Built | When |
|---|---|---|
| **Phase 1 (MVP)** | Basic extension + hide ads/shorts | First |
| **Phase 2** | All 3 modes + settings popup | Second |
| **Phase 3** | React Native mobile app | Third |
| **Phase 4** | AI summary panel (future) | Later |

> Copilot: Build Phase 1 first. Complete it fully before moving to Phase 2.

---

## 🗂️ Two Separate Codebases

The project has two completely separate parts:

```
youtube-appview/
├── extension/     ← Browser plugin (JavaScript, runs in Chrome/Brave)
└── mobile/        ← Phone app (TypeScript, React Native, Android + iOS)
```

They do not share code.
They do not depend on each other.
You can build and test them separately.
