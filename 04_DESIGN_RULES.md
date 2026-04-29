# 🎨 Doc 4 — Design Rules

> Copilot: Follow these rules for EVERY screen and component.
> Never use hardcoded color values. Always use the theme tokens below.

---

## 🧒 Simple Explanation

Design rules are like a rulebook for how things look.
If everything follows the same rules, the app looks beautiful and consistent.
Like how LEGO pieces all fit together because they follow the same shape rules.

---

## 🎨 Color System

### Dark Theme (Default — Always Used)

```typescript
// src/theme/colors.ts

export const colors = {
  background: {
    primary: '#0f0f0f',      // Main app background (very dark)
    secondary: '#1a1a1a',    // Cards, panels, bottom tab bar
    tertiary: '#272727',     // Input fields, toggles, chip backgrounds
    overlay: '#000000CC',    // Modal overlays (80% opacity black)
  },

  text: {
    primary: '#ffffff',      // Main text — headings, titles
    secondary: '#aaaaaa',    // Subtitles, metadata (channel name, date)
    tertiary: '#717171',     // Placeholder text, disabled labels
    inverse: '#0f0f0f',      // Text on light backgrounds
  },

  accent: {
    red: '#ff0000',          // YouTube red — active tabs, subscribe button
    redHover: '#cc0000',     // Pressed state for red buttons
    blue: '#3ea6ff',         // Links, info states
    white: '#ffffff',        // Active icon states
  },

  border: {
    subtle: '#272727',       // Very light dividers
    medium: '#3f3f3f',       // Card borders, separator lines
  },

  status: {
    success: '#2ba640',      // Success toast background
    error: '#cc0000',        // Error states
    warning: '#ff9500',      // Warning messages
    loading: '#3ea6ff',      // Loading spinner color
  },

  player: {
    controlsBg: '#000000AA', // Semi-transparent controls background
    seekBarFilled: '#ff0000',// Filled portion of seek bar
    seekBarEmpty: '#717171', // Empty portion of seek bar
    thumbColor: '#ffffff',   // Seek bar thumb/circle
  },
};
```

---

## ✏️ Typography System

```typescript
// src/theme/typography.ts

export const typography = {
  fontFamily: {
    regular: 'Roboto-Regular',       // Body text
    medium: 'Roboto-Medium',         // Sub-headings, labels
    bold: 'Roboto-Bold',             // Headings, titles
  },

  fontSize: {
    xs: 11,       // Timestamps, tiny labels
    sm: 13,       // Metadata (views, date)
    md: 14,       // Body text, descriptions
    lg: 16,       // Card titles, list items
    xl: 18,       // Screen section headings
    xxl: 22,      // Screen main headings
    xxxl: 28,     // Large display numbers
  },

  lineHeight: {
    tight: 1.2,   // Headings
    normal: 1.5,  // Body text
    relaxed: 1.8, // Descriptions, longer text
  },
};
```

---

## 📏 Spacing System

```typescript
// Use multiples of 4 only. Never use random numbers.

export const spacing = {
  xs: 4,     // Tiny gaps inside components
  sm: 8,     // Small padding inside cards
  md: 12,    // Standard component padding
  lg: 16,    // Screen horizontal padding
  xl: 20,    // Section gaps
  xxl: 24,   // Large section separators
  xxxl: 32,  // Screen top padding
};
```

---

## 🔵 Border Radius

```typescript
export const radius = {
  sm: 4,     // Small chips, badges
  md: 8,     // Buttons, input fields
  lg: 12,    // Video thumbnails, cards
  xl: 16,    // Large cards, panels
  full: 999, // Pill-shaped buttons, avatar circles
};
```

---

## 🖼️ Component Design Specs

### VideoCard Design

```
Background:       colors.background.secondary (#1a1a1a)
Border radius:    radius.lg (12px)
Margin bottom:    spacing.md (12px)
Padding:          spacing.sm (8px)

Thumbnail:
  Width:          100% of card
  Aspect ratio:   16:9
  Border radius:  radius.lg (12px)
  
Title text:
  Font size:      typography.fontSize.lg (16px)
  Font weight:    bold
  Color:          colors.text.primary (#ffffff)
  Max lines:      2
  Margin top:     spacing.sm (8px)

Channel name:
  Font size:      typography.fontSize.sm (13px)
  Color:          colors.text.secondary (#aaaaaa)
  Margin top:     spacing.xs (4px)

Metadata row (views · duration · date):
  Font size:      typography.fontSize.xs (11px)
  Color:          colors.text.tertiary (#717171)
  Gap between:    spacing.xs (4px)
  Separator:      " · " character
```

### Search Bar Design

```
Background:       colors.background.tertiary (#272727)
Border radius:    radius.full (999px)  ← pill shape
Height:           44px
Padding left:     spacing.lg (16px)
Icon size:        20px
Icon color:       colors.text.tertiary (#717171)
Text color:       colors.text.primary (#ffffff)
Placeholder:      colors.text.tertiary (#717171)
No border:        true
```

### Button — Primary (Subscribe / Active CTA)

```
Background:       colors.accent.red (#ff0000)
Text color:       colors.text.primary (#ffffff)
Font size:        typography.fontSize.md (14px)
Font weight:      bold
Border radius:    radius.md (8px)
Padding:          spacing.sm (8px) vertical, spacing.xl (20px) horizontal
Min width:        100px
```

### Button — Secondary (Mode Toggle, Chip)

```
Background:       colors.background.tertiary (#272727)
Text color:       colors.text.primary (#ffffff)
Font size:        typography.fontSize.sm (13px)
Border radius:    radius.full (999px)
Padding:          spacing.xs (4px) vertical, spacing.md (12px) horizontal
Active state:     Background changes to colors.accent.red
```

### Toggle Switch

```
Track on:         colors.accent.red (#ff0000)
Track off:        colors.background.tertiary (#272727)
Thumb:            colors.text.primary (#ffffff)
```

### Bottom Tab Bar

```
Background:         colors.background.secondary (#1a1a1a)
Border top:         1px solid colors.border.subtle (#272727)
Active icon color:  colors.accent.red (#ff0000)
Inactive color:     colors.text.tertiary (#717171)
Tab label font:     typography.fontSize.xs (11px)
Icon size:          24px
Height:             60px
```

---

## 🖥️ Extension (Browser) Design Rules

The extension popup must match this design:

```
Width:            320px
Min height:       400px
Background:       #1a1a1a
Font family:      -apple-system, system-ui, sans-serif
Padding:          16px

Header:
  App name font:  18px bold white
  Tagline:        13px #717171

Section titles:
  Font:           11px #717171
  Uppercase:      YES
  Letter spacing: 1.5px
  Margin bottom:  8px

Dividers:
  Color:          #272727
  Height:         1px
  Margin:         12px 0

Toggle row height: 44px
Toggle label:     14px #ffffff
```

---

## ✅ Design Checklist

Before Copilot finishes any screen, check ALL of these:

- [ ] All colors come from `colors.ts` — no hardcoded hex values
- [ ] All font sizes from `typography.ts` — no hardcoded numbers
- [ ] All spacing from `spacing` object — no random pixel values
- [ ] All border radii from `radius` object
- [ ] Loading state is styled (spinner in blue, centered)
- [ ] Error state is styled (red text, centered, with icon)
- [ ] Empty state is styled (grey text, icon, message)
- [ ] Pressed/active states have visual feedback (opacity 0.7 or color change)
- [ ] Text never overflows — always use `numberOfLines` or CSS overflow rules
- [ ] Images always have fallback (grey placeholder if URL fails to load)
