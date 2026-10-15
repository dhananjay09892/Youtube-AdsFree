// SearchOverlay — full-width search sheet that slides in at the top when the
// user taps the search button in the floating menu. Replaces the old
// always-visible search pill so the page gets the whole screen.
//
// On submit the search URL is handed to the active WebView through the store's
// pendingNavigation mechanism, so audio playback is never interrupted.

import React from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {SiteConfig} from '../config/siteRegistry';
import {useStore} from '../store/useStore';
import {colors, radius, spacing, typography} from '../theme';

interface SearchOverlayProps {
  /** Must match the tabId used by the SiteWebView that should navigate. */
  tabId: string;
  site: SiteConfig;
}

export function SearchOverlay({tabId, site}: SearchOverlayProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = React.useState('');
  const inputRef = React.useRef<TextInput>(null);

  const recentSearches = useStore(s => s.recentSearches);
  const addRecentSearch = useStore(s => s.addRecentSearch);
  const requestNavigation = useStore(s => s.requestNavigation);
  const setSearchOpen = useStore(s => s.setSearchOpen);

  React.useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  const close = (): void => {
    Keyboard.dismiss();
    setSearchOpen(false);
  };

  const run = (text: string): void => {
    const t = text.trim();
    if (!t) {
      close();
      return;
    }
    addRecentSearch(t);
    requestNavigation(tabId, `${site.baseUrl}${site.searchPath(t)}`);
    close();
  };

  return (
    <View style={styles.root} pointerEvents="box-none">
      {/* Dim backdrop — tap outside the sheet to dismiss */}
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close search" />
      <View style={[styles.sheet, {paddingTop: insets.top + spacing.sm}]}>
        <View style={styles.row}>
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => run(query)}
            returnKeyType="search"
            placeholder={`Search ${site.displayName}...`}
            placeholderTextColor={colors.text.tertiary}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            accessibilityLabel={`Search ${site.displayName}`}
          />
          <TouchableOpacity
            onPress={close}
            hitSlop={{top: 12, bottom: 12, left: 8, right: 8}}
            accessibilityRole="button"
            accessibilityLabel="Cancel search">
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
        {recentSearches.slice(0, 6).map(item => (
          <TouchableOpacity
            key={item}
            style={styles.recent}
            onPress={() => run(item)}
            accessibilityRole="button"
            accessibilityLabel={`Search for ${item}`}>
            <Text style={styles.recentIcon}>{'↻'}</Text>
            <Text style={styles.recentText} numberOfLines={1}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
  },
  cancel: {
    color: colors.accent.blue,
    fontSize: typography.fontSize.md,
  },
  recent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  recentIcon: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.md,
  },
  recentText: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
  },
});
