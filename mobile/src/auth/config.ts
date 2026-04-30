// OAuth client IDs created in Google Cloud Console.
// See ./AUTH_SETUP.md for step-by-step instructions on how to create them.
//
// SECURITY NOTE: These are *public client IDs*, not secrets. They are safe
// to commit to source control. Google identifies your app by combining the
// client ID with your app's package name (com.adsfreeplayer) and the
// SHA-1 fingerprint of your signing certificate, which Google verifies
// server-side. A leaked client ID alone cannot be used to impersonate you.

// The Web application client ID. Required by @react-native-google-signin
// even on Android — it is used to request the OAuth ID token.
// Format: 1234567890-abc...xyz.apps.googleusercontent.com
export const OAUTH_WEB_CLIENT_ID =
  'REPLACE_ME_WITH_WEB_CLIENT_ID.apps.googleusercontent.com';

// The Android OAuth client ID — created with package name + SHA-1.
// Not directly used in JS (the SDK looks it up server-side via the package
// name + fingerprint), but kept here for visibility.
export const OAUTH_ANDROID_CLIENT_ID =
  'REPLACE_ME_WITH_ANDROID_CLIENT_ID.apps.googleusercontent.com';
