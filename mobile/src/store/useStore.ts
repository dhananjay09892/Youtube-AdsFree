// Zustand store. Holds app settings + recent searches and persists them
// to AsyncStorage. Settings auto-save whenever they change.

import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AppSettings, AppStore, DEFAULT_SETTINGS} from './types';

const SETTINGS_KEY = '@youtube_appview/settings/v1';
const RECENT_SEARCHES_KEY = '@youtube_appview/recent_searches/v1';
const MAX_RECENT_SEARCHES = 10;

// Persist helper. Logs but does not throw — UI shows toast on failure.
async function persistSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Settings save failed:', error);
    throw error;
  }
}

async function persistRecentSearches(items: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Recent searches save failed:', error);
  }
}

export const useStore = create<AppStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: true,
  recentSearches: [],
  signedInUser: null,
  activeSiteId: 'youtube',
  perSiteNavState: {},


  // Merge a partial update into current settings and auto-persist.
  updateSettings: (partial: Partial<AppSettings>): void => {
    const next = {...get().settings, ...partial};
    set({settings: next});
    void persistSettings(next);
  },

  // Reset all settings to defaults and auto-persist.
  resetSettings: (): void => {
    set({settings: DEFAULT_SETTINGS});
    void persistSettings(DEFAULT_SETTINGS);
  },

  // Add a query to the front of recent searches (deduped, capped).
  addRecentSearch: (query: string): void => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      return;
    }
    const current = get().recentSearches.filter(q => q !== trimmed);
    const next = [trimmed, ...current].slice(0, MAX_RECENT_SEARCHES);
    set({recentSearches: next});
    void persistRecentSearches(next);
  },

  clearRecentSearches: (): void => {
    set({recentSearches: []});
    void persistRecentSearches([]);
  },

  // Set or clear the currently signed-in Google user (in-memory only \u2014
  // GoogleSignin SDK persists its own session under the hood).
  setSignedInUser: (user): void => {
    set({signedInUser: user});
  },

  // Load both settings and recent searches from AsyncStorage on app start.
  loadSettingsFromStorage: async (): Promise<void> => {
    try {
      const [rawSettings, rawSearches] = await Promise.all([
        AsyncStorage.getItem(SETTINGS_KEY),
        AsyncStorage.getItem(RECENT_SEARCHES_KEY),
      ]);

      const settings: AppSettings = rawSettings
        ? {...DEFAULT_SETTINGS, ...(JSON.parse(rawSettings) as Partial<AppSettings>)}
        : DEFAULT_SETTINGS;

      const recentSearches: string[] = rawSearches
        ? (JSON.parse(rawSearches) as string[])
        : [];

      set({settings, recentSearches, isLoading: false});
    } catch (error) {
      console.error('Settings load failed:', error);
      set({settings: DEFAULT_SETTINGS, recentSearches: [], isLoading: false});
    }
  },

  // Manual save (rarely needed — updateSettings auto-persists).
  saveSettingsToStorage: async (): Promise<void> => {
    await persistSettings(get().settings);
  },

  // Record the current URL for a tab so the TabBar can detect video playback.
  updateTabUrl: (tabId: string, url: string): void => {
    const current = get().perSiteNavState;
    set({perSiteNavState: {...current, [tabId]: {currentUrl: url}}});
  },
}));
