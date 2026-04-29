# 🌐 Doc 2 — Browser Extension

> This file tells Copilot exactly how to build the browser extension.
> Read every section before writing any code.

---

## 🧒 Simple Explanation

The extension is like a pair of special glasses.
When you wear them, YouTube looks cleaner and nicer.
When you take them off, YouTube goes back to normal.

The glasses are made of 5 small files that work together.

---

## 📁 Extension Files — What Each One Does

```
extension/
├── manifest.json     ← The ID card. Tells Chrome what this extension is.
├── content.js        ← The brain. Watches YouTube and applies changes.
├── styles.css        ← The makeup. Changes how things look.
├── storage.js        ← The memory. Remembers your settings.
├── mode-engine.js    ← The switcher. Handles Cinema/Minimal/Productivity modes.
└── popup/
    ├── popup.html    ← The control panel you see when clicking the extension icon.
    ├── popup.js      ← Makes the control panel buttons work.
    └── popup.css     ← Makes the control panel look nice.
```

---

## 📄 File 1: manifest.json

Copilot must create this EXACTLY. Do not change version numbers or permission names.

```json
{
  "manifest_version": 3,
  "name": "YouTube AppView",
  "version": "1.0.0",
  "description": "Transform YouTube into a clean, app-like experience. No ads. No distractions.",
  "permissions": [
    "storage",
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "https://www.youtube.com/*"
  ],
  "content_scripts": [
    {
      "matches": ["https://www.youtube.com/*"],
      "js": ["storage.js", "mode-engine.js", "content.js"],
      "css": ["styles.css"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

---

## 📄 File 2: storage.js

This file saves and loads user preferences.

Copilot must implement these functions:

```javascript
// Default settings — what the extension uses the very first time
const DEFAULT_SETTINGS = {
  mode: 'productivity',       // 'cinema' | 'minimal' | 'productivity'
  hideAds: true,
  hideShorts: true,
  hideComments: false,
  hideTrending: true,
  darkBackground: true,
  roundedPlayer: true,
  extensionEnabled: true
};

// Save settings to chrome storage
async function saveSettings(settings) { ... }

// Load settings from chrome storage
// Returns DEFAULT_SETTINGS if nothing is saved yet
async function loadSettings() { ... }

