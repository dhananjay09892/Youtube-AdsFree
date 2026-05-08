// Shared TypeScript types for the app.

export type ModeType = 'cinema' | 'minimal' | 'productivity';

// Mirrors auth/googleAuth.ts SignedInUser — redeclared here to avoid the
// store importing the auth module (which pulls in native code at test time).
export interface SignedInUser {
  id: string;
  name: string | null;
  email: string;
  photo: string | null;
  accessToken: string | null;
}

export interface AppSettings {
  mode: ModeType;
  hideShorts: boolean;
  hideAds: boolean;
  hideComments: boolean;
  hideTrending: boolean;
  darkMode: boolean;
  roundedPlayer: boolean;
  textSize: 'small' | 'medium' | 'large';
  // Keep audio playing when the app is backgrounded or the screen is off.
  backgroundPlay: boolean;
}

export interface Video {
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  viewCount: string;
  duration: string;
  publishedAt: string;
  category: string;
  description: string;
}

export interface AppStore {
  settings: AppSettings;
  isLoading: boolean;
  recentSearches: string[];
  signedInUser: SignedInUser | null;
  /** ID of the currently active site (e.g. 'youtube'). */
  activeSiteId: string;
  /** Most-recently-navigated URL per tab, keyed by tabId string. */
  perSiteNavState: Record<string, {currentUrl: string}>;
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  setSignedInUser: (user: SignedInUser | null) => void;
  loadSettingsFromStorage: () => Promise<void>;
  saveSettingsToStorage: () => Promise<void>;
  /** Called by SiteWebView on every navigation so the TabBar can read the current URL. */
  updateTabUrl: (tabId: string, url: string) => void;
}

// Default settings used on first launch and on Reset.
export const DEFAULT_SETTINGS: AppSettings = {
  mode: 'productivity',
  hideShorts: true,
  hideAds: true,
  hideComments: false,
  hideTrending: true,
  darkMode: true,
  roundedPlayer: true,
  textSize: 'medium',
  backgroundPlay: true,
};
