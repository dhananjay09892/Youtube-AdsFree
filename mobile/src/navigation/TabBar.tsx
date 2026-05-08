// TabBar — animated bottom tab bar that:
//   • Auto-hides when a video is playing (URL contains ?v=)
//   • Slides back in on swipe-up, then auto-hides again after 3 s of inactivity
//   • Uses react-native-reanimated for 60 fps spring animation (no JS thread)
//   • Exposes the same visual API as @react-navigation/bottom-tabs' tabBar prop

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
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
import {colors, typography, spacing} from '../theme';

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

// Spring config: fast entry (user swiped up), slow exit after auto-hide timer.
const SPRING_CONFIG = {damping: 20, stiffness: 200, mass: 0.8};

// How long the bar stays visible after a swipe-up during video playback (ms).
const AUTO_HIDE_MS = 3000;

// Tab icon + label definitions keyed by route name.
const TAB_META: Record<string, {active: string; inactive: string; label: string}> = {
  Home: {active: '🏠', inactive: '🏚', label: 'Home'},
  Search: {active: '🔎', inactive: '🔍', label: 'Search'},
  Watch: {active: '▶️', inactive: '⏵', label: 'Watch'},
  Settings: {active: '⚙️', inactive: '⚙', label: 'Settings'},
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

  // Check every tracked URL for a video watch page.
  const videoActive = React.useMemo(
    () => Object.values(perSiteNavState).some(v => isVideoUrl(v.currentUrl)),
    [perSiteNavState],
  );

  // Measure the real bar height so the translateY exactly matches.
  const [barHeight, setBarHeight] = React.useState<number>(60 + (insets?.bottom ?? 0));
  const onLayout = React.useCallback(
    (e: LayoutChangeEvent) => setBarHeight(e.nativeEvent.layout.height),
    [],
  );

  // Shared values live on the UI thread — no Bridge round-trips.
  const translateY = useSharedValue<number>(0);
  const opacity = useSharedValue<number>(1);

  // Auto-hide timer ref (JS-side — only set/cleared when videoActive changes).
  const hideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHiddenRef = React.useRef<boolean>(false);

  const hide = React.useCallback(() => {
    isHiddenRef.current = true;
    translateY.value = withSpring(barHeight, SPRING_CONFIG);
    opacity.value = withTiming(0, {duration: 250});
  }, [barHeight, translateY, opacity]);

  const show = React.useCallback(
    (autoHideAfter?: number) => {
      isHiddenRef.current = false;
      translateY.value = withSpring(0, SPRING_CONFIG);
      opacity.value = withTiming(1, {duration: 150});
      if (autoHideAfter) {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
          if (videoActive) hide();
        }, autoHideAfter);
      }
    },
    [translateY, opacity, videoActive, hide],
  );

  // React to video-active state: hide when a video starts, show when it ends.
  React.useEffect(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (videoActive) {
      // Short delay so the bar doesn't vanish the instant the URL changes.
      hideTimerRef.current = setTimeout(() => hide(), 800);
    } else {
      show();
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoActive]);

  // Swipe-up gesture to temporarily reveal the bar during video playback.
  const swipeUpGesture = Gesture.Pan()
    .onEnd((e: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
      // velocityY is negative when the user swipes up.
      if (e.velocityY < -300 || e.translationY < -30) {
        runOnJS(show)(AUTO_HIDE_MS);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
    opacity: opacity.value,
  }));

  const safeBottom = insets?.bottom ?? 0;

  return (
    <GestureDetector gesture={swipeUpGesture}>
      <Animated.View
        style={[styles.container, {paddingBottom: safeBottom}, animatedStyle]}
        onLayout={onLayout}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const meta = TAB_META[route.name] ?? {
            active: '●',
            inactive: '○',
            label: route.name,
          };
          const {options} = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : meta.label;

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
              <Text style={styles.icon}>{isFocused ? meta.active : meta.inactive}</Text>
              <Text
                style={[
                  styles.label,
                  {color: isFocused ? colors.accent.red : colors.text.tertiary},
                ]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
    // Android shadow
    elevation: 8,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    ...Platform.select({
      android: {height: 60},
      ios: {},
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    minHeight: 48, // accessibility min touch target
  },
  icon: {
    fontSize: 22,
    lineHeight: 28,
  },
  label: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
});
