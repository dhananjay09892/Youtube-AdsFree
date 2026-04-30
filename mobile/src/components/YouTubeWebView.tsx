// YouTubeWebView — loads m.youtube.com inside a WebView and injects
// CSS/JS to hide ads, Shorts, comments, etc., based on user settings.
// This mirrors the browser-extension approach: we do NOT replace YouTube,
// we only restyle it.

import React from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {WebView} from 'react-native-webview';
import type {WebView as WebViewType} from 'react-native-webview';

import {useStore} from '../store/useStore';
import {AppSettings} from '../store/types';
import {colors} from '../theme';

const YT_BASE = 'https://m.youtube.com';

export interface YouTubeWebViewProps {
  // Path beginning with "/" — e.g. "/", "/watch?v=ID", "/results?search_query=foo"
  path?: string;
}

// Build a CSS string that hides whatever the user has toggled off.
// Selectors target both the mobile (m.youtube.com) and desktop DOM so the
// rules survive even if YouTube responds with the full site on a tablet.
function buildHidingCss(s: AppSettings): string {
  const rules: string[] = [];

  // ---- Always-on: kill ads regardless of any toggle ----------------
  if (s.hideAds) {
    rules.push(`
      ytd-display-ad-renderer,
      ytd-promoted-sparkles-web-renderer,
      ytd-promoted-video-renderer,
      ytd-search-pyv-renderer,
      ytd-banner-promo-renderer,
      ytd-statement-banner-renderer,
      ytd-in-feed-ad-layout-renderer,
      ytd-ad-slot-renderer,
      ytd-rich-item-renderer:has(ytd-ad-slot-renderer),
      .ytp-ad-module,
      .ytp-ad-overlay-container,
      .ytp-ad-text-overlay,
      .video-ads,
      #player-ads,
      #masthead-ad,
      ytm-promoted-sparkles-web-renderer,
      ytm-companion-slot,
      ytm-promoted-video-renderer,
      .companion-slot,
      .ad-container,
      ytm-ad-slot-renderer { display: none !important; }
    `);
  }

  if (s.hideShorts) {
    rules.push(`
      ytd-reel-shelf-renderer,
      ytd-rich-shelf-renderer:has([is-shorts]),
      ytd-guide-entry-renderer:has(a[title="Shorts"]),
      a[href^="/shorts"],
      ytm-reel-shelf-renderer,
      ytm-pivot-bar-item-renderer:has(a[href^="/shorts"]) { display: none !important; }
    `);
  }

  if (s.hideComments) {
    rules.push(`
      #comments,
      ytd-comments,
      ytm-comments-entry-point-header-renderer,
      ytm-comment-section-renderer { display: none !important; }
    `);
  }

  if (s.hideTrending) {
    rules.push(`
      a[href^="/feed/trending"],
      a[href^="/feed/explore"],
      ytd-guide-entry-renderer:has(a[title="Trending"]) { display: none !important; }
    `);
  }

  // ---- App-like polish ----
  if (s.roundedPlayer) {
    rules.push(`
      .html5-video-container video,
      ytm-mobile-topbar-renderer + * video { border-radius: 12px !important; overflow: hidden !important; }
    `);
  }

  // Always: hide YouTube's own bottom navigation bar (Home/Shorts/You) —
  // we already have our own bottom tab bar so showing both is ugly and
  // confusing. Also reclaim the space it occupied.
  rules.push(`
    ytm-pivot-bar-renderer,
    .pivot-bar,
    ytm-pivot-bar,
    #pivot-bar,
    .mobile-topbar-shadow ~ ytm-pivot-bar-renderer { display: none !important; }
    body, ytm-app { padding-bottom: 0 !important; }
    ytm-app { --ytm-pivot-bar-height: 0px !important; }
  `);

  // Watch-page layout: keep the player as a 16:9 block at the top and let the
  // metadata / description / related videos scroll naturally below it.
  // Without this the mobile site sometimes pins the player to the full
  // viewport so users had to enter fullscreen just to see anything else.
  rules.push(`
    /* Allow the page itself to scroll. */
    html, body, ytm-app, #app, .mobile-topbar-shadow + * {
      height: auto !important;
      min-height: 100% !important;
      overflow-y: auto !important;
      -webkit-overflow-scrolling: touch !important;
    }
    /* Force the inline player container to a sane 16:9 height instead of
       100vh so the description / comments / suggestions are reachable. */
    ytm-watch[is-watch-page] #player,
    ytm-watch #player,
    ytm-watch .player-container,
    .mobile-topbar-shadow + ytm-watch #player {
      position: relative !important;
      height: auto !important;
      max-height: 56.25vw !important;  /* 16:9 of viewport width */
      aspect-ratio: 16 / 9 !important;
    }
    /* The watch metadata block is sometimes pushed below the fold by a
       full-height player; pull it back into flow. */
    ytm-watch-metadata-section-renderer,
    ytm-item-section-renderer,
    ytm-engagement-panel { display: block !important; }
  `);

  // Always: trim YouTube's own promo banners on mobile, including the
  // very persistent "Open in App" / "Get the YouTube app" prompts.
  rules.push(`
    ytm-promoted-sparkles-text-search-renderer,
    .ytm-promoted-sparkles-web-renderer-thumbnail,
    /* "Open App" floating button + bottom snackbar (every variant) */
    ytm-mealbar-promo-renderer,
    ytm-app-promo-renderer,
    ytm-app-deeplink-redirect-renderer,
    ytm-fullscreen-app-promo-renderer,
    ytm-promoted-app-renderer,
    .mealbar-promo-renderer,
    .app-promo-renderer,
    .app-promo-button,
    ytm-singleton-snackbar-container,
    .singleton-snackbar-container,
    /* Yellow / red full-width banners urging users to open the app */
    ytm-upsell-dialog-renderer,
    ytm-mobile-topbar-renderer .topbar-menu-button-app-promo,
    /* Top-bar three-dot menu "Open in YouTube app" entry */
    ytm-menu-item:has(*[aria-label*="app" i]),
    /* Any link that would deep-link / store-link the YouTube native app */
    a[href*="play.google.com/store/apps/details?id=com.google.android.youtube"],
    a[href*="apps.apple.com"][href*="youtube"],
    a[href^="intent:"],
    a[href^="vnd.youtube:"],
    a[href^="market:"],
    /* Cookie / consent banners (rarely shown but cover the UI when they are) */
    ytm-consent-bump-v2-lightbox,
    tp-yt-paper-dialog[role="dialog"]:has(*[aria-label*="cookie" i]) { display: none !important; }
  `);

  return rules.join('\n');
}

