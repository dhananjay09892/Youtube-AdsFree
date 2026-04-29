# 🧪 Doc 5 — Test Cases

> Copilot: Every single test case below must PASS before the project is complete.
> If any test fails, fix it. Do not skip tests.

---

## 🧒 Simple Explanation

Tests are like a checklist before a rocket launch.
You check every single thing to make sure nothing will go wrong.
If one thing fails, you fix it before launching.

---

## 🌐 PART A — Browser Extension Tests

---

### A1 — Installation Tests

| # | Test | Expected Result | Pass? |
|---|---|---|---|
| A1.1 | Load extension in Chrome (Developer Mode) | Extension loads with no errors in console | ☐ |
| A1.2 | Load extension in Brave | Extension loads with no errors | ☐ |
| A1.3 | Extension icon appears in toolbar | Icon shows correctly (not broken image) | ☐ |
| A1.4 | Click extension icon | Popup opens without error | ☐ |
| A1.5 | Popup shows all 3 mode buttons | Cinema, Minimal, Productivity all visible | ☐ |

---

### A2 — Ad & Distraction Hiding Tests

| # | Test | Expected Result | Pass? |
|---|---|---|---|
| A2.1 | Visit youtube.com/home | No banner ads visible at top | ☐ |
| A2.2 | Scroll homepage | No Shorts shelf section visible | ☐ |
| A2.3 | Search for a video | No promoted/ad videos in search results | ☐ |
| A2.4 | Open any video | No pre-roll ad overlay in player | ☐ |
| A2.5 | Toggle "Hide Shorts" OFF in popup | Shorts shelf reappears on homepage | ☐ |
| A2.6 | Toggle "Hide Shorts" back ON | Shorts shelf disappears again | ☐ |

---

### A3 — Cinema Mode Tests

| # | Test | Expected Result | Pass? |
|---|---|---|---|
| A3.1 | Click Cinema in popup | Page switches to cinema layout immediately | ☐ |
| A3.2 | Press `C` on keyboard | Same result as above | ☐ |
| A3.3 | Cinema mode on watch page | Comments section is hidden | ☐ |
| A3.4 | Cinema mode on watch page | Left sidebar guide is hidden | ☐ |
| A3.5 | Cinema mode on watch page | Video player is wider than normal | ☐ |
| A3.6 | Cinema mode on homepage | Shorts shelf is hidden | ☐ |

---

### A4 — Minimal Mode Tests

| # | Test | Expected Result | Pass? |
|---|---|---|---|
| A4.1 | Press `M` on keyboard | Switches to minimal mode | ☐ |
| A4.2 | Minimal on watch page | Only search bar + player visible | ☐ |
| A4.3 | Minimal on watch page | Recommendations panel is hidden | ☐ |
| A4.4 | Minimal on watch page | Comments are hidden | ☐ |
| A4.5 | Minimal on watch page | Description is hidden | ☐ |

---

### A5 — Productivity Mode Tests

| # | Test | Expected Result | Pass? |
|---|---|---|---|
| A5.1 | Press `F` on keyboard | Switches to productivity mode | ☐ |
| A5.2 | Productivity on homepage | Homepage video feed is hidden | ☐ |
| A5.3 | Productivity on watch page | Recommendations panel still visible | ☐ |
| A5.4 | Productivity on watch page | Shorts shelf is hidden | ☐ |

---

### A6 — Persistence Tests

| # | Test | Expected Result | Pass? |
|---|---|---|---|
| A6.1 | Set Cinema mode, close browser, reopen | Cinema mode is still active | ☐ |
| A6.2 | Disable "Hide Ads", close tab, reopen YouTube | Ads are still showing (setting was saved) | ☐ |
| A6.3 | Click "Reset to Defaults" in popup | All settings go back to default values | ☐ |
| A6.4 | Reset, then close popup, reopen | Settings are still default | ☐ |

---

### A7 — SPA Navigation Tests

| # | Test | Expected Result | Pass? |
|---|---|---|---|
| A7.1 | Click a video from homepage | Watch page loads, mode still applied | ☐ |
| A7.2 | Click another video from watch page | New video loads, mode still applied | ☐ |
| A7.3 | Press browser Back button | Returns to previous page, mode still applied | ☐ |
| A7.4 | Click YouTube logo (go to homepage) | Homepage loads, Shorts still hidden | ☐ |

