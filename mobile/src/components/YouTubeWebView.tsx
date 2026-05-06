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
import {NowPlaying} from '../modules/NowPlaying';

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

  // Watch-page layout: cap the inline player to 16:9 of the viewport width
  // so the metadata / description / related videos remain visible below.
  // IMPORTANT: do NOT mutate html/body/ytm-app overflow or height — doing
  // that detaches the HTML5 <video> element during seeks and produces the
  // "An error occurred" overlay. Mobile YouTube's natural watch layout is
  // already scrollable; we only need to tame the player when it tries to
  // grow to 100vh.
  rules.push(`
    ytm-watch #player .player-container,
    ytm-watch .player-size,
    ytm-watch[is-watch-page] #player .player-container {
      max-height: 56.25vw !important;  /* 16:9 of viewport width */
    }
    /* Keep metadata visible when the page first renders. */
    ytm-watch-metadata-section-renderer,
    ytm-item-section-renderer { display: block !important; }
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

// Injected BEFORE any page content loads (injectedJavaScriptBeforeContentLoaded).
// Intercepts window.ytInitialPlayerResponse before YouTube's own JS reads it
// and clears the adPlacements array — this prevents the ad scheduler from
// ever queuing a pre-roll, which eliminates the 3-5 s stutter on video open.
function buildEarlyBlockerJs(): string {
  return `(function(){
    try {
      function clearAds(d) {
        if (!d || typeof d !== 'object') return d;
        try { if (d.adPlacements) d.adPlacements = []; } catch(e){}
        try { if (d.playerAds) d.playerAds = []; } catch(e){}
        try { if (d.adSlots) d.adSlots = []; } catch(e){}
        return d;
      }
      Object.defineProperty(window, 'ytInitialPlayerResponse', {
        configurable: true,
        set: function(v) {
          Object.defineProperty(window, 'ytInitialPlayerResponse', {
            configurable: true, writable: true, value: clearAds(v)
          });
        }
      });
    } catch(e) {}
    true;
  })();`;
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
          var p = document.querySelector('#movie_player, .html5-video-player');
          if (p && typeof p.getAvailableQualityLevels === 'function') {
            var levels = p.getAvailableQualityLevels();
            if (!levels || !levels.length) return;
            // Cap at 720p. Prefer hd720, fall back lower if not available.
            var preferred = ['hd720','large','medium','small','tiny'];
            var chosen = null;
            for (var qi = 0; qi < preferred.length; qi++) {
              if (levels.indexOf(preferred[qi]) !== -1) { chosen = preferred[qi]; break; }
            }
            if (!chosen) chosen = levels[levels.length - 1];
            // Skip if already at the target — avoids a rebuffer every 5 s.
            var current = (typeof p.getPlaybackQuality === 'function') ? p.getPlaybackQuality() : null;
            if (current === chosen) return;
            p.setPlaybackQualityRange(chosen, chosen);
            p.setPlaybackQuality(chosen);
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
          // Detect an ad strictly via the player's own state (the
          // "ad-showing" class on .html5-video-player is the canonical
          // signal; the .ytp-ad-player-overlay element only mounts during
          // a real ad). We never touch the main video's currentTime.
          var player = document.querySelector('.html5-video-player');
          var overlay = document.querySelector('.ytp-ad-player-overlay, .ytp-ad-player-overlay-instream-info');
          var adActive = !!(player && player.classList.contains('ad-showing')) && !!overlay;
          var mainVideo = document.querySelector('.html5-main-video, video.video-stream.html5-main-video') || document.querySelector('video');
          if (!adActive) {
            // Ad just ended — make sure we didn't leave the main video
            // muted from a previous tick. We only flip muted back if WE
            // are the ones who muted it (tracked via a data flag).
            if (mainVideo && mainVideo.dataset && mainVideo.dataset.appviewMuted === '1') {
              try { mainVideo.muted = false; } catch(e){}
              try { delete mainVideo.dataset.appviewMuted; } catch(e){}
            }
            return;
          }
          // 1) Try to click any visible Skip button immediately.
          var skip = document.querySelector('.ytp-ad-skip-button, .ytp-skip-ad-button, .ytp-ad-skip-button-modern, .ytp-ad-skip-button-text, button[class*="skip"]');
          if (skip) { try { skip.click(); } catch(e){} }
          // 2) Fast-forward + mute. On mobile YouTube, ads usually share
          //    the SAME <video> element as the main video, so we mark the
          //    element when we mute it and unmute it when ad ends (above).
          //    Prefer a dedicated ad <video> inside .video-ads if it exists.
          var adVideo = document.querySelector('.video-ads video');
          var target = adVideo || mainVideo;
          if (target) {
            try {
              if (!target.muted) { target.muted = true; if (target.dataset) target.dataset.appviewMuted = '1'; }
            } catch(e){}
            if (isFinite(target.duration) && target.duration > 0 && target.duration < 600) {
              try { target.currentTime = Math.max(target.currentTime, target.duration - 0.1); } catch(e){}
              try { target.playbackRate = 16; } catch(e){}
            }
          }
        } catch(e) {}
      }
      // Trick YouTube into thinking the page is always visible so audio
      // keeps playing when the app is backgrounded / screen is locked.
      // Toggled by the "Background Playback" setting (BG_PLAY constant).
      // NOTE: we deliberately do NOT auto-call video.play() on pause.
      // iOS WebKit refuses play() without a user gesture while the app is
      // in the background, and adding a pause-listener interferes with
      // AVAudioSession's coordination — keeping things to a pure visibility
      // shim is what reliably keeps audio playing on the lock screen.
      function installBackgroundAudio(){
        if (!BG_PLAY) return;
        try {
          Object.defineProperty(document, 'hidden', {configurable:true, get:function(){return false;}});
          Object.defineProperty(document, 'webkitHidden', {configurable:true, get:function(){return false;}});
          Object.defineProperty(document, 'visibilityState', {configurable:true, get:function(){return 'visible';}});
          Object.defineProperty(document, 'webkitVisibilityState', {configurable:true, get:function(){return 'visible';}});
          // Swallow visibilitychange events that YouTube listens to in
          // order to auto-pause. Do NOT swallow pagehide/blur — WebKit
          // and AVAudioSession use those internally to manage the audio
          // route, and swallowing them caused audio to drop on lock.
          var swallow = function(e){ e.stopImmediatePropagation && e.stopImmediatePropagation(); };
          ['visibilitychange','webkitvisibilitychange'].forEach(function(ev){
            document.addEventListener(ev, swallow, true);
            window.addEventListener(ev, swallow, true);
          });
        } catch(e) {}
      }
      // Playback bridge — watches the <video> element for play/pause events
      // and reports track metadata (title, channel, thumbnail) to React Native
      // so the native NowPlaying module can update Control Centre / lock screen.
      // Also exposes window._rn_play / window._rn_pause so remote-control
      // commands sent from React Native can drive the player.
      function installPlaybackBridge(){
        var _trackVideoId = null;
        function getVideoId(){
          var m = window.location.href.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
          return m ? m[1] : null;
        }
        function getTitle(){
          var sels = [
            'h2.slim-video-information-title span',
            '.slim-video-information-title',
            'ytm-slim-video-information-renderer h2',
            'h1.title',
          ];
          for (var i = 0; i < sels.length; i++) {
            var el = document.querySelector(sels[i]);
            if (el && el.textContent && el.textContent.trim()) return el.textContent.trim();
          }
          return document.title.replace(/ - YouTube$/, '').trim();
        }
        function getArtist(){
          var sels = [
            '.slim-owner-name',
            '.ytm-video-owner-name span',
            '.slim-video-information-subtitle a',
            '.subhead-author',
          ];
          for (var i = 0; i < sels.length; i++) {
            var el = document.querySelector(sels[i]);
            if (el && el.textContent && el.textContent.trim()) return el.textContent.trim();
          }
          return '';
        }
        function postMsg(obj){
          try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(obj)); } catch(e){}
        }
        function checkTrack(){
          var vid = getVideoId();
          if (!vid || vid === _trackVideoId) return;
          var title = getTitle();
          var artist = getArtist();
          if (!title) return; // DOM not ready yet — retry next tick
          _trackVideoId = vid;
          postMsg({type:'track', videoId:vid, title:title, artist:artist,
                   artwork:'https://i.ytimg.com/vi/'+vid+'/hqdefault.jpg'});
        }
        function attachVideoListeners(){
          var video = document.querySelector('video');
          if (!video || video._appviewBridge) return;
          video._appviewBridge = true;
          video.addEventListener('play',    function(){ postMsg({type:'playstate',state:'play'}); });
          video.addEventListener('playing', function(){ postMsg({type:'playstate',state:'play'}); });
          video.addEventListener('pause',   function(){
            var v = this;
            // Delay slightly to ignore transient pause events during seeks.
            setTimeout(function(){ if (v.paused) postMsg({type:'playstate',state:'pause'}); }, 300);
          });
        }
        // Remote commands injected by React Native's NowPlaying remote handlers.
        window._rn_play  = function(){ var v = document.querySelector('video'); if (v) v.play().catch(function(){}); };
        window._rn_pause = function(){ var v = document.querySelector('video'); if (v) v.pause(); };
        // Skip to the next video: try playlist next, then autoplay "Up Next".
        window._rn_next  = function(){
          // Playlist: next item button
          var btn = document.querySelector('.ytp-next-button');
          if (btn) { btn.click(); return; }
          // Autoplay / Up Next: first video card in the autoplay section
          var auto = document.querySelector(
            'ytm-compact-autoplay-renderer a.compact-media-item-image, ' +
            'ytm-compact-autoplay-renderer .compact-media-item, ' +
            'ytm-item-section-renderer ytm-video-with-context-renderer a.compact-media-item-image'
          );
          if (auto) { auto.click(); return; }
          // Fallback: click first related video
          var first = document.querySelector('ytm-video-with-context-renderer a.compact-media-item-image');
          if (first) first.click();
        };
        // Go to previous video via browser history.
        window._rn_prev  = function(){ window.history.back(); };
        setInterval(function(){ checkTrack(); attachVideoListeners(); }, 500);
      }
      applyCss();
      installBackgroundAudio();
      installPlaybackBridge();
      // Re-apply on DOM changes (lazy loading + SPA route changes).
      var mo = new MutationObserver(function(){ applyCss(); killAdNow(); killAppPrompts(); });
      mo.observe(document.documentElement, {childList:true, subtree:true});
      // Dedicated attribute observer on the player: fires killAdNow() the
      // instant YouTube adds the 'ad-showing' class — no polling delay.
      var adClassObserver = new MutationObserver(function(muts) {
        for (var mi = 0; mi < muts.length; mi++) {
          var t = muts[mi].target;
          if (t && t.classList && t.classList.contains('ad-showing')) {
            killAdNow(); break;
          }
        }
      });
      function watchPlayerForAdClass() {
        var player = document.querySelector('.html5-video-player');
        if (player && !player._adClassWatched) {
          player._adClassWatched = true;
          adClassObserver.observe(player, {attributes: true, attributeFilter: ['class']});
        }
      }
      setInterval(watchPlayerForAdClass, 800);
      // Periodic safety net (200ms instead of 1s so ads get killed faster).
      setInterval(function(){ applyCss(); killAdNow(); killAppPrompts(); }, 200);
      // Quality bump runs less often to avoid spamming the player API.
      setInterval(bumpQuality, 5000);
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
  // Tracks whether the YouTube player is currently playing so toggle
  // commands from Control Centre can flip the correct direction.
  const isPlayingRef = React.useRef<boolean>(false);

  const css = React.useMemo(() => buildHidingCss(settings), [settings]);
  const injected = React.useMemo(
    () => buildInjectedJs(css, settings.backgroundPlay),
    [css, settings.backgroundPlay],
  );
  // earlyBlocker is static — build once, never changes.
  const earlyBlocker = React.useRef(buildEarlyBlockerJs()).current;

  // When settings change while a page is already open, push the new CSS in
  // without reloading the page (preserves the user's video position).
  React.useEffect(() => {
    if (webRef.current) {
      webRef.current.injectJavaScript(injected);
    }
  }, [injected]);

  // Wire up Control Centre / lock screen remote-control commands.
  // Play/pause commands from headphone remote or Control Centre are forwarded
  // to the WebView via injected JS; NowPlaying state is kept in sync.
  React.useEffect(() => {
    const playSub = NowPlaying.onRemotePlay(data => {
      if (data && data.toggle) {
        // Headphone single-tap: flip current state.
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
      webRef.current?.injectJavaScript('window._rn_next&&window._rn_next();true;');
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

  // Build full URL. Reload only when path changes (not when settings change).
  const uri = `${YT_BASE}${path}`;

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        source={{uri}}
        originWhitelist={['*']}
        // Pretend to be mobile Safari on iOS — *not* a WebView. Google's
        // sign-in flow refuses any UA containing "wv" (WebView marker) or
        // "WKWebView" with "browser may not be secure". A clean Safari UA
        // is the most reliable workaround short of using ASWebAuthSession.
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
        injectedJavaScriptBeforeContentLoaded={earlyBlocker}
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
        onMessage={event => {
          try {
            const msg = JSON.parse(event.nativeEvent.data) as {
              type: string;
              videoId?: string;
              title?: string;
              artist?: string;
              artwork?: string;
              state?: string;
            };
            if (msg.type === 'track' && msg.title) {
              NowPlaying.update({
                title: msg.title,
                artist: msg.artist ?? '',
                artwork: msg.artwork,
              });
              NowPlaying.setPlaybackState(true);
              isPlayingRef.current = true;
            } else if (msg.type === 'playstate') {
              const playing = msg.state === 'play';
              isPlayingRef.current = playing;
              NowPlaying.setPlaybackState(playing);
            }
          } catch {
            // Non-JSON message (legacy debug strings) — ignore.
          }
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
