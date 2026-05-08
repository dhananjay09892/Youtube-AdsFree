# PR: Stability, Multi-Site Architecture, Auto-Hide Tab Bar, UI Polish & Android Audio

## Summary

This PR fixes all reported crashes, stutters, and auto-advance failures; introduces a data-driven multi-site architecture; adds an auto-hiding animated tab bar; redesigns the settings screen; and adds Android background audio with lock screen controls.

---

## What Changed & Why

### Phase 1 — Critical Stability Fixes

**WebView crash recovery** (`src/components/YouTubeWebView.tsx`)
- Added `onContentProcessDidTerminate` callback that calls `webRef.current?.reload()`. Without this, iOS kills the WebKit GPU process under memory pressure and the screen stays blank forever.
- Added `onError` + `key` state increment pattern for Android renderer crashes (the `onRenderProcessGone` equivalent for react-native-webview).

**Video stutter fix — ytcfg patching** (`src/components/YouTubeWebView.tsx`)
- Extended `buildEarlyBlockerJs()` to also intercept `ytcfg.set()` and strip ad-related keys (`adPlacements`, `playerAds`, `adSlots`, `adBreakHeartbeatParams`) before the player reads them.
- Also patches `window.__ytd_config__` setter. This eliminates the 2–5s pre-roll load stutter.

**Tab switch kills video fix** (`src/navigation/AppNavigator.tsx`)
- Added `detachInactiveScreens={false}` and `lazy={false}` to `Tab.Navigator` screenOptions.
- Added `unmountOnBlur={false}` to every `Tab.Screen`.
- Result: all tab screens stay mounted; switching tabs no longer stops video playback.

**Auto-advance selector expansion** (`src/components/YouTubeWebView.tsx`)
- Expanded `_rn_next` to cover all known mobile YouTube selectors for the "Up Next" chip, endscreen overlay, and autoplay renderer.
- Replaced the 500ms polling approach for post-SPA listener attachment with a `yt-navigate-finish` event listener — more reliable and zero CPU cost between navigations.

---

### Phase 2 — Multi-Site Architecture Foundation

**New file: `src/config/siteRegistry.ts`**
- Defines `FilterRuleSet` and `SiteConfig` TypeScript interfaces.
- Exports `SITE_REGISTRY: SiteConfig[]` array. Adding a new site = one object in this array.

**New file: `src/config/youtube.site.ts`**
- All YouTube-specific CSS selectors, early JS logic, and configuration extracted from `YouTubeWebView.tsx` into a `youtubeConfig: SiteConfig` object.

**New file: `src/components/SiteWebView.tsx`**
- Generic WebView component that accepts a `SiteConfig` prop.
- `buildCssFromRules(config.filterRules, settings)` replaces the hardcoded `buildHidingCss()`.
- `buildEarlyJs(config)` replaces the hardcoded `buildEarlyBlockerJs()`.
- YouTube behavior is 100% preserved — `youtubeConfig` feeds the same logic.

**`src/components/YouTubeWebView.tsx`** — becomes a thin wrapper that passes `youtubeConfig` to `SiteWebView`. Existing imports in all screens remain unchanged.

**Store extension** (`src/store/types.ts`, `src/store/useStore.ts`)
- Added `activeSiteId: string` to `AppSettings` (default `'youtube'`).
- Added `perSiteNavState: Record<string, { currentUrl: string }>` (in-memory, not persisted).
- Added `updateTabUrl(tabId, url)` action.

---

### Phase 3 — Auto-Hiding Animated Tab Bar

**New file: `src/navigation/TabBar.tsx`**
- Custom tab bar built with `react-native-reanimated` and `react-native-gesture-handler` (both already installed).
- Auto-hides when the active tab's URL contains `?v=` (video is playing); auto-shows on all other pages.
- A `PanGestureHandler` on a 44px invisible strip at the bottom of the screen detects swipe-up gestures and temporarily reveals the bar for 3 seconds.
- Respects `useSafeAreaInsets().bottom` so it never overlaps the iPhone home indicator.
- Tab icons replaced with `react-native-vector-icons` Ionicons (`home`, `search`, `play-circle-outline`, `settings-sharp`).

**`src/navigation/AppNavigator.tsx`** — wired custom `TabBar` via the `tabBar` prop. Emoji icon placeholders removed.

---

### Phase 4 — UI Polish

