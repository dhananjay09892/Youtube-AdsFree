# Google Sign-In setup (Option 2)

This is a **one-time setup** you (the developer) must do in Google Cloud
Console. After it's done, native sign-in works for every user without
any further configuration.

> **Time required**: ~20 minutes. Most of it is waiting for Google's UI.

---

## Step 1 — Get your debug SHA-1 fingerprint

Google needs to know your app's signing certificate so it can verify
sign-in requests really came from your app and not an impersonator.

Run this in a PowerShell terminal (already done if you've built the app):

```powershell
cd C:\Users\pateld42\Documents\GitHub\Youtube-AdsFree\mobile\android
.\gradlew signingReport
```

Look for the **`Variant: debug`** section and copy the **`SHA1:`** value.
It looks like `AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12`.

You'll also need a **release** SHA-1 later when you publish to Play Store —
generate it from your release keystore the same way.

---

## Step 2 — Create a Google Cloud project

1. Go to https://console.cloud.google.com/
2. Top bar → project dropdown → **New Project**
3. Name: `YouTube AdsFree` (or whatever) → **Create**
4. Wait ~10 seconds for it to be created, then make sure it's selected
   in the project dropdown.

---

## Step 3 — Enable the YouTube Data API

1. Left menu → **APIs & Services** → **Library**
2. Search for **"YouTube Data API v3"** → click it → **Enable**

This is what lets your app read the signed-in user's subscriptions and
playlists later (when we add native screens for those).

---

## Step 4 — Configure the OAuth consent screen

1. Left menu → **APIs & Services** → **OAuth consent screen**
2. User type → **External** → **Create**
3. Fill in:
   - **App name**: `YouTube AdsFree` (or whatever you like)
   - **User support email**: your Gmail
   - **Developer contact**: your Gmail
   - Skip everything else → **Save and Continue**
4. Scopes screen → **Add or Remove Scopes** → check:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
   - `.../auth/youtube.readonly`
   - `.../auth/youtube.force-ssl`
   - **Update** → **Save and Continue**
5. Test users → **Add Users** → add your own Gmail address (and any
   testers). You can have up to 100 testers without app verification.
6. **Save and Continue** → **Back to Dashboard**.

> Until you submit for verification, only test users you added can sign in.
> That's fine for development. For a public release you'll need verification.

---

## Step 5 — Create the OAuth client IDs

You need **two** client IDs — one Web, one Android.

### 5a. Web client ID (used by the SDK)

1. Left menu → **APIs & Services** → **Credentials**
2. **+ Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `YouTube AdsFree Web`
5. Skip redirect URIs (not needed for native sign-in)
6. **Create**
7. **Copy the Client ID** — paste into `mobile/src/auth/config.ts`
   as `OAUTH_WEB_CLIENT_ID`.

### 5b. Android client ID (Google verifies the app's identity)

1. **+ Create Credentials** → **OAuth client ID** again
2. Application type: **Android**
3. Name: `YouTube AdsFree Android`
4. **Package name**: `com.adsfreeplayer`
5. **SHA-1 certificate fingerprint**: paste the SHA-1 from Step 1
6. **Create**
7. Copy the Client ID → paste into `mobile/src/auth/config.ts`
   as `OAUTH_ANDROID_CLIENT_ID`.

> When you build a release version with a different keystore, repeat 5b
> with that keystore's SHA-1, otherwise sign-in will fail in production.

---

## Step 6 — Rebuild the app

The Google Sign-In SDK includes native code, so you need a real rebuild
(not just a Metro reload):

```powershell
cd C:\Users\pateld42\Documents\GitHub\Youtube-AdsFree\mobile
npm run android
```

After install, open Settings → tap **Sign in with Google** → the native
account picker appears. Pick your account and you're in.

---

## What you get after sign-in

* **In Settings**: avatar + name + email show up. Sign-out works.
* **In the WebView**: nothing changes automatically. Google does not allow
  third-party apps to mint `youtube.com` cookies, so to see your real
  subscription feed in the Watch tab, you also need to **sign in once
  inside the WebView** (tap the profile icon at the top of YouTube and
  follow the web sign-in). After that, the cookies persist forever and
  you'll never need to sign in again on that device.
* **Future native features** (if/when we add them): subscription list,
  playlist list, watch later — all served by the YouTube Data API using
  your access token.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `DEVELOPER_ERROR` | SHA-1 doesn't match. Re-run Step 1 and Step 5b. Make sure the package name is exactly `com.adsfreeplayer`. |
| `SIGN_IN_REQUIRED` after first launch | Normal — the silent restore failed (e.g. revoked access). Tap Sign in. |
| `Access blocked: ... has not completed verification` | You're not in the Test Users list. Add your Gmail in Step 4 → Test users. |
| Sign-in picker opens then closes immediately | Web Client ID is wrong. Double-check `OAUTH_WEB_CLIENT_ID` in `config.ts`. |
| `Play Services not available` on emulator | Use an emulator image **with Google Play** (look for the Play Store icon in Android Studio's AVD list). The Pixel_10 image you're using should be fine. |
