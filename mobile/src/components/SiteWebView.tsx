// SiteWebView — generic WebView component driven by a SiteConfig.
//
// All site-specific behaviour (CSS selectors, ad-kill JS, early injection,
// User-Agent, etc.) is expressed as data in the SiteConfig object passed to
// this component. YouTubeWebView.tsx is now a thin wrapper that passes
// youtubeConfig here — no other callers need to change.

import React from 'react';
import {ActivityIndicator, AppState, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {WebView} from 'react-native-webview';
import type {WebView as WebViewType} from 'react-native-webview';

import {useStore} from '../store/useStore';
import {colors} from '../theme';
import {NowPlaying} from '../modules/NowPlaying';
import {AndroidMediaSession} from '../modules/AndroidMediaSession';
import type {SiteConfig} from '../config/siteRegistry';
import {
  buildCssFromRules,
  buildEarlyJs,
  buildInjectedJs,
} from '../webview/scriptBuilders';

export interface SiteWebViewProps {
  site: SiteConfig;
  /** Path beginning with "/" appended to site.baseUrl */
  path?: string;
  /** Identifier passed to updateTabUrl so the TabBar can read the current URL. */
  tabId?: string;
}

// ---------------------------------------------------------------------------
// Default Safari-like User-Agent (fallback when site config doesn't override)
// ---------------------------------------------------------------------------

const DEFAULT_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SiteWebView({
  site,
  path = '/',
  tabId,
}: SiteWebViewProps): React.ReactElement {
  const settings = useStore(state => state.settings);
  const updateTabUrl = useStore(state => state.updateTabUrl);
  const pendingNav = useStore(state => tabId ? state.pendingNavigation[tabId] : undefined);
  const clearNavigation = useStore(state => state.clearNavigation);
  const addAdStats = useStore(state => state.addAdStats);
  const setScrollDir = useStore(state => state.setScrollDir);
  const webRef = React.useRef<WebViewType>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [crashKey, setCrashKey] = React.useState<number>(0);
  const isPlayingRef = React.useRef<boolean>(false);
  // Track heartbeats so we can re-inject the background shim if needed.
  const lastHeartbeatRef = React.useRef<number>(Date.now());
  const bgReinjectTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const css = React.useMemo(
    () => buildCssFromRules(site.filterRules, settings),
    [site.filterRules, settings],
  );
  const injected = React.useMemo(
    () => buildInjectedJs(css, settings.backgroundPlay, site.filterRules.killAdJs),
    [css, settings.backgroundPlay, site.filterRules.killAdJs],
  );
  const earlyJs = React.useRef(buildEarlyJs(site)).current;

  // Re-push CSS when settings change without reloading the page.
  React.useEffect(() => {
    if (webRef.current) {
      webRef.current.injectJavaScript(injected);
    }
  }, [injected]);

  // Background audio heartbeat guard: if heartbeats stop while backgroundPlay
  // is on, re-inject the shim (guards against YouTube JS updates overwriting it).
  React.useEffect(() => {
    if (!settings.backgroundPlay) return;
    bgReinjectTimerRef.current = setInterval(() => {
      const age = Date.now() - lastHeartbeatRef.current;
      if (age > 15000) {
        // No heartbeat for 15s while backgroundPlay is active — re-inject.
        webRef.current?.injectJavaScript(injected);
        lastHeartbeatRef.current = Date.now();
      }
    }, 12000);
    return () => {
      if (bgReinjectTimerRef.current) clearInterval(bgReinjectTimerRef.current);
    };
  }, [settings.backgroundPlay, injected]);

  // Consume pending navigation from the store (triggered by SiteHeader search).
  React.useEffect(() => {
    if (!pendingNav || !tabId) {
      return;
    }
    webRef.current?.injectJavaScript(
      `(function(){try{window.location.href=${JSON.stringify(pendingNav)};}catch(e){}}());true;`,
    );
    clearNavigation(tabId);
  }, [pendingNav, tabId, clearNavigation]);

  // When the app returns to foreground after being backgrounded, re-inject the
  // full JS bundle and force the video to resume. This covers two Android issues:
  //  1. The visibility shim may have been overwritten by a YouTube JS update.
  //  2. The video is left paused when the user returns (even with resumeTimers()).
  React.useEffect(() => {
    if (!settings.backgroundPlay) return;
    const sub = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        // Re-apply shim first, then nudge play after a short settle delay.
        webRef.current?.injectJavaScript(injected);
        setTimeout(() => {
          webRef.current?.injectJavaScript(
            'window._rn_play&&window._rn_play();true;',
          );
        }, 400);
      }
    });
    return () => sub.remove();
  }, [settings.backgroundPlay, injected]);

  // Lock screen / Control Centre remote commands.
  React.useEffect(() => {
    const playSub = NowPlaying.onRemotePlay(data => {
      if (data && data.toggle) {
        if (isPlayingRef.current) {
          isPlayingRef.current = false;
          NowPlaying.setPlaybackState(false);
          webRef.current?.injectJavaScript('window._rn_pause&&window._rn_pause();true;');
        } else {
          isPlayingRef.current = true;
          NowPlaying.setPlaybackState(true);
          webRef.current?.injectJavaScript('window._rn_play&&window._rn_play();true;');
        }
      } else {
        isPlayingRef.current = true;
        NowPlaying.setPlaybackState(true);
        webRef.current?.injectJavaScript('window._rn_play&&window._rn_play();true;');
      }
    });
    const pauseSub = NowPlaying.onRemotePause(() => {
      isPlayingRef.current = false;
      NowPlaying.setPlaybackState(false);
      webRef.current?.injectJavaScript('window._rn_pause&&window._rn_pause();true;');
    });
    const nextSub = NowPlaying.onRemoteNext(() => {
      // Kill any active ad first, wait for the skip to register, then navigate.
      // This fixes the Control Centre "next" landing on an ad and appearing stuck.
      webRef.current?.injectJavaScript(
        '(function(){if(window._rn_killad)window._rn_killad();setTimeout(function(){if(window._rn_next)window._rn_next();},700);true;})();',
      );
    });
    const prevSub = NowPlaying.onRemotePrev(() => {
      webRef.current?.injectJavaScript('window._rn_prev&&window._rn_prev();true;');
    });
    return () => {
      playSub.remove();
      pauseSub.remove();
      nextSub.remove();
      prevSub.remove();
      NowPlaying.clear();
    };
  }, []);

  const uri = `${site.baseUrl}${path}`;

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        key={crashKey}
        source={{uri}}
        originWhitelist={['*']}
        userAgent={site.userAgent ?? DEFAULT_UA}
        injectedJavaScriptBeforeContentLoaded={earlyJs}
        injectedJavaScript={injected}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        androidLayerType="hardware"
        onLoadEnd={() => setLoading(false)}
        onContentProcessDidTerminate={() => {
          // iOS: WebKit GPU process was killed. Reload to avoid blank screen.
          webRef.current?.reload();
        }}
        onError={() => {
          // Android: renderer crash — force full remount via key change.
          setCrashKey(k => k + 1);
        }}
        onNavigationStateChange={navState => {
          if (tabId && navState.url) {
            updateTabUrl(tabId, navState.url);
          }
        }}
        onShouldStartLoadWithRequest={req => {
          const url = req.url || '';
          // Block app-store deep links.
          if (
            url.startsWith('intent:') ||
            url.startsWith('market:') ||
            url.startsWith('vnd.youtube:') ||
            url.includes('play.google.com/store/apps/details')
          ) {
            return false;
          }
          // Network-level: block known ad-serving / tracking domains and
          // YouTube's own ad-stat endpoints (iframes, script tags, pixels).
          // Mirrors Brave's network filter list for these domains.
          if (
            url.includes('doubleclick.net') ||
            url.includes('googleadservices.com') ||
            url.includes('googlesyndication.com') ||
            url.includes('googletagservices.com') ||
            url.includes('/pagead/') ||
            url.includes('/api/stats/ads') ||
            url.includes('/ptracking') ||
            url.includes('/ad_data_204') ||
            url.includes('get_midroll_info')
          ) {
            return false;
          }
          return true;
        }}
        onMessage={event => {
          const raw = event.nativeEvent.data;
          if (raw === 'appview:heartbeat') {
            lastHeartbeatRef.current = Date.now();
            return;
          }
          try {
            const msg = JSON.parse(raw) as {
              type: string;
              videoId?: string;
              title?: string;
              artist?: string;
              artwork?: string;
              state?: string;
              feed?: number;
              prevented?: number;
              skipped?: number;
              dir?: 'up' | 'down';
            };
            if (msg.type === 'track' && msg.title) {
              NowPlaying.update({
                title: msg.title,
                artist: msg.artist ?? '',
                artwork: msg.artwork,
              });
              NowPlaying.setPlaybackState(true);
              isPlayingRef.current = true;
              // Start Android foreground service so audio survives background.
              AndroidMediaSession.startPlayback({
                title: msg.title,
                artist: msg.artist ?? 'AdsFree Player',
              });
            } else if (msg.type === 'scroll' && msg.dir) {
              setScrollDir(msg.dir);
            } else if (msg.type === 'adstats') {
              addAdStats({
                feed: msg.feed ?? 0,
                prevented: msg.prevented ?? 0,
                skipped: msg.skipped ?? 0,
              });
            } else if (msg.type === 'playstate') {
              const playing = msg.state === 'play';
              isPlayingRef.current = playing;
              NowPlaying.setPlaybackState(playing);
              if (!playing) {
                AndroidMediaSession.stopPlayback();
              }
            }
          } catch {
            // Non-JSON messages (e.g. appview:ready, appview:error:...) — ignore.
          }
        }}
        style={styles.web}
      />
      {/* Reload button — lets users force-refresh a stuck or broken page */}
      <TouchableOpacity
        style={styles.reloadBtn}
        onPress={() => { setLoading(true); webRef.current?.reload(); }}
        activeOpacity={0.6}
        accessibilityLabel="Reload page">
        <Text style={styles.reloadIcon}>{`\u21BA`}</Text>
      </TouchableOpacity>
      {loading ? (
        <View style={styles.loaderOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.status.loading} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  web: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
  },
  // Small semi-transparent reload pill anchored to the top-right of the WebView.
  // Positioned above the WebView surface so it always catches taps.
  reloadBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  reloadIcon: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: 'bold',
    includeFontPadding: false,
  },
});
