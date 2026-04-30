// Shared TypeScript types for the app.

export type ModeType = 'cinema' | 'minimal' | 'productivity';

export interface AppSettings {
  mode: ModeType;
  hideShorts: boolean;
  hideAds: boolean;
  hideComments: boolean;
  hideTrending: boolean;
  darkMode: boolean;
  roundedPlayer: boolean;
  textSize: 'small' | 'medium' | 'large';
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
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  loadSettingsFromStorage: () => Promise<void>;
  saveSettingsToStorage: () => Promise<void>;
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
};
