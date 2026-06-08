// TabBar — animated bottom tab bar that:
//   • Auto-hides when a video is playing (URL contains ?v=)
//   • Slides back in on swipe-up, then auto-hides again after 3 s of inactivity
//   • Uses react-native-reanimated for 60 fps spring animation (no JS thread)
//   • Exposes the same visual API as @react-navigation/bottom-tabs' tabBar prop
//
// Design:
//   Two full-width content tabs (YouTube, YT Music) + compact Settings icon.
//   Active tab shows a 3 px red indicator bar at the top.
//   NO opacity animation — translateY only, which avoids the Android black-flash
//   bug caused by the hardware texture layer when opacity drops to 0.

import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
  type GestureStateChangeEvent,
  type PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';

import {useStore} from '../store/useStore';
import {colors, typography, spacing, radius} from '../theme';

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

// Spring config: snappy entry (user swiped up), gentle exit.
const SPRING_CONFIG = {damping: 22, stiffness: 220, mass: 0.7};

// How long the bar stays visible after a swipe-up during video playback (ms).
const AUTO_HIDE_MS = 3000;

// Tab display metadata keyed by route name.
const TAB_META: Record<string, {label: string; icon: string}> = {
  YouTube: {label: 'YouTube', icon: '\u25B6'},   // ▶ solid triangle
  YTMusic: {label: 'Music', icon: '\u266B'},      // ♫ beamed notes
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TabBar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps): React.ReactElement {
  const perSiteNavState = useStore(s => s.perSiteNavState);

  const videoActive = React.useMemo(
    () => Object.values(perSiteNavState).some(v => isVideoUrl(v.currentUrl)),
    [perSiteNavState],
  );

  // Real bar height measured after layout so translateY exactly covers it.
  const [barHeight, setBarHeight] = React.useState<number>(
    Platform.select({ios: 64, android: 56}) ?? 60,
  );
  const onLayout = React.useCallback(
    (e: LayoutChangeEvent) => setBarHeight(e.nativeEvent.layout.height),
    [],
  );

  // translateY only — no opacity animation (opacity=0 causes Android black flash).
  const translateY = useSharedValue<number>(0);

  // JS-side hidden flag — drives pointerEvents so the off-screen bar can't
  // intercept touches on the underlying WebView.
  const [hidden, setHidden] = React.useState(false);

  const hideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHiddenRef = React.useRef<boolean>(false);

  const hide = React.useCallback(() => {
    isHiddenRef.current = true;
    translateY.value = withSpring(barHeight, SPRING_CONFIG, () => runOnJS(setHidden)(true));
  }, [barHeight, translateY]);

  const show = React.useCallback(
    (autoHideAfter?: number) => {
      isHiddenRef.current = false;
      setHidden(false);
      translateY.value = withSpring(0, SPRING_CONFIG);
      if (autoHideAfter) {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
          if (videoActive) hide();
        }, autoHideAfter);
      }
    },
    [translateY, videoActive, hide],
  );

  React.useEffect(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (videoActive) {
      hideTimerRef.current = setTimeout(() => hide(), 800);
    } else {
      show();
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoActive]);

  const swipeUpGesture = Gesture.Pan().onEnd(
    (e: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
      if (e.velocityY < -300 || e.translationY < -30) {
        runOnJS(show)(AUTO_HIDE_MS);
      }
    },
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
  }));

  const safeBottom = insets?.bottom ?? 0;

  const mainRoutes = state.routes.filter(r => r.name !== 'Settings');
  const settingsIndex = state.routes.findIndex(r => r.name === 'Settings');
  const settingsFocused = state.index === settingsIndex;

  return (
    <GestureDetector gesture={swipeUpGesture}>
      <Animated.View
        pointerEvents={hidden ? 'none' : 'auto'}
        style={[styles.container, {paddingBottom: safeBottom}, animatedStyle]}
        onLayout={onLayout}>
        {/* Top separator */}
        <View style={styles.topBorder} />

        {mainRoutes.map(route => {
          const routeIndex = state.routes.findIndex(r => r.key === route.key);
          const isFocused = state.index === routeIndex;
          const meta = TAB_META[route.name] ?? {label: route.name, icon: '\u25CF'};
          const {options} = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === 'string' ? options.tabBarLabel : meta.label;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({type: 'tabLongPress', target: route.key});
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? {selected: true} : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}>
              {/* Active indicator pill at the very top of the tab */}
              <View
                style={[styles.indicator, isFocused && styles.indicatorActive]}
              />
              <Text
                style={[
                  styles.icon,
                  {color: isFocused ? colors.accent.red : colors.text.tertiary},
                ]}>
                {meta.icon}
              </Text>
              <Text
                style={[
                  styles.label,
                  {
                    color: isFocused ? colors.text.primary : colors.text.tertiary,
                    fontWeight: isFocused ? '600' : '400',
                  },
                ]}>
                {label}
              </Text>
            </Pressable>
          );
        })}

        {/* Settings — compact icon, not a full tab */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          accessibilityState={settingsFocused ? {selected: true} : {}}
          onPress={() => navigation.navigate('Settings')}
          style={styles.gearBtn}>
          {/* Active indicator for settings */}
          <View
            style={[styles.indicator, settingsFocused && styles.indicatorActive]}
          />
          <Text
            style={[
              styles.gearIcon,
              {color: settingsFocused ? colors.accent.red : colors.text.tertiary},
            ]}>
            {/* U+2699 GEAR — plain text, no emoji variation selector */}
            {'\u2699'}
          </Text>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    // Ensure we always have an opaque background (never transparent/black flash).
    ...Platform.select({
      android: {
        height: 56,
        elevation: 12,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -1},
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
    }),
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.medium,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
    minHeight: 48,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 36,
    height: 3,
    borderRadius: radius.full,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: colors.accent.red,
  },
  icon: {
    fontSize: 18,
    lineHeight: 22,
    marginBottom: 2,
  },
  label: {
    fontSize: typography.fontSize.xs,
    letterSpacing: 0.2,
  },
  gearBtn: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
    minHeight: 48,
  },
  gearIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
});