---

### A8 — Keyboard Shortcut Tests

| # | Test | Expected Result | Pass? |
|---|---|---|---|
| A8.1 | Press `C` while NOT in input field | Cinema mode activates | ☐ |
| A8.2 | Press `M` while NOT in input field | Minimal mode activates | ☐ |
| A8.3 | Press `F` while NOT in input field | Productivity mode activates | ☐ |
| A8.4 | Click search bar, then press `C` | Cinema mode does NOT activate (typing in input) | ☐ |
| A8.5 | Click search bar, type "C", press Enter | Nothing breaks, letter typed in search box | ☐ |

---

### A9 — Performance Tests

| # | Test | Expected Result | Pass? |
|---|---|---|---|
| A9.1 | Open YouTube without extension | Note page load time (baseline) | ☐ |
| A9.2 | Open YouTube with extension | Load time difference < 200ms vs baseline | ☐ |
| A9.3 | Leave YouTube open for 30 minutes | Browser tab memory usage is stable (no leak) | ☐ |
| A9.4 | Rapidly switch between modes 10 times | No visual glitches or JS errors in console | ☐ |

---

### A10 — Error Recovery Tests

| # | Test | Expected Result | Pass? |
|---|---|---|---|
| A10.1 | Disable extension, use YouTube | YouTube works completely normally | ☐ |
| A10.2 | Re-enable extension | YouTube AppView reactivates | ☐ |
| A10.3 | Open YouTube in Incognito mode | Extension does NOT run (not enabled by default in incognito) | ☐ |

---

## 📱 PART B — Mobile App Tests

---

### B1 — App Launch Tests

| # | Test | Expected Result | Pass? |
|---|---|---|---|
| B1.1 | Build Android app | Build completes with 0 errors | ☐ |
| B1.2 | Build iOS app | Build completes with 0 errors | ☐ |
| B1.3 | Run on Android emulator | App opens without crash | ☐ |
| B1.4 | Run on iOS simulator | App opens without crash | ☐ |
| B1.5 | App opens to HomeScreen | HomeScreen is visible as default tab | ☐ |
| B1.6 | All 4 tab icons visible | Home, Search, Watch, Settings tabs shown | ☐ |

---

### B2 — HomeScreen Tests

| # | Test | Expected Result | Pass? |
|---|---|---|---|
| B2.1 | HomeScreen loads | Loading spinner shows, then video list appears | ☐ |
| B2.2 | VideoCards are displayed | At least 5 video cards visible | ☐ |
| B2.3 | Video thumbnail loads | Image shows (not broken) | ☐ |
| B2.4 | Tap on a VideoCard | Navigates to WatchScreen | ☐ |
| B2.5 | Pull down to refresh | List refreshes with loading indicator | ☐ |
| B2.6 | Tap a category chip | List filters to that category | ☐ |
| B2.7 | Turn on airplane mode | Error message shown: "No internet connection" | ☐ |

---

### B3 — SearchScreen Tests

| # | Test | Expected Result | Pass? |
|---|---|---|---|
| B3.1 | Tap Search tab | SearchScreen opens, keyboard appears | ☐ |
| B3.2 | Type in search bar | Text appears as typed | ☐ |
| B3.3 | Type 3+ characters | Search suggestions appear below | ☐ |
| B3.4 | Submit a search | Results list appears | ☐ |
| B3.5 | Tap a search result | Navigates to WatchScreen | ☐ |
| B3.6 | Tap × to clear | Search bar clears, shows recent searches | ☐ |
| B3.7 | Search, go back, search again | Previous search appears in recent searches | ☐ |
| B3.8 | Tap a recent search | Search bar fills with that text | ☐ |

---

### B4 — WatchScreen Tests

