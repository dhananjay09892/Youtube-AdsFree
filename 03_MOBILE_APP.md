# 📱 Doc 3 — Mobile App (Android + iOS)

> This file tells Copilot exactly how to build the React Native mobile app.
> Read every single section carefully before writing any code.

---

## 🧒 Simple Explanation

The mobile app is like a TV remote that controls how YouTube looks on your phone.
Instead of using YouTube's own messy app, you use our clean app.
It shows the same videos but in a much nicer, cleaner way.

---

## 🛠️ Setup — Run These Commands First

Copilot must generate a `setup.sh` script that runs these commands:

```bash
# Create React Native project
npx react-native init YouTubeAppView --template react-native-template-typescript

# Go into folder
cd YouTubeAppView

# Install all dependencies
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install react-native-vector-icons
npm install react-native-webview
npm install react-native-video
npm install @react-native-async-storage/async-storage
npm install zustand
npm install react-native-reanimated
npm install react-native-gesture-handler

# iOS only — install pods
cd ios && pod install && cd ..
```

---

## 📐 Screen Architecture

The app has 4 main screens connected by bottom navigation tabs:

```
App
 └── AppNavigator (Bottom Tabs)
      ├── Tab 1: Home      → HomeScreen.tsx
      ├── Tab 2: Search    → SearchScreen.tsx
      ├── Tab 3: Watch     → WatchScreen.tsx
      └── Tab 4: Settings  → SettingsScreen.tsx
```

---

## 📄 Screen 1: HomeScreen.tsx

### What It Shows

```
┌─────────────────────────────┐
│  🔍 Search bar (top)        │
├─────────────────────────────┤
│  📂 Category chips:         │
│  [All] [Music] [Gaming] ... │
├─────────────────────────────┤
│  📹 VideoCard               │
│  Thumbnail | Title | Views  │
├─────────────────────────────┤
│  📹 VideoCard               │
├─────────────────────────────┤
│  📹 VideoCard               │
└─────────────────────────────┘
```

### What Copilot Must Build

```typescript
// HomeScreen shows a scrollable list of VideoCard components
// It uses a FlatList for performance (not ScrollView + map)
// Pull to refresh must work
// Loading spinner shows while videos load
// Error message shows if loading fails
// Empty state shows "No videos found" if list is empty

// Category chips filter the video list
// Tapping a chip updates the displayed videos

// Tapping a VideoCard navigates to WatchScreen
// Pass the video data as navigation params
```

### VideoCard Component Requirements

```typescript
interface VideoCardProps {
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  viewCount: string;
  duration: string;
  publishedAt: string;
  onPress: () => void;
}

// Card layout:
// - Thumbnail (16:9 ratio, rounded corners 8px)
// - Title (2 lines max, bold, white)
// - Channel name (grey, smaller font)
// - Row: view count + duration + published date
// - No border, dark background card
```

---

## 📄 Screen 2: SearchScreen.tsx

### What It Shows

```
┌─────────────────────────────┐
│  🔍 [Search YouTube...    ] │
├─────────────────────────────┤
│  Recent searches:           │
│  🕐 "react native tutorial" │
│  🕐 "javascript crash course"│
├─────────────────────────────┤
│  (After searching)          │
│  Search results:            │
│  📹 VideoCard               │
│  📹 VideoCard               │
└─────────────────────────────┘
```

### What Copilot Must Build

```typescript
// Search bar at top — auto-focused when screen opens
// Shows recent searches (saved in AsyncStorage) before typing
// After typing 3+ characters, show search suggestions
// Submit search → show results as VideoCard list
// Clear button (×) appears when text is entered
// Tapping recent search fills the search bar
// Tapping a result navigates to WatchScreen
```

---

## 📄 Screen 3: WatchScreen.tsx

This is the most important screen. Copilot must build it carefully.

### What It Shows

```
┌─────────────────────────────┐
│  ← Back button              │
├─────────────────────────────┤
│                             │
│  ┌─────────────────────┐   │
│  │                     │   │
│  │   VIDEO PLAYER      │   │
│  │   (16:9 ratio)      │   │
│  │                     │   │
│  └─────────────────────┘   │
│                             │
│  Video Title (bold)         │
│  Channel Name  👍 1.2M  📅  │
│                             │
│  [SUBSCRIBE]                │
│  ─────────────────────────  │
│  📹 Recommended Video       │
│  📹 Recommended Video       │
│  📹 Recommended Video       │
└─────────────────────────────┘
```

### What Copilot Must Build

