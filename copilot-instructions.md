# 🤖 Copilot Master Instructions — YouTube AppView

> Hey Copilot! Read this whole file first before writing ANY code.
> These are your rules. Follow them every single time. No skipping!

---

## 🧒 What Are We Building? (Simple Version)

Imagine YouTube is a messy bedroom with toys everywhere.
We are building a **magic broom** that cleans the bedroom automatically.

The magic broom does 3 things:

1. **Removes the mess** — no ads, no Shorts, no distractions
2. **Makes it look beautiful** — like a real app on your phone
3. **Works everywhere** — in the browser AND as a phone app

We are building **TWO things**:

| Thing | What it is | Who uses it |
|---|---|---|
| 🌐 Browser Extension | A Brave/Chrome plugin | People on computers |
| 📱 Mobile App | A React Native app | People on Android & iPhone |

---

## 📁 Project Folder Structure

> Copilot: Create EXACTLY this folder structure. Do not add extra folders unless told to.

```
youtube-appview/
│
├── .github/
│   └── copilot-instructions.md         ← You are here
│
├── docs/
│   ├── 01_WHAT_WE_ARE_BUILDING.md
│   ├── 02_BROWSER_EXTENSION.md
│   ├── 03_MOBILE_APP.md
│   ├── 04_DESIGN_RULES.md
│   └── 05_TEST_CASES.md
│
├── extension/                          ← Browser extension code goes here
│   ├── manifest.json
│   ├── content.js
│   ├── styles.css
│   ├── storage.js
│   ├── mode-engine.js
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
│
├── mobile/                             ← React Native app code goes here
│   ├── android/
│   ├── ios/
│   ├── src/
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── WatchScreen.tsx
│   │   │   ├── SearchScreen.tsx
│   │   │   └── SettingsScreen.tsx
│   │   ├── components/
│   │   │   ├── VideoCard.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── VideoPlayer.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   └── ModeToggle.tsx
│   │   ├── navigation/
│   │   │   └── AppNavigator.tsx
│   │   ├── store/
│   │   │   ├── useStore.ts
│   │   │   └── types.ts
│   │   ├── hooks/
│   │   │   └── useSettings.ts
│   │   └── theme/
│   │       ├── colors.ts
│   │       └── typography.ts
│   ├── App.tsx
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

---

## 🚦 Rules Copilot Must Always Follow

### Rule 1 — Always Use TypeScript for Mobile
```
✅ GOOD: const [mode, setMode] = useState<string>('cinema')
❌ BAD:  const [mode, setMode] = useState('cinema')   ← no type
```

### Rule 2 — Always Write Comments Above Every Function
```typescript
// This function switches the app between cinema, minimal, and productivity modes
function switchMode(newMode: ModeType): void {
  ...
}
```

### Rule 3 — Never Leave Empty Error Handlers
```typescript
// ✅ GOOD
try {
  await saveSettings(prefs);
} catch (error) {
  console.error('Settings save failed:', error);
  showToast('Could not save settings. Please try again.');
}

// ❌ BAD
try {
  await saveSettings(prefs);
} catch (e) {}
```

### Rule 4 — Always Handle Loading and Error States in UI
Every screen must show:
- A loading spinner while data loads
- An error message if something goes wrong
- Empty state if there is no data

### Rule 5 — Extension Code Must Use MutationObserver
YouTube is a SPA (Single Page App). Pages do NOT fully reload when you click links.
Always use `MutationObserver` to watch for DOM changes and re-apply styles.

### Rule 6 — All Colors Must Use Theme Variables
```typescript
// ✅ GOOD
backgroundColor: colors.background.primary

// ❌ BAD
backgroundColor: '#0f0f0f'
```

---

## 🎨 App Modes (Very Important!)

The app has 3 modes. Copilot must implement ALL of them:

| Mode Name | Keyboard Key | What it hides | What it shows |
|---|---|---|---|
| 🎬 Cinema | `C` | Comments, Shorts, sidebar, ads | Full-width player only |
| ⚡ Minimal | `M` | Everything except search + player | Search bar + video |
| 💼 Productivity | `F` | Homepage feed, Shorts, trending | Player + recommendations |

---

## 📱 Mobile App Tech Stack

| What | Tool |
|---|---|
| Language | TypeScript |
| Framework | React Native 0.73+ |
| Navigation | React Navigation v6 |
| State | Zustand |
| Video | react-native-video |
| Storage | AsyncStorage |
| Icons | react-native-vector-icons |
| Web view | react-native-webview |
| Styling | StyleSheet (no external lib) |

---

## 🌐 Extension Tech Stack

| What | Tool |
|---|---|
| Language | Vanilla JavaScript (no framework) |
| Manifest | Version 3 (MV3) |
| Storage | chrome.storage.local |
| DOM Watching | MutationObserver |
| Styling | Plain CSS |
| Popup | Plain HTML + CSS + JS |

---

## ✅ Definition of Done

Copilot: The project is COMPLETE only when ALL of these are true:

- [ ] Extension loads in Brave and Chrome without errors
- [ ] Extension hides ads, Shorts, comments on YouTube
- [ ] All 3 modes work and switch correctly
- [ ] Keyboard shortcuts `C`, `M`, `F` work
- [ ] Settings are saved after browser restart
- [ ] Mobile app runs on Android emulator without crashes
- [ ] Mobile app runs on iOS simulator without crashes
- [ ] All 4 screens exist: Home, Watch, Search, Settings
- [ ] Video player works on Watch screen
- [ ] Dark mode works on mobile app
- [ ] No TypeScript errors (`tsc --noEmit` passes)
- [ ] No ESLint errors

---

## 📖 Read These Docs Too

Before building each part, read these files in order:

1. `docs/01_WHAT_WE_ARE_BUILDING.md` — Big picture
2. `docs/02_BROWSER_EXTENSION.md` — Extension details
3. `docs/03_MOBILE_APP.md` — Mobile app details
4. `docs/04_DESIGN_RULES.md` — Colors, fonts, spacing
5. `docs/05_TEST_CASES.md` — All test cases to pass
