// Sidebar — placeholder for future tablet/landscape navigation. Not yet used.

import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, spacing, typography} from '../theme';

export function Sidebar(): React.ReactElement {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Sidebar (placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 240,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
  },
  text: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.sm,
  },
});
