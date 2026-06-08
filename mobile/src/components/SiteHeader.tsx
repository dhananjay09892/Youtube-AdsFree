// SiteHeader — always-visible search bar pinned above the WebView.
// Tapping the collapsed pill expands it to a full search input.
// On submit the search is injected into the active WebView via the store's
// pendingNavigation mechanism so audio playback is never interrupted.

import React from 'react';
import {
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type {SiteConfig} from '../config/siteRegistry';
import {useStore} from '../store/useStore';
import {colors, radius, spacing, typography} from '../theme';

interface SiteHeaderProps {
  /** Must match the tabId used by the corresponding SiteWebView instance. */
  tabId: string;
  site: SiteConfig;
}

export function SiteHeader({tabId, site}: SiteHeaderProps): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const inputRef = React.useRef<TextInput>(null);

  const addRecentSearch = useStore(s => s.addRecentSearch);
  const requestNavigation = useStore(s => s.requestNavigation);

  const expand = () => {
    setOpen(true);
    // Tiny delay so the input is mounted before auto-focus fires.
    setTimeout(() => inputRef.current?.focus(), 60);
  };

  const collapse = () => {
    setOpen(false);
    setQuery('');
    Keyboard.dismiss();
  };

  const submit = () => {
    const t = query.trim();
    if (!t) {
      collapse();
      return;
    }
    addRecentSearch(t);
    const url = `${site.baseUrl}${site.searchPath(t)}`;
    requestNavigation(tabId, url);
    collapse();
  };

  if (open) {
    return (
      <View style={styles.openRow}>
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={submit}
          returnKeyType="search"
          placeholder={`Search ${site.displayName}...`}
          placeholderTextColor={colors.text.tertiary}
          style={styles.openInput}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        <TouchableOpacity
          onPress={collapse}
          style={styles.cancelBtn}
          hitSlop={{top: 8, bottom: 8, left: 4, right: 4}}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.pill}
      onPress={expand}
      activeOpacity={0.75}>
      <Text style={styles.searchIcon}>{'\u{1F50D}'}</Text>
      <Text style={styles.hintText} numberOfLines={1}>
        Search {site.displayName}...
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.select({ios: 10, android: 8}) ?? 10,
    gap: spacing.sm,
  },
  searchIcon: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  hintText: {
    flex: 1,
    color: colors.text.tertiary,
    fontSize: typography.fontSize.md,
  },
  openRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
    backgroundColor: colors.background.primary,
  },
  openInput: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.select({ios: 10, android: 8}) ?? 10,
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
  },
  cancelBtn: {
    paddingHorizontal: spacing.xs,
  },
  cancelText: {
    color: colors.accent.blue,
    fontSize: typography.fontSize.md,
  },
});
