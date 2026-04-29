// SearchBar — pill-shaped input used on Home (read-only nav target) and Search.

import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {colors, radius, spacing, typography} from '../theme';

export interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: (text: string) => void;
  onPress?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  editable?: boolean;
  style?: ViewStyle;
}

export function SearchBar(props: SearchBarProps): React.ReactElement {
  const {
    value,
    onChangeText,
    onSubmit,
    onPress,
    placeholder = 'Search YouTube...',
    autoFocus = false,
    editable = true,
    style,
  } = props;

  const showClear = editable && (value ?? '').length > 0;

  // When non-editable, render a pressable surface that navigates to Search.
  if (!editable) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={[styles.container, style]}
        accessibilityRole="search">
        <Text style={styles.icon}>🔍</Text>
        <Text style={[styles.input, styles.placeholderText]} numberOfLines={1}>
          {placeholder}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>🔍</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={() => onSubmit?.(value ?? '')}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        autoFocus={autoFocus}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel="Search videos"
      />
      {showClear ? (
        <TouchableOpacity
          onPress={() => onChangeText?.('')}
          accessibilityLabel="Clear search"
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Text style={styles.clear}>×</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.full,
    height: 44,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
    color: colors.text.tertiary,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    padding: 0,
  },
  placeholderText: {
    color: colors.text.tertiary,
  },
  clear: {
    color: colors.text.secondary,
    fontSize: 22,
    paddingHorizontal: spacing.sm,
  },
});
