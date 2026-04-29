// Convenience hook returning settings + an updater. Wraps the Zustand store
// to give screens a familiar `useSettings()` API.

import {useStore} from '../store/useStore';
import {AppSettings} from '../store/types';

export interface UseSettingsResult {
  settings: AppSettings;
  isLoading: boolean;
  update: (partial: Partial<AppSettings>) => void;
  reset: () => void;
}

export function useSettings(): UseSettingsResult {
  const settings = useStore(s => s.settings);
  const isLoading = useStore(s => s.isLoading);
  const update = useStore(s => s.updateSettings);
  const reset = useStore(s => s.resetSettings);
  return {settings, isLoading, update, reset};
}
