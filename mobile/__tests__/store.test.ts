// Tests for the Zustand store: defaults, updates, reset, persistence,
// and recent-search dedupe/cap behavior.

import AsyncStorage from '@react-native-async-storage/async-storage';
import {useStore} from '../src/store/useStore';
import {DEFAULT_SETTINGS} from '../src/store/types';

beforeEach(async () => {
  await AsyncStorage.clear();
  // Reset Zustand store between tests.
  useStore.setState({
    settings: DEFAULT_SETTINGS,
    isLoading: true,
    recentSearches: [],
  });
});

describe('useStore', () => {
  test('starts with default settings', () => {
    expect(useStore.getState().settings).toEqual(DEFAULT_SETTINGS);
  });

  test('updateSettings merges and persists', async () => {
    useStore.getState().updateSettings({mode: 'cinema', hideAds: false});
    // Allow microtask queue to flush the persist promise.
    await new Promise(r => setTimeout(r, 0));

    const s = useStore.getState().settings;
    expect(s.mode).toBe('cinema');
    expect(s.hideAds).toBe(false);
    expect(s.hideShorts).toBe(true);

    const raw = await AsyncStorage.getItem('@youtube_appview/settings/v1');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string);
    expect(parsed.mode).toBe('cinema');
    expect(parsed.hideAds).toBe(false);
  });

  test('resetSettings restores defaults', async () => {
    useStore.getState().updateSettings({mode: 'minimal'});
    useStore.getState().resetSettings();
    await new Promise(r => setTimeout(r, 0));

    expect(useStore.getState().settings).toEqual(DEFAULT_SETTINGS);
  });

  test('loadSettingsFromStorage hydrates persisted values', async () => {
    await AsyncStorage.setItem(
      '@youtube_appview/settings/v1',
      JSON.stringify({...DEFAULT_SETTINGS, mode: 'cinema'}),
    );
    await useStore.getState().loadSettingsFromStorage();

    expect(useStore.getState().settings.mode).toBe('cinema');
    expect(useStore.getState().isLoading).toBe(false);
  });

  test('addRecentSearch dedupes and caps at 10', () => {
    const {addRecentSearch} = useStore.getState();
    for (let i = 0; i < 12; i++) {
      addRecentSearch(`query ${i}`);
    }
    addRecentSearch('query 5'); // should move to front
    const list = useStore.getState().recentSearches;
    expect(list.length).toBe(10);
    expect(list[0]).toBe('query 5');
  });

  test('addRecentSearch ignores empty strings', () => {
    useStore.getState().addRecentSearch('   ');
    expect(useStore.getState().recentSearches).toEqual([]);
  });

  test('clearRecentSearches empties the list', () => {
    useStore.getState().addRecentSearch('hello');
    useStore.getState().clearRecentSearches();
    expect(useStore.getState().recentSearches).toEqual([]);
  });
});