// JS injected into every page. It:
//   1. Installs/updates a <style id="appview-css"> tag with our rules.
//   2. Re-applies on SPA navigation (YouTube is a single-page app).
//   3. Fast-forwards any video ad that does manage to start playing.
function buildInjectedJs(css: string, backgroundPlay: boolean): string {
  // JSON.stringify safely escapes the css for embedding into a JS string.
  return `(function(){
    try {
      var CSS = ${JSON.stringify(css)};
      var BG_PLAY = ${backgroundPlay ? 'true' : 'false'};
      function applyCss(){
        var tag = document.getElementById('appview-css');
        if (!tag) {
          tag = document.createElement('style');
          tag.id = 'appview-css';
          (document.head || document.documentElement).appendChild(tag);
        }
        if (tag.textContent !== CSS) tag.textContent = CSS;
      }
      function bumpQuality(){
        try {
          // Use YouTube's own player API if exposed.
          var p = document.querySelector('#movie_player, .html5-video-player');
          if (p && typeof p.getAvailableQualityLevels === 'function') {
            var levels = p.getAvailableQualityLevels();
            if (levels && levels.length) {
              // levels[0] is the highest available (hd2160, hd1440, hd1080, ...).
              p.setPlaybackQualityRange(levels[0], levels[0]);
              p.setPlaybackQuality(levels[0]);
            }
          }
        } catch(e) {}
      }
      function killAppPrompts(){
        try {
          // CSS can't match by visible text, so sweep the DOM for any
          // button / link whose text mentions "open", "get the app",
          // "in app" and hide its nearest banner-like ancestor.
          var rx = /\b(open\s+in\s+app|open\s+app|get\s+the\s+app|use\s+app|try\s+the\s+app|continue\s+in\s+app|in\s+the\s+app)\b/i;
          var nodes = document.querySelectorAll('a, button, [role="button"]');
          for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            var t = (n.textContent || n.getAttribute('aria-label') || '').trim();
            if (t && rx.test(t)) {
              // Hide the visual container, not just the link, so the bar
              // collapses entirely.
              var host = n.closest('ytm-mealbar-promo-renderer, ytm-app-promo-renderer, ytm-singleton-snackbar-container, ytm-upsell-dialog-renderer, [class*="promo"], [class*="snackbar"], [class*="banner"], dialog, tp-yt-paper-dialog') || n;
              host.style.setProperty('display', 'none', 'important');
            }
          }
        } catch(e) {}
      }
      function killAdNow(){
        try {
          // Only act when the player is actually showing a video ad: a
          // skip button is visible OR an ad overlay is mounted. We must
          // NOT touch currentTime/playbackRate of the main video — doing
          // that broke seeking (jumping from 0 to a later timestamp would
          // momentarily flag .ad-showing during the buffer flip and the
          // old code would then fast-forward / error the real video).
          var skip = document.querySelector('.ytp-ad-skip-button, .ytp-skip-ad-button, .ytp-ad-skip-button-modern, .ytp-ad-skip-button-text');
          if (skip) { skip.click(); return; }
          var overlay = document.querySelector('.ytp-ad-player-overlay, .ytp-ad-player-overlay-instream-info');
          if (!overlay) return;
          var adVideo = document.querySelector('.video-ads .video-stream, .ad-showing video');
          if (adVideo && isFinite(adVideo.duration) && adVideo.duration > 0 && adVideo.duration < 180) {
            // Cap to short ad clips only; never touch a long main video.
            adVideo.currentTime = adVideo.duration;
          }
        } catch(e) {}
      }
      // Trick YouTube into thinking the page is always visible so audio
      // keeps playing when the app is backgrounded / screen is locked.
      // Toggled by the "Background Playback" setting (BG_PLAY constant).
      function installBackgroundAudio(){
        if (!BG_PLAY) return;
        try {
          Object.defineProperty(document, 'hidden', {configurable:true, get:function(){return false;}});
          Object.defineProperty(document, 'webkitHidden', {configurable:true, get:function(){return false;}});
          Object.defineProperty(document, 'visibilityState', {configurable:true, get:function(){return 'visible';}});
          Object.defineProperty(document, 'webkitVisibilityState', {configurable:true, get:function(){return 'visible';}});
          // Swallow visibilitychange / pagehide / blur events that the
          // YouTube player listens to in order to auto-pause.
          var swallow = function(e){ e.stopImmediatePropagation && e.stopImmediatePropagation(); };
          ['visibilitychange','webkitvisibilitychange','pagehide','blur'].forEach(function(ev){
            document.addEventListener(ev, swallow, true);
            window.addEventListener(ev, swallow, true);
          });
        } catch(e) {}
      }
      applyCss();
      installBackgroundAudio();
      // Re-apply on DOM changes (lazy loading + SPA route changes).
      var mo = new MutationObserver(function(){ applyCss(); killAdNow(); killAppPrompts(); });
      mo.observe(document.documentElement, {childList:true, subtree:true});
      // Periodic safety net.
      setInterval(function(){ applyCss(); killAdNow(); bumpQuality(); killAppPrompts(); }, 1000);
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage('appview:ready');
    } catch(err) {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage('appview:error:' + (err && err.message));
    }
    true;
  })();`;
}

