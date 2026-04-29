// ModeToggle — three pill buttons (Cinema / Minimal / Productivity).

import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors, radius, spacing, typography} from '../theme';
import {ModeType} from '../store/types';

interface ModeOption {
  value: ModeType;
  label: string;
}

const MODES: ModeOption[] = [
  {value: 'cinema', label: '🎬 Cinema'},
  {value: 'minimal', label: '⚡ Minimal'},
  {value: 'productivity', label: '💼 Productivity'},
];

export interface ModeToggleProps {
  value: ModeType;
  onChange: (mode: ModeType) => void;
}

export function ModeToggle(props: ModeToggleProps): React.ReactElement {
  const {value, onChange} = props;
  return (
    <View style={styles.row}>
      {MODES.map(opt => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            activeOpacity={0.7}
            onPress={() => onChange(opt.value)}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{selected: active}}>
            <Text style={[styles.label, active && styles.labelActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipActive: {
    backgroundColor: colors.accent.red,
  },
  label: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
  },
  labelActive: {
    color: colors.text.primary,
    fontWeight: 'bold',
  },
});
