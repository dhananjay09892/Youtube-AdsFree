# 🎬 YouTube AppView

> Make YouTube clean, beautiful, and distraction-free.
> Works as a **Browser Extension** (Brave/Chrome) and a **Mobile App** (Android + iOS).

---

## 🧒 What Is This?

YouTube has ads. YouTube has Shorts. YouTube is messy.

**YouTube AppView** fixes that.

It removes everything you don't want and makes YouTube look like a real app.

---

## 📁 What's In This Project

```
youtube-appview/
├── extension/     → Brave/Chrome browser extension
├── mobile/        → React Native app for Android + iOS
└── docs/          → Full instructions for building everything
```

---

## 🤖 For Copilot — Start Here

Read these files IN ORDER before writing any code:

| Order | File | What It Contains |
|---|---|---|
| 1st | `.github/copilot-instructions.md` | Master rules + folder structure |
| 2nd | `docs/01_WHAT_WE_ARE_BUILDING.md` | Big picture overview |
| 3rd | `docs/02_BROWSER_EXTENSION.md` | Extension code details |
| 4th | `docs/03_MOBILE_APP.md` | Mobile app code details |
| 5th | `docs/04_DESIGN_RULES.md` | Colors, fonts, spacing |
| 6th | `docs/05_TEST_CASES.md` | All tests that must pass |

---

## ⚡ Quick Start

### Build the Browser Extension

```bash
# 1. Open Chrome or Brave
# 2. Go to: chrome://extensions/
# 3. Turn on "Developer Mode" (top right)
# 4. Click "Load Unpacked"
# 5. Select the extension/ folder
# 6. Go to youtube.com — it works!
```

### Build the Mobile App

```bash
# Install dependencies
cd mobile
npm install

# Android
npx react-native run-android

# iOS (Mac only)
cd ios && pod install && cd ..
npx react-native run-ios
```

---

## 📦 Building Installable Binaries

### Android — `.apk` / `.aab` (works on Windows, macOS, Linux)

Requires: JDK 17, Android SDK (or Android Studio).

```powershell
cd mobile

# Debug APK — quickest, install on any device with USB debugging
npm run apk:debug
# Output: mobile/android/app/build/outputs/apk/debug/app-debug.apk

# Release APK — signed, shareable
npm run apk:release
# Output: mobile/android/app/build/outputs/apk/release/app-release.apk

# Release AAB — for Google Play upload
npm run aab:release
# Output: mobile/android/app/build/outputs/bundle/release/app-release.aab
```

**Signing a release build:**
1. Generate a keystore once:
   ```powershell
   keytool -genkeypair -v -storetype PKCS12 `
     -keystore mobile/android/app/my-release-key.keystore `
     -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Uncomment + fill the `MYAPP_UPLOAD_*` lines in `mobile/android/gradle.properties`
   (or, better, set them in `~/.gradle/gradle.properties` so secrets stay out of git).
3. Run `npm run apk:release`. Without these properties the release build falls
   back to the debug keystore so the build still succeeds locally.

### iOS — cloud builds via EAS (no Mac required)

This is a bare React Native project, so **Expo Go does not work**. Use
[EAS Build](https://docs.expo.dev/build/introduction/) to build `.ipa`s in the
cloud from Windows.

```powershell
npm install -g eas-cli
cd mobile
eas login
eas build:configure   # one-time: links the project to your Expo account

# Simulator build (free, runs in iOS Simulator on a Mac / cloud Mac)
npm run ios:eas:dev

# Device build — needs an Apple Developer account ($99/yr) for signing
npm run ios:eas:preview
```

Build profiles live in `mobile/eas.json`. Installing on a real iPhone requires
either an Apple Developer account (TestFlight / ad-hoc) or sideloading via
Xcode on a Mac with a free Apple ID (7-day signing).

---

## 🎮 Keyboard Shortcuts (Extension)

| Key | Action |
|---|---|
| `C` | Cinema mode — full-width player, no distractions |
| `M` | Minimal mode — search + player only |
| `F` | Productivity mode — no feed, keep recommendations |

---

## 🧪 Testing

See `docs/05_TEST_CASES.md` for the full list of 60+ test cases.

---

## 🛣️ Roadmap

- [x] Phase 1: Browser extension MVP
- [x] Phase 2: All 3 modes + settings
- [x] Phase 3: React Native mobile app

---

## ⚠️ Legal Note

This project only changes how YouTube **looks** in your browser or app.
It does not download videos, scrape data, or violate YouTube's Terms of Service.
It is a personal UI customization tool.
