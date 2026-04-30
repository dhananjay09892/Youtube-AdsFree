// SettingsScreen — mode picker, content filter toggles, appearance toggles,
// reset button. All changes auto-persist via Zustand store.

import React from 'react';
import {
  Alert,
  Image,
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
import {useStore} from '../store/useStore';
import {signIn, signOut} from '../auth/googleAuth';

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
  const signedInUser = useStore(s => s.signedInUser);
  const setSignedInUser = useStore(s => s.setSignedInUser);
  const [authBusy, setAuthBusy] = React.useState<boolean>(false);

  const setMode = (m: ModeType): void => update({mode: m});
  const setBool = (k: keyof AppSettings) => (v: boolean) =>
    update({[k]: v} as Partial<AppSettings>);

  const handleSignIn = async (): Promise<void> => {
    setAuthBusy(true);
    try {
      const user = await signIn();
      setSignedInUser(user);
      Alert.alert(
        'Signed in',
        `Welcome, ${user.name ?? user.email}!\n\nTo see your subscriptions and playlists in the Watch tab, also tap the profile icon inside YouTube and sign in there once. Your sign-in will then persist forever.`,
      );
    } catch (err: unknown) {
      const message =
        (err as {message?: string} | null)?.message ?? 'Unknown error';
      Alert.alert('Sign-in failed', message);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async (): Promise<void> => {
    setAuthBusy(true);
    try {
      await signOut();
      setSignedInUser(null);
    } catch (err: unknown) {
      const message =
        (err as {message?: string} | null)?.message ?? 'Unknown error';
      Alert.alert('Sign-out failed', message);
    } finally {
      setAuthBusy(false);
    }
  };

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

        <Text style={styles.sectionLabel}>Account</Text>
        {signedInUser ? (
          <View style={styles.accountCard}>
            {signedInUser.photo ? (
              <Image
                source={{uri: signedInUser.photo}}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarFallbackText}>
                  {(signedInUser.name ?? signedInUser.email)
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.accountInfo}>
              <Text style={styles.accountName} numberOfLines={1}>
                {signedInUser.name ?? signedInUser.email}
              </Text>
              <Text style={styles.accountEmail} numberOfLines={1}>
                {signedInUser.email}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={handleSignOut}
              disabled={authBusy}>
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={handleSignIn}
            disabled={authBusy}>
            <Text style={styles.signInText}>
              {authBusy ? 'Signing in…' : 'Sign in with Google'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.divider} />

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

        <Text style={styles.sectionLabel}>Playback</Text>
        <ToggleRow
          label="Background Playback (audio in background)"
          value={settings.backgroundPlay}
          onChange={setBool('backgroundPlay')}
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
  signInBtn: {
    backgroundColor: colors.accent.red,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  signInText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.tertiary,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
  },
  accountInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  accountName: {
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  accountEmail: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  signOutBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  signOutText: {
    color: colors.accent.red,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  version: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