```typescript
// VideoPlayer using react-native-video
// Controls: play/pause, seek bar, fullscreen, volume
// Fullscreen mode rotates to landscape automatically
// Picture-in-picture support if device allows

// Below player:
// - Video title (2 lines)
// - Channel name + subscriber count
// - View count + published date
// - Subscribe button (toggle state)
// - Description (collapsed by default, expand on tap)

// Recommended videos list below description
// Uses FlatList (not ScrollView) for performance
// Tapping recommended video loads new video WITHOUT navigating away
// (update the player in-place)

// Mode-aware behavior:
// Cinema mode → hide description, hide recommendations
// Minimal mode → hide description, hide recommendations, hide channel info
// Productivity mode → show recommendations on side (tablet) or below (phone)
```

### WebView Mode (Alternative)
```typescript
// If native video fails, fall back to WebView
// Load: https://www.youtube.com/embed/{videoId}
// Apply CSS overrides to remove YouTube's own controls clutter:
//   - Hide YouTube logo
//   - Hide share/subscribe overlays
//   - Allow fullscreen
```

---

## 📄 Screen 4: SettingsScreen.tsx

### What It Shows

```
┌─────────────────────────────┐
│  ⚙️ Settings                │
├─────────────────────────────┤
│  VIEW MODE                  │
│  ○ Cinema                   │
│  ● Productivity  ← default  │
│  ○ Minimal                  │
├─────────────────────────────┤
│  CONTENT FILTERS            │
│  Hide Shorts       [ON  ●]  │
│  Hide Ads          [ON  ●]  │
│  Hide Comments     [OFF ○]  │
│  Hide Trending     [ON  ●]  │
├─────────────────────────────┤
│  APPEARANCE                 │
│  Dark Mode         [ON  ●]  │
│  Rounded Player    [ON  ●]  │
│  Text Size         [Med  ▾] │
├─────────────────────────────┤
│  [Reset to Defaults]        │
│  Version 1.0.0              │
└─────────────────────────────┘
```

### What Copilot Must Build

```typescript
// All settings saved to AsyncStorage
// Changes apply instantly — no save button needed
// Reset button shows confirmation dialog before resetting
// Settings are loaded from storage on app start via Zustand store
```

---

## 🗂️ State Management with Zustand

Copilot must create this store in `src/store/useStore.ts`:

```typescript
interface AppSettings {
  mode: 'cinema' | 'minimal' | 'productivity';
  hideShorts: boolean;
  hideAds: boolean;
  hideComments: boolean;
  hideTrending: boolean;
  darkMode: boolean;
  roundedPlayer: boolean;
}

interface AppStore {
  settings: AppSettings;
  isLoading: boolean;
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
  loadSettingsFromStorage: () => Promise<void>;
  saveSettingsToStorage: () => Promise<void>;
}
```

---

## 🎨 Navigation Setup

`src/navigation/AppNavigator.tsx` must use React Navigation bottom tabs:

```typescript
// Tab 1: Home
// - Icon: home-outline (active: home)
// - Label: "Home"

// Tab 2: Search
// - Icon: search-outline (active: search)
// - Label: "Search"

// Tab 3: Watch
// - Icon: play-circle-outline (active: play-circle)
// - Label: "Watch"

// Tab 4: Settings
// - Icon: settings-outline (active: settings)
// - Label: "Settings"

// Tab bar styling:
// - Background: #1a1a1a
// - Active color: #ff0000 (YouTube red)
// - Inactive color: #717171
// - No border/shadow on top
```

---

## 📱 Android-Specific Requirements

Add these to `android/app/src/main/AndroidManifest.xml`:

```xml
<!-- Allow internet access -->
<uses-permission android:name="android.permission.INTERNET" />

<!-- Allow fullscreen landscape video -->
<activity
  android:screenOrientation="sensor"
  android:configChanges="orientation|screenSize" />
```

---

## 🍎 iOS-Specific Requirements

Add to `ios/YouTubeAppView/Info.plist`:

```xml
<!-- Allow background audio when phone is locked -->
<key>UIBackgroundModes</key>
<array>
  <string>audio</string>
</array>

<!-- Allow HTTP (needed for some video streams) -->
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>
</dict>
```

---

## 🔁 Mobile App Flow Diagram

```
App Starts
    ↓
Load settings from AsyncStorage (Zustand)
    ↓
Show HomeScreen with saved preferences applied
    ↓
User taps VideoCard
    ↓
Navigate to WatchScreen with video data
    ↓
Video plays in native player
    ↓
User taps Settings tab
    ↓
Changes mode to Cinema
    ↓
Zustand updates global state
    ↓
WatchScreen re-renders in Cinema mode
    ↓
Settings auto-save to AsyncStorage ✅
```

---

## 🚨 Error Handling Rules

Copilot must handle these errors in the mobile app:

| Error | Where | What to Show |
|---|---|---|
| No internet | HomeScreen | "No internet connection. Pull down to retry." |
| Video load fail | WatchScreen | "Could not load video. Tap to try again." |
| Storage fail | SettingsScreen | "Could not save settings. Please try again." |
| Search fail | SearchScreen | "Search failed. Check your connection." |
| App crash | All screens | Wrap in ErrorBoundary component |
