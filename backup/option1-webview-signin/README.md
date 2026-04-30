# Backup: Option 1 — In-WebView Sign-In (working state)

This folder is a snapshot of the **mobile app source** at the point where
sign-in worked entirely inside the WebView (no native Google Sign-In SDK).

## What's here

- `YouTubeWebView.tsx` — the WebView component with all CSS/JS injection
  (ad blocking, "Open App" suppression, quality bumper).
- `screens/` — Home, Search, Watch, Settings (all WebView wrappers).
- `store/` — zustand store with settings.
- `navigation/` — bottom tab navigator.

## How sign-in works in this snapshot

The user taps the profile icon inside the WebView and signs in to Google
through YouTube's own web flow. No native code; relies entirely on:

- `sharedCookiesEnabled` + `thirdPartyCookiesEnabled` on the WebView
- `domStorageEnabled` for the auth localStorage

If Google blocks the WebView with "browser may not be secure", this approach
breaks for that user. That is why we are moving to Option 2 (native Google
Sign-In) in the live source tree.

## How to restore

```powershell
Copy-Item -Path .\YouTubeWebView.tsx     -Destination ..\..\mobile\src\components\YouTubeWebView.tsx -Force
Copy-Item -Path .\screens\*              -Destination ..\..\mobile\src\screens\    -Recurse -Force
Copy-Item -Path .\store\*                -Destination ..\..\mobile\src\store\      -Recurse -Force
Copy-Item -Path .\navigation\*           -Destination ..\..\mobile\src\navigation\ -Recurse -Force
```
