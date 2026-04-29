// SettingsScreen — mode picker, content filter toggles, appearance toggles,
// reset button. All changes auto-persist via Zustand store.

import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {colors, radius, spacing, typography} from '../theme';
import {useSettings} from '../hooks/useSettings';
import {ModeToggle} from '../components/ModeToggle';
import {AppSettings, ModeType} from '../store/types';

const APP_VERSION = '1.0.0';

interface ToggleRowProps {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}

function ToggleRow({label, value, onChange}: ToggleRowProps): React.ReactElement {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{
          true: colors.accent.red,
          false: colors.background.tertiary,
        }}
        thumbColor={colors.text.primary}
      />
    </View>
  );
}

export function SettingsScreen(): React.ReactElement {
  const {settings, update, reset} = useSettings();

  const setMode = (m: ModeType): void => update({mode: m});
  const setBool = (k: keyof AppSettings) => (v: boolean) =>
    update({[k]: v} as Partial<AppSettings>);

  const handleReset = (): void => {
    Alert.alert(
      'Reset settings?',
      'All preferences will be restored to their defaults.',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Reset', style: 'destructive', onPress: () => reset()},
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.screenTitle}>⚙️ Settings</Text>

        <Text style={styles.sectionLabel}>View Mode</Text>
        <ModeToggle value={settings.mode} onChange={setMode} />

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>Content Filters</Text>
        <ToggleRow
          label="Hide Shorts"
          value={settings.hideShorts}
          onChange={setBool('hideShorts')}
        />
        <ToggleRow
          label="Hide Ads"
          value={settings.hideAds}
          onChange={setBool('hideAds')}
        />
        <ToggleRow
          label="Hide Comments"
          value={settings.hideComments}
          onChange={setBool('hideComments')}
        />
        <ToggleRow
          label="Hide Trending"
          value={settings.hideTrending}
          onChange={setBool('hideTrending')}
        />

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>Appearance</Text>
        <ToggleRow
          label="Dark Mode"
          value={settings.darkMode}
          onChange={setBool('darkMode')}
        />
        <ToggleRow
          label="Rounded Player"
          value={settings.roundedPlayer}
          onChange={setBool('roundedPlayer')}
        />

        <View style={styles.divider} />

        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetText}>Reset to Defaults</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version {APP_VERSION}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  screenTitle: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xxl,
    fontWeight: 'bold',
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.xs,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  rowLabel: {
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing.md,
  },
  resetBtn: {
    backgroundColor: colors.background.tertiary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  resetText: {
    color: colors.status.error,
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
  },
  version: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