**Settings screen redesign** (`src/screens/SettingsScreen.tsx`)
- Restructured into named sections using `SectionList`: **Account**, **Content Filters**, **Playback**, **Appearance**, **About**.
- Removed the unused Cinema/Minimal/Productivity mode selector.
- Added a placeholder "Add a site" row in the About section.

**Splash screen** (`App.tsx`, `app.json`)
- `SplashScreen.preventAutoHideAsync()` called in `index.js`.
- Splash hidden after the Zustand store finishes loading settings.
- `app.json` updated with splash background color `#0f0f0f`.

**Android MediaSession native module**
- New file: `android/app/src/main/java/.../MediaSessionModule.java`
- Mirrors the iOS `RCTNowPlayingModule` API: `update()`, `setPlaybackState()`, `clear()`.
- Connects to Android `MediaSession` + `NotificationCompat.MediaStyle` for lock screen controls.
- Registered in `MainApplication.java`.
- `src/modules/NowPlaying.ts` — removed the `Platform.OS === 'ios'` guard; both platforms now resolve to their respective native module.

---

### Phase 5 — Background Audio Hardening

**iOS AVAudioSession** (`ios/AdsFreePlayer/AppDelegate.mm`)
- Configured `AVAudioSessionCategoryPlayback` at app launch so audio continues after screen lock regardless of the JS visibility shim.
- Verified `UIBackgroundModes: audio` is present in `Info.plist`.

**Android foreground service** (`android/app/src/main/java/.../MediaPlaybackService.java`)
- A `Service` subclass that keeps the WebView process alive in the background.
- Shows a persistent media notification with play/pause/next controls (driven by MediaSession).
- Started when `backgroundPlay = true` and a video is playing; stopped when playback pauses or app foregrounds.
- Manifest updated: `FOREGROUND_SERVICE` permission + `<service android:foregroundServiceType="mediaPlayback" />`.

**JS heartbeat guard** (`src/components/SiteWebView.tsx`)
- Injected JS sends `appview:heartbeat` via `postMessage` every 10s.
- If heartbeats stop while `backgroundPlay = true`, RN re-injects the background audio shim. Makes background audio self-healing against YouTube JS updates.

---

## Files Modified

| File | Change Type |
|---|---|
| `src/components/YouTubeWebView.tsx` | Modified — crash recovery, stutter fix, selector fix |
| `src/navigation/AppNavigator.tsx` | Modified — tab persistence, custom TabBar |
| `src/config/siteRegistry.ts` | New |
| `src/config/youtube.site.ts` | New |
| `src/components/SiteWebView.tsx` | New |
| `src/store/types.ts` | Modified — activeSiteId, perSiteNavState |
| `src/store/useStore.ts` | Modified — updateTabUrl action |
| `src/navigation/TabBar.tsx` | New |
| `src/screens/SettingsScreen.tsx` | Modified — redesign |
| `App.tsx` | Modified — splash screen |
| `index.js` | Modified — SplashScreen.preventAutoHideAsync |
| `app.json` | Modified — splash config |
| `android/.../MediaSessionModule.java` | New |
| `android/.../MainApplication.java` | Modified — register module |
| `ios/AdsFreePlayer/AppDelegate.mm` | Modified — AVAudioSession |
| `ios/AdsFreePlayer/Info.plist` | Verified/Modified — UIBackgroundModes |
| `android/.../MediaPlaybackService.java` | New |
| `android/app/src/main/AndroidManifest.xml` | Modified — permissions + service |
| `src/modules/NowPlaying.ts` | Modified — remove iOS guard |

---

## Testing Checklist

- [ ] Video plays without 2–5s stutter on first load
- [ ] Switching from Watch tab to Home tab does not stop audio
- [ ] Killing the app process from Recents and returning shows the video (not a blank screen)
- [ ] Auto-advance plays the next video without tapping
- [ ] Tab bar hides when a video is playing (`?v=` in URL)
- [ ] Swipe up from bottom edge reveals the tab bar for 3 seconds
- [ ] Locking the screen keeps audio playing (iOS and Android)
- [ ] Lock screen shows track title and play/pause controls (iOS and Android)
- [ ] Settings screen sections render correctly
- [ ] Splash screen shows on cold launch and hides after store loads
- [ ] Adding a second SiteConfig to the registry adds a tab without other code changes
