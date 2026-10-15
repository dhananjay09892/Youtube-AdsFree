// TabBar — floating icon pill that overlays the page instead of reserving a
// strip at the bottom, so the WebView uses the whole screen.
//
//   • Absolutely positioned: takes ZERO layout space (the old bar always
//     shrank the page by its own height, even while slid off-screen).
//   • Four 48 pt targets near the thumb: YouTube, Music, Search, Settings.
//   • Hides while scrolling down and on video pages; scrolling up brings it
//     back. A small grab handle at the bottom edge also brings it back.
//   • translateY only — no opacity animation (opacity=0 causes an Android
//     black flash with the hardware texture layer).

import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';

import {SearchOverlay} from '../components/SearchOverlay';
import {ytMusicConfig} from '../config/ytmusic.site';
import {youtubeConfig} from '../config/youtube.site';
import {useStore} from '../store/useStore';
import {colors, radius, spacing} from '../theme';
import {shouldHideBar} from './barVisibility';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true when the given URL is a YouTube watch page. */
function isVideoUrl(url: string | undefined): boolean {
  if (!url) {
    return false;
  }
  return url.includes('?v=') || url.includes('&v=');
}

const SPRING_CONFIG = {damping: 22, stiffness: 220, mass: 0.7};
// How long the pill stays visible after the user asks for it on a video page.
const AUTO_HIDE_MS = 3000;
const PILL_HEIGHT = 56;
const BOTTOM_GAP = 12;

const TAB_META: Record<string, {label: string; icon: string}> = {
  YouTube: {label: 'YouTube', icon: '▶'}, // ▶
  YTMusic: {label: 'YT Music', icon: '♫'}, // ♫
};

// Which site + WebView tabId the search overlay should drive.
const SEARCH_TARGETS = {
  YouTube: {site: youtubeConfig, tabId: 'youtube:/'},
  YTMusic: {site: ytMusicConfig, tabId: 'ytmusic:/'},
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TabBar({
  state,
  navigation,
  insets,
}: BottomTabBarProps): React.ReactElement {
  const perSiteNavState = useStore(s => s.perSiteNavState);
  const scrollDir = useStore(s => s.scrollDir);
  const setScrollDir = useStore(s => s.setScrollDir);
  const searchOpen = useStore(s => s.searchOpen);
  const setSearchOpen = useStore(s => s.setSearchOpen);

  const videoActive = React.useMemo(
    () => Object.values(perSiteNavState).some(v => isVideoUrl(v.currentUrl)),
    [perSiteNavState],
  );

  const safeBottom = insets?.bottom ?? 0;
  const hideOffset = PILL_HEIGHT + safeBottom + BOTTOM_GAP + 8;

  const activeName = state.routes[state.index].name;
  const onSettings = activeName === 'Settings';

  const translateY = useSharedValue<number>(0);
  // JS-side flag so the off-screen pill can't intercept touches.
  const [hidden, setHidden] = React.useState(false);
  const hideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = React.useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const hide = React.useCallback(() => {
    translateY.value = withSpring(hideOffset, SPRING_CONFIG, () =>
      runOnJS(setHidden)(true),
    );
  }, [hideOffset, translateY]);

  const show = React.useCallback(
    (autoHideAfter?: number) => {
      clearTimer();
      setHidden(false);
      translateY.value = withSpring(0, SPRING_CONFIG);
      if (autoHideAfter) {
        hideTimerRef.current = setTimeout(hide, autoHideAfter);
      }
    },
    [clearTimer, hide, translateY],
  );

  const wantHidden = shouldHideBar({
    scrollDown: scrollDir === 'down',
    videoActive,
    onSettings,
    searchOpen,
  });

  React.useEffect(() => {
    clearTimer();
    if (wantHidden) {
      // Small delay on video pages so the pill doesn't vanish mid-tap.
      hideTimerRef.current = setTimeout(hide, videoActive ? 800 : 0);
    } else {
      show();
    }
    return clearTimer;
  }, [wantHidden, videoActive, hide, show, clearTimer]);

  // Scrolling up on a video page: peek the pill, then tuck it away again.
  React.useEffect(() => {
    if (scrollDir === 'up' && videoActive && !onSettings && !searchOpen) {
      show(AUTO_HIDE_MS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollDir]);

  // New screen = fresh scroll state, otherwise a stale "down" would hide the
  // pill on the page we just switched to.
  React.useEffect(() => {
    setScrollDir('up');
  }, [state.index, setScrollDir]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
  }));

  const goTo = (name: 'YouTube' | 'YTMusic' | 'Settings'): void => {
    if (state.routes[state.index].name !== name) {
      navigation.navigate(name);
    }
  };

  const openSearch = (): void => {
    // Settings has no page to search — jump to YouTube first.
    if (onSettings) {
      navigation.navigate('YouTube');
    }
    setSearchOpen(true);
  };

  const searchTarget =
    activeName === 'YTMusic' ? SEARCH_TARGETS.YTMusic : SEARCH_TARGETS.YouTube;

  const items: Array<{
    key: string;
    icon: string;
    label: string;
    focused: boolean;
    onPress: () => void;
  }> = [
    {
      key: 'YouTube',
      icon: TAB_META.YouTube.icon,
      label: TAB_META.YouTube.label,
      focused: activeName === 'YouTube',
      onPress: () => goTo('YouTube'),
    },
    {
      key: 'YTMusic',
      icon: TAB_META.YTMusic.icon,
      label: TAB_META.YTMusic.label,
      focused: activeName === 'YTMusic',
      onPress: () => goTo('YTMusic'),
    },
    {
      key: 'Search',
      icon: '\u{1F50D}',
      label: 'Search',
      focused: searchOpen,
      onPress: openSearch,
    },
    {
      key: 'Settings',
      icon: '⚙',
      label: 'Settings',
      focused: onSettings,
      onPress: () => goTo('Settings'),
    },
  ];

  return (
    <>
      {searchOpen ? (
        <SearchOverlay tabId={searchTarget.tabId} site={searchTarget.site} />
      ) : null}

      <Animated.View
        pointerEvents={hidden ? 'none' : 'box-none'}
        style={[styles.wrap, {bottom: safeBottom + BOTTOM_GAP}, animatedStyle]}>
        <View style={styles.pill}>
          {items.map(item => (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={item.focused ? {selected: true} : {}}
              onPress={item.onPress}
              hitSlop={4}
              style={[styles.btn, item.focused && styles.btnActive]}>
              <Text
                style={[
                  styles.icon,
                  {color: item.focused ? colors.accent.red : colors.text.secondary},
                ]}>
                {item.icon}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {/* Grab handle — only while the pill is tucked away */}
      {hidden && !searchOpen ? (
        <View
          pointerEvents="box-none"
          style={[styles.handleWrap, {bottom: safeBottom + 2}]}>
          <Pressable
            onPress={() => show(AUTO_HIDE_MS)}
            accessibilityRole="button"
            accessibilityLabel="Show menu"
            hitSlop={{top: 16, bottom: 8, left: 24, right: 24}}
            style={styles.handleHit}>
            <View style={styles.handle} />
          </Pressable>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: PILL_HEIGHT,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
    // Opaque so the page never shows through (and no Android black flash).
    backgroundColor: '#161616',
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.medium,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  btn: {
    width: 56,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActive: {
    backgroundColor: 'rgba(255,0,0,0.16)',
  },
  icon: {
    fontSize: 22,
    lineHeight: 26,
  },
  handleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  handleHit: {
    paddingVertical: 6,
    paddingHorizontal: 24,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
});
