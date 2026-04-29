// SearchScreen — local search box that opens YouTube's search results page
// inside our in-app browser. Recent searches are persisted via the store.

import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {YouTubeWebView} from '../components/YouTubeWebView';
import {useStore} from '../store/useStore';
import {colors, radius, spacing, typography} from '../theme';

export function SearchScreen(): React.ReactElement {
  const recent = useStore(s => s.recentSearches);
  const addRecent = useStore(s => s.addRecentSearch);
  const clearRecent = useStore(s => s.clearRecentSearches);

  const [query, setQuery] = React.useState<string>('');
  const [submitted, setSubmitted] = React.useState<string>('');

  const submit = (text: string): void => {
    const t = text.trim();
    if (!t) {
      return;
    }
    addRecent(t);
    setQuery(t);
    setSubmitted(t);
  };

  if (submitted) {
    const path = `/results?search_query=${encodeURIComponent(submitted)}`;
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.searchRow}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => submit(query)}
            returnKeyType="search"
            placeholder="Search YouTube..."
            placeholderTextColor={colors.text.tertiary}
            style={styles.input}
          />
          <TouchableOpacity onPress={() => setSubmitted('')} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.flex}>
          <YouTubeWebView path={path} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.searchRow}>
        <TextInput
          autoFocus
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => submit(query)}
          returnKeyType="search"
          placeholder="Search YouTube..."
          placeholderTextColor={colors.text.tertiary}
          style={styles.input}
        />
      </View>

      <View style={styles.recentHeader}>
        <Text style={styles.sectionLabel}>Recent searches</Text>
        {recent.length > 0 ? (
          <TouchableOpacity onPress={clearRecent}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={recent}
        keyExtractor={item => item}
        renderItem={({item}) => (
          <TouchableOpacity onPress={() => submit(item)} style={styles.recentRow}>
            <Text style={styles.recentIcon}>🕐</Text>
            <Text style={styles.recentText}>{item}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Type a search and press enter.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.background.primary},
  flex: {flex: 1},
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
  },
  cancelBtn: {paddingHorizontal: spacing.sm},
  cancelText: {color: colors.accent.red, fontSize: typography.fontSize.sm},
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sectionLabel: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.sm,
    textTransform: 'uppercase',
  },
  clearText: {color: colors.accent.red, fontSize: typography.fontSize.sm},
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  recentIcon: {marginRight: spacing.sm},
  recentText: {color: colors.text.primary, fontSize: typography.fontSize.md},
  emptyText: {
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.xxxl,
    paddingHorizontal: spacing.lg,
  },
});