export function YouTubeWebView(props: YouTubeWebViewProps): React.ReactElement {
  const {path = '/'} = props;
  const settings = useStore(state => state.settings);
  const webRef = React.useRef<WebViewType>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  const css = React.useMemo(() => buildHidingCss(settings), [settings]);
  const injected = React.useMemo(
    () => buildInjectedJs(css, settings.backgroundPlay),
    [css, settings.backgroundPlay],
  );

  // When settings change while a page is already open, push the new CSS in
  // without reloading the page (preserves the user's video position).
  React.useEffect(() => {
    if (webRef.current) {
      webRef.current.injectJavaScript(injected);
    }
  }, [injected]);

  // Build full URL. Reload only when path changes (not when settings change).
  const uri = `${YT_BASE}${path}`;

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        source={{uri}}
        originWhitelist={['*']}
        // Pretend to be a real mobile browser so YouTube serves m.youtube.com.
        userAgent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
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
        // Android: render via hardware layer for smoother video playback.
        // The JS visibility shim above is what actually enables background
        // audio (it stops YouTube's player from auto-pausing on backgrounding).
        androidLayerType="hardware"
        onLoadEnd={() => setLoading(false)}
        onShouldStartLoadWithRequest={req => {
          // Block intent:// / market:// / store URLs that would yank the
          // user out of our app to the Play Store ("Open YouTube app").
          const url = req.url || '';
          if (
            url.startsWith('intent:') ||
            url.startsWith('market:') ||
            url.startsWith('vnd.youtube:') ||
            url.includes('play.google.com/store/apps/details')
          ) {
            return false;
          }
          return true;
        }}
        onMessage={() => {
          /* messages used for debugging only */
        }}
        style={styles.web}
      />
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
});