| # | Test | Expected Result | Pass? |
|---|---|---|---|
| B4.1 | Navigate to WatchScreen | Video starts playing within 3 seconds | ☐ |
| B4.2 | Tap video player | Play/pause controls appear | ☐ |
| B4.3 | Tap pause | Video pauses | ☐ |
| B4.4 | Tap play | Video resumes | ☐ |
| B4.5 | Drag seek bar | Video jumps to new position | ☐ |
| B4.6 | Tap fullscreen button | Video goes fullscreen in landscape | ☐ |
| B4.7 | Rotate phone to landscape | Video expands to fill screen | ☐ |
| B4.8 | Video title is shown | Title visible below player | ☐ |
| B4.9 | Channel name is shown | Channel name visible below title | ☐ |
| B4.10 | Tap description | Description expands | ☐ |
| B4.11 | Recommended videos shown | At least 3 recommendations visible | ☐ |
| B4.12 | Tap a recommendation | New video loads in same screen | ☐ |
| B4.13 | Cinema mode | Recommendations and description hidden | ☐ |
| B4.14 | Minimal mode | Only player + title visible | ☐ |

---

### B5 — SettingsScreen Tests

| # | Test | Expected Result | Pass? |
|---|---|---|---|
| B5.1 | Open Settings tab | All settings visible | ☐ |
| B5.2 | Change mode to Cinema | Mode radio button shows Cinema selected | ☐ |
| B5.3 | Go to WatchScreen | Cinema mode is applied | ☐ |
| B5.4 | Toggle "Hide Shorts" OFF | Toggle shows OFF state | ☐ |
| B5.5 | Close app, reopen | "Hide Shorts" is still OFF | ☐ |
| B5.6 | Tap "Reset to Defaults" | Confirmation dialog appears | ☐ |
| B5.7 | Confirm reset | All settings go back to defaults | ☐ |
| B5.8 | Cancel reset | Settings stay unchanged | ☐ |

---

### B6 — State Management Tests

| # | Test | Expected Result | Pass? |
|---|---|---|---|
| B6.1 | Change settings in Settings tab | Changes reflect immediately on HomeScreen | ☐ |
| B6.2 | Change mode, kill app, reopen | Mode is still the same | ☐ |
| B6.3 | Change all 8 settings | All 8 settings save correctly | ☐ |

---

### B7 — Navigation Tests

| # | Test | Expected Result | Pass? |
|---|---|---|---|
| B7.1 | Tap each of the 4 tabs | Correct screen appears each time | ☐ |
| B7.2 | Go deep into screens, press Android back | Goes back correctly | ☐ |
| B7.3 | Press Android back on a main tab | App goes to background (does not crash) | ☐ |
| B7.4 | Swipe from edge on iOS | Goes back correctly | ☐ |

---

### B8 — Performance Tests

| # | Test | Expected Result | Pass? |
|---|---|---|---|
| B8.1 | Scroll HomeScreen fast | No dropped frames (no jank) | ☐ |
| B8.2 | Scroll through 50 VideoCards | App does not crash or slow down | ☐ |
| B8.3 | Open WatchScreen 10 times in a row | Memory usage does not continuously grow | ☐ |
| B8.4 | App start time | App is ready to interact within 3 seconds | ☐ |

---

### B9 — Crash & Error Tests

| # | Test | Expected Result | Pass? |
|---|---|---|---|
| B9.1 | Disable internet, open HomeScreen | Error message shown, app does not crash | ☐ |
| B9.2 | Disable internet, try to play video | Error message shown, retry button appears | ☐ |
| B9.3 | Give invalid video ID in URL | Error screen shown, not a blank white screen | ☐ |
| B9.4 | Rotate phone while video is playing | Video continues playing, layout adjusts | ☐ |

---

## 🏁 Final Sign-Off Checklist

> Copilot: The project is done ONLY when ALL boxes below are checked.

### Extension
- [ ] All A1–A10 tests pass
- [ ] No errors in browser console
- [ ] Popup design matches Doc 4 specs
- [ ] All 3 modes work on real YouTube

### Mobile App
- [ ] All B1–B9 tests pass
- [ ] TypeScript compiles with 0 errors: `tsc --noEmit`
- [ ] Android build: `npx react-native run-android` succeeds
- [ ] iOS build: `npx react-native run-ios` succeeds
- [ ] All screens match the designs in Doc 4
- [ ] No hardcoded colors (all from `colors.ts`)
- [ ] No hardcoded sizes (all from `spacing` / `typography`)
- [ ] All errors have user-friendly messages
- [ ] All loading states have spinners

---

> ✅ When all boxes are checked — the app is complete and ready to ship!