// Reset to default settings
async function resetSettings() { ... }
```

---

## 📄 File 3: mode-engine.js

This handles the 3 modes. Copilot must implement all 3.

### Mode: Cinema 🎬
```
What to HIDE:
- Comments section (#comments)
- Shorts shelf (ytd-reel-shelf-renderer)
- Left sidebar guide (ytd-guide-renderer)
- Info cards
- End screen suggestions (while playing)

What to SHOW big:
- Video player (full width, max 1600px)
- Title + channel info
- Small recommendations on the right
```

### Mode: Minimal ⚡
```
What to HIDE:
- Everything except search bar + video player
- Sidebar, comments, recommendations, description

What to SHOW:
- Top search bar
- Video player (centered, large)
- Video title only
```

### Mode: Productivity 💼
```
What to HIDE:
- Shorts shelf
- Trending/Explore sections
- Homepage video feed (on homepage only)
- Masthead ads

What to SHOW:
- Search bar
- Video player
- Recommendations panel (right side, 320px wide)
- Video description
```

---

## 📄 File 4: content.js

This is the main brain of the extension. Copilot must include ALL of the following:

### 4.1 — Initial Load
```javascript
// When the page first loads:
// 1. Load settings from storage
// 2. Apply the saved mode
// 3. Start watching for DOM changes
```

### 4.2 — MutationObserver (VERY IMPORTANT)
```javascript
// YouTube is a SPA. When users click videos, the URL changes
// but the page does NOT fully reload.
// We MUST use MutationObserver to detect navigation changes
// and re-apply our styles every single time.

// Watch for:
// - URL changes (SPA navigation)
// - New DOM elements being added (lazy-loaded content)
// - YouTube's own layout changes
```

### 4.3 — Keyboard Shortcuts
```javascript
// Listen for keypress events on the document
// C key → switch to Cinema mode
// M key → switch to Minimal mode
// F key → switch to Productivity (Focus) mode

// IMPORTANT: Do not trigger if user is typing in a search box or input field
// Check: document.activeElement.tagName !== 'INPUT'
```

### 4.4 — Message Listener
```javascript
// Listen for messages from popup.js
// When popup sends { action: 'SET_MODE', mode: 'cinema' }
// Apply that mode immediately without page reload
```

### 4.5 — Error Safety
```javascript
// Wrap all DOM queries in try/catch
// If a YouTube element doesn't exist, do NOT crash
// Log errors to console with prefix [AppView Error]
```

---

## 📄 File 5: styles.css

### Base Styles (Always Applied)

```css
/* These styles ALWAYS apply, regardless of mode */

/* Remove YouTube masthead ad banner */
#masthead-ad { display: none !important; }

/* Remove promoted videos in search */
ytd-search-pyv-renderer { display: none !important; }

/* Remove banner ads */
.ytd-banner-promo-renderer { display: none !important; }

/* Smooth all transitions */
* { transition: all 0.2s ease !important; }

/* Make scrollbars thin and dark */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #0f0f0f; }
::-webkit-scrollbar-thumb { background: #3f3f3f; border-radius: 3px; }
```

### Mode-Specific Styles

```css
/* Cinema Mode */
.yt-appview-cinema #comments { display: none !important; }
.yt-appview-cinema ytd-reel-shelf-renderer { display: none !important; }
.yt-appview-cinema #secondary { width: 300px !important; }

/* Minimal Mode */
.yt-appview-minimal #secondary { display: none !important; }
.yt-appview-minimal #comments { display: none !important; }
.yt-appview-minimal ytd-guide-renderer { display: none !important; }

/* Productivity Mode */
.yt-appview-productivity ytd-reel-shelf-renderer { display: none !important; }
.yt-appview-productivity ytd-rich-section-renderer { display: none !important; }
```

### App-like Design

```css
/* Rounded video player */
.yt-appview-rounded video { border-radius: 12px; overflow: hidden; }

/* Dark background everywhere */
.yt-appview-dark body { background-color: #0f0f0f !important; }
.yt-appview-dark ytd-app { background-color: #0f0f0f !important; }
```

---

## 📄 File 6: popup/popup.html

The control panel popup must include:

- App logo/name at top
- Toggle switch: Extension ON/OFF
- Three mode buttons: Cinema | Minimal | Productivity
- Toggle: Hide Ads
- Toggle: Hide Shorts
- Toggle: Hide Comments
- Reset to defaults button
- Current mode label

Design must be:
- Dark background: `#1a1a1a`
- Width: 320px
- Clean, minimal, no clutter
- Looks like a native app settings panel

---

## 🔁 Extension Flow Diagram

```
Browser opens YouTube
        ↓
content.js loads (after DOM is ready)
        ↓
storage.js loads saved settings
        ↓
mode-engine.js applies the saved mode
        ↓
styles.css hides/shows elements
        ↓
MutationObserver starts watching
        ↓
User navigates to video page
        ↓
MutationObserver fires
        ↓
mode-engine.js re-applies mode
        ↓
Everything stays clean ✅
```

---

## ⚠️ Common YouTube Elements That Break

Copilot must handle these carefully:

| Element | Problem | Solution |
|---|---|---|
| `ytd-app` | Takes time to load | Use MutationObserver, not DOMContentLoaded |
| `#contents` inside `ytd-rich-grid-renderer` | Changes on navigation | Re-apply on every URL change |
| Shorts shelf | YouTube adds it dynamically | Watch for new nodes in observer |
| Ad containers | Class names change | Target multiple selectors with `,` |

---

## 🧪 How to Test the Extension

1. Open Chrome or Brave
2. Go to `chrome://extensions/`
3. Turn on **Developer Mode** (top right toggle)
4. Click **Load Unpacked**
5. Select the `extension/` folder
6. Go to `https://www.youtube.com`
7. Check that:
   - Ads are gone
   - Shorts are hidden
   - Mode buttons work
   - Settings save after refresh
