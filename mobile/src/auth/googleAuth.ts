// Native Google Sign-In service — wraps @react-native-google-signin/google-signin.
//
// Why we need this in addition to the in-WebView sign-in:
//   * Native sign-in gives us an OAuth access token, which is the only way
//     to reliably call the YouTube Data API for things like the user's
//     subscription list, playlists, watch history, etc.
//   * It also gives us the user's profile (name, email, avatar) so our
//     Settings screen can show "Signed in as X".
//   * Note: this does NOT automatically sign the user into the WebView.
//     That still requires a one-time sign-in inside the WebView itself
//     (Google does not let third-party apps mint youtube.com cookies).
//     We trigger that flow from the same button so the user only has to
//     do it once.

import {
  GoogleSignin,
  statusCodes,
  type User,
} from '@react-native-google-signin/google-signin';

import {OAUTH_WEB_CLIENT_ID} from './config';

// Scopes we ask for. We need the YouTube read scopes to fetch the user's
// own subscriptions, playlists, watch later, etc.
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube.force-ssl',
  // openid/email/profile come for free with most flows but listing them
  // explicitly avoids a "not granted" error on some Google accounts.
  'openid',
  'email',
  'profile',
];

let configured = false;

function ensureConfigured(): void {
  if (configured) {
    return;
  }
  GoogleSignin.configure({
    webClientId: OAUTH_WEB_CLIENT_ID,
    offlineAccess: true,
    scopes: SCOPES,
    forceCodeForRefreshToken: true,
  });
  configured = true;
}

export interface SignedInUser {
  id: string;
  name: string | null;
  email: string;
  photo: string | null;
  accessToken: string | null;
}

function toSignedInUser(user: User, accessToken: string | null): SignedInUser {
  return {
    id: user.user.id,
    name: user.user.name ?? null,
    email: user.user.email,
    photo: user.user.photo ?? null,
    accessToken,
  };
}

export async function signIn(): Promise<SignedInUser> {
  ensureConfigured();
  // Verify Play Services is available (Android only — no-op on iOS).
  await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});

  const user = await GoogleSignin.signIn();
  // Tokens are fetched separately so we get a fresh access token.
  const tokens = await GoogleSignin.getTokens();
  return toSignedInUser(user, tokens.accessToken);
}

export async function signOut(): Promise<void> {
  ensureConfigured();
  try {
    await GoogleSignin.revokeAccess();
  } catch {
    // Ignore — the user may not have granted offline access.
  }
  await GoogleSignin.signOut();
}

// Best-effort restore of a previously signed-in user (e.g. on app launch).
export async function restoreUser(): Promise<SignedInUser | null> {
  ensureConfigured();
  try {
    const isSignedIn = await GoogleSignin.isSignedIn();
    if (!isSignedIn) {
      return null;
    }
    const user = await GoogleSignin.signInSilently();
    const tokens = await GoogleSignin.getTokens();
    return toSignedInUser(user, tokens.accessToken);
  } catch (err: unknown) {
    const code = (err as {code?: string} | null)?.code;
    if (code === statusCodes.SIGN_IN_REQUIRED) {
      return null;
    }
    return null;
  }
}
