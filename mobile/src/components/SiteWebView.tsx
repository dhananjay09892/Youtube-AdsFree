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
import {AppSettings} from '../store/types';
import {colors} from '../theme';
import {NowPlaying} from '../modules/NowPlaying';
import {AndroidMediaSession} from '../modules/AndroidMediaSession';
import type {SiteConfig, FilterRuleSet} from '../config/siteRegistry';

export interface SiteWebViewProps {
  site: SiteConfig;
  /** Path beginning with "/" appended to site.baseUrl */
  path?: string;
  /** Identifier passed to updateTabUrl so the TabBar can read the current URL. */
  tabId?: string;
}

// ---------------------------------------------------------------------------
// CSS builder — generic, reads FilterRuleSet + AppSettings
// ---------------------------------------------------------------------------

function buildCssFromRules(rules: FilterRuleSet, s: AppSettings): string {
  const blocks: string[] = [];

  // Helper: join selectors and apply display:none
  const hide = (sels: string[] | undefined): void => {
    if (sels && sels.length > 0) {
      blocks.push(`${sels.join(',\n      ')} { display: none !important; }`);
    }
  };

  if (s.hideAds) hide(rules.adSelectors);
  hide(rules.promoSelectors); // always hide promo regardless of toggle
  if (s.hideShorts) hide(rules.shortsSelectors);
  if (s.hideComments) hide(rules.commentSelectors);
  if (s.hideTrending) hide(rules.trendingSelectors);
  hide(rules.ownNavSelectors); // always hide site's own nav (we have our own)

  if (s.roundedPlayer) {
    blocks.push(`
      .html5-video-container video,
      ytm-mobile-topbar-renderer + * video {
        border-radius: 12px !important;
        overflow: hidden !important;
      }
    `);
  }

  if (rules.alwaysCss) {
    blocks.push(rules.alwaysCss);
  }

  return blocks.join('\n');
}

// ---------------------------------------------------------------------------
// Early JS builder — generic, plus optional site-specific earlyJs
// ---------------------------------------------------------------------------

function buildEarlyJs(site: SiteConfig): string {
  // Parity with Brave's in-page ad blocking strategy:
  //  1. clearAds() — strips every known ad payload key from any API response object
  //  2. ytInitialPlayerResponse + ytInitialData + ytcfg patched before YouTube reads them
  //  3. fetch interception — cleans /youtubei/v1/player SPA responses
  //  4. XHR constructor replacement — same for XMLHttpRequest fallback paths
  //     (our listener is registered FIRST so we shadow responseText before YouTube reads it)
  //  5. sendBeacon blocking — silently drops ad-impression pings to known ad domains
  const generic = `(function(){
    try {
      // ── clearAds ─────────────────────────────────────────────────────────
      // Strips every known ad payload key from an API response object.
      // Matches the full set that Brave's scriptlets clear.
      var AD_KEYS = [
        'adPlacements','playerAds','adSlots','adBreaks','adPodMetadata',
        'adBreakHeartbeatParams','adMessagesRenderer','adPreviewRenderer',
        'adInfoRenderer','adPlacementConfig','adBreakConfig',
        'adBreakOffsetMsec','adTimeOffset',
      ];
      function clearAds(d) {
        if (!d || typeof d !== 'object') return d;
        for (var i = 0; i < AD_KEYS.length; i++) {
          var k = AD_KEYS[i];
          try {
            if (d[k] !== undefined)
              d[k] = Array.isArray(d[k]) ? [] : (typeof d[k] === 'string' ? '' : null);
          } catch(e) {}
        }
        return d;
      }

      // ── 1. ytInitialPlayerResponse (inline page-load data) ───────────────
      Object.defineProperty(window, 'ytInitialPlayerResponse', {
        configurable: true,
        set: function(v) {
          Object.defineProperty(window, 'ytInitialPlayerResponse', {
            configurable: true, writable: true, value: clearAds(v)
          });
        }
      });

      // ── 2. ytInitialData (home / search / feed ad slots) ─────────────────
      Object.defineProperty(window, 'ytInitialData', {
        configurable: true,
        set: function(v) {
          try { clearAds(v); } catch(e) {}
          Object.defineProperty(window, 'ytInitialData', {
            configurable: true, writable: true, value: v
          });
        }
      });

      // ── 3. ytcfg (config-level ad flags written at runtime) ──────────────
      function patchYtcfg() {
        if (!window.ytcfg || !window.ytcfg.set || window.ytcfg._appviewPatched) return false;
        var orig = window.ytcfg.set;
        window.ytcfg.set = function(key, val) {
          try {
            if (key && typeof key === 'object') clearAds(key);
            else if (typeof key === 'string' && val && typeof val === 'object') clearAds(val);
          } catch(e){}
          return orig.apply(this, arguments);
        };
        window.ytcfg._appviewPatched = true;
        return true;
      }
      if (!patchYtcfg()) {
        var _t = setInterval(function(){ if (patchYtcfg()) clearInterval(_t); }, 50);
      }
      Object.defineProperty(window, '__ytd_config__', {
        configurable: true,
        set: function(v) {
          try { clearAds(v); } catch(e){}
          Object.defineProperty(window, '__ytd_config__', {
            configurable: true, writable: true, value: v
          });
        }
      });

      // ── 4. fetch interception ────────────────────────────────────────────
      // Strips ad payloads from every /youtubei/v1/player response (SPA nav).
      try {
        var _origFetch = window.fetch;
        window.fetch = function(input, init) {
          var url = typeof input === 'string' ? input
                  : (input && typeof input.url === 'string' ? input.url : '');
          var isPlayerApi = url.indexOf('/youtubei/v1/player') !== -1
                         || url.indexOf('get_video_info') !== -1;
          var promise = _origFetch.apply(this, arguments);
          if (!isPlayerApi) return promise;
          return promise.then(function(resp) {
            try {
              return resp.clone().json().then(function(json) {
                clearAds(json);
                return new Response(JSON.stringify(json), {
                  status: resp.status,
                  statusText: resp.statusText,
                  headers: {'content-type': 'application/json'},
                });
              }).catch(function() { return resp; });
            } catch(e) { return resp; }
          });
        };
      } catch(e) {}

      // ── 5. XHR interception ──────────────────────────────────────────────
      // YouTube sometimes uses XMLHttpRequest instead of fetch (older code
      // paths, retry logic). We replace the XHR constructor so our
      // readystatechange listener is registered FIRST — before YouTube's —
      // letting us shadow responseText/response before YouTube reads them.
      try {
        var NativeXHR = window.XMLHttpRequest;
        function PatchedXHR() {
          var _xhr = new NativeXHR();
          var _shouldPatch = false;
          // Our listener is added here, before any YouTube code adds theirs.
          _xhr.addEventListener('readystatechange', function() {
            if (_xhr.readyState !== 4 || !_shouldPatch) return;
            try {
              var json = JSON.parse(_xhr.responseText);
              clearAds(json);
              var s = JSON.stringify(json);
              Object.defineProperty(_xhr, 'responseText', {configurable:true, get:function(){return s;}});
              Object.defineProperty(_xhr, 'response',     {configurable:true, get:function(){return s;}});
            } catch(e) {}
          });
          var _origOpen = _xhr.open.bind(_xhr);
          _xhr.open = function(method, url) {
            var u = url || '';
            _shouldPatch = u.indexOf('/youtubei/v1/player') !== -1
                        || u.indexOf('get_video_info') !== -1;
            return _origOpen.apply(null, arguments);
          };
          return _xhr; // returning an object from a constructor overrides the default new-target
        }
        PatchedXHR.prototype = NativeXHR.prototype;
        Object.getOwnPropertyNames(NativeXHR).forEach(function(k) {
          try {
            var d = Object.getOwnPropertyDescriptor(NativeXHR, k);
            if (d) Object.defineProperty(PatchedXHR, k, d);
          } catch(e) {}
        });
        window.XMLHttpRequest = PatchedXHR;
      } catch(e) {}

      // ── 6. sendBeacon blocking ───────────────────────────────────────────
      // Silently drops ad-impression pings so the ad server is never notified
      // that an ad was "seen" (matches Brave's beacon-blocking behaviour).
      try {
        var _origBeacon = navigator.sendBeacon.bind(navigator);
        navigator.sendBeacon = function(url, data) {
          var u = url || '';
          if (u.indexOf('doubleclick') !== -1 ||
              u.indexOf('googleadservices') !== -1 ||
              u.indexOf('/api/stats/ads') !== -1 ||
              u.indexOf('/ptracking') !== -1 ||
              u.indexOf('/pagead/') !== -1 ||
              u.indexOf('ad_data_204') !== -1) {
            return true; // silently swallow — callers treat true as success
          }
          return _origBeacon(url, data);
        };
      } catch(e) {}

    } catch(e) {}
    true;
  })()`;

  if (site.earlyJs) {
    return generic + '\n' + site.earlyJs;
  }
  return generic;
}

// ---------------------------------------------------------------------------
// Runtime injected JS builder
// ---------------------------------------------------------------------------

function buildInjectedJs(
  css: string,
  backgroundPlay: boolean,
  killAdJs: string | undefined,
): string {
  const safeKillAdJs = killAdJs ? JSON.stringify(killAdJs) : '""';
  return `(function(){
    try {
      var CSS = ${JSON.stringify(css)};
      var BG_PLAY = ${backgroundPlay ? 'true' : 'false'};
      var KILL_AD_JS = ${safeKillAdJs};

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
            var preferred = ['hd720','large','medium','small','tiny'];
            var chosen = null;
            for (var qi = 0; qi < preferred.length; qi++) {
              if (levels.indexOf(preferred[qi]) !== -1) { chosen = preferred[qi]; break; }
            }
            if (!chosen) chosen = levels[levels.length - 1];
            var current = (typeof p.getPlaybackQuality === 'function') ? p.getPlaybackQuality() : null;
            if (current === chosen) return;
            p.setPlaybackQualityRange(chosen, chosen);
            p.setPlaybackQuality(chosen);
          }
        } catch(e) {}
      }

      function killAppPrompts(){
        try {
          var rx = /\\b(open\\s+in\\s+app|open\\s+app|get\\s+the\\s+app|use\\s+app|try\\s+the\\s+app|continue\\s+in\\s+app|in\\s+the\\s+app)\\b/i;
          var nodes = document.querySelectorAll('a, button, [role="button"]');
          for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            var t = (n.textContent || n.getAttribute('aria-label') || '').trim();
            if (t && rx.test(t)) {
              var host = n.closest('ytm-mealbar-promo-renderer, ytm-app-promo-renderer, ytm-singleton-snackbar-container, ytm-upsell-dialog-renderer, [class*="promo"], [class*="snackbar"], [class*="banner"], dialog, tp-yt-paper-dialog') || n;
              host.style.setProperty('display', 'none', 'important');
            }
          }
        } catch(e) {}
      }

      function killAdNow(){
        try {
          if (KILL_AD_JS) { (0, eval)(KILL_AD_JS); }
        } catch(e) {}
      }

      function installBackgroundAudio(){
        if (!BG_PLAY) return;
        try {
          Object.defineProperty(document, 'hidden', {configurable:true, get:function(){return false;}});
          Object.defineProperty(document, 'webkitHidden', {configurable:true, get:function(){return false;}});
          Object.defineProperty(document, 'visibilityState', {configurable:true, get:function(){return 'visible';}});
          Object.defineProperty(document, 'webkitVisibilityState', {configurable:true, get:function(){return 'visible';}});
          var swallow = function(e){ e.stopImmediatePropagation && e.stopImmediatePropagation(); };
          ['visibilitychange','webkitvisibilitychange'].forEach(function(ev){
            document.addEventListener(ev, swallow, true);
            window.addEventListener(ev, swallow, true);
          });
        } catch(e) {}
      }

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
          if (!title) return;
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
            setTimeout(function(){ if (v.paused) postMsg({type:'playstate',state:'pause'}); }, 300);
          });
          // When a video ends naturally, burst-kill any pre-roll that loads
          // for the autoplay next video before the user can hear it.
          video.addEventListener('ended', function(){
            killAdNow();
            var _ec = 0;
            var _et = setInterval(function(){
              killAdNow();
              if (++_ec >= 25) { clearInterval(_et); }
            }, 200);
          });
        }
        // Expose killAdNow so ad-hoc injectJavaScript calls (e.g. onRemoteNext) can reach it.
        window._rn_killad = killAdNow;
        window._rn_play   = function(){ var v = document.querySelector('video'); if (v) v.play().catch(function(){}); };
        window._rn_pause  = function(){ var v = document.querySelector('video'); if (v) v.pause(); };
        // _rn_next_go — pure navigation; assumes any ad is already cleared.
        window._rn_next_go = function(){
          // Mobile-first selector list, then desktop fallbacks.
          var btn = document.querySelector([
            'ytm-next-button-renderer button',
            'button[aria-label="Next video"]',
            'button[aria-label="Next"]',
            '.ytp-next-button',
            '[data-tooltip-text*="Next"]',
          ].join(', '));
          if (btn) { try { btn.click(); } catch(e){} return; }
          // Autoplay / end-screen overlay
          var auto = document.querySelector([
            'ytm-compact-autoplay-renderer a',
            'ytm-autoplay-video-renderer a',
            'ytm-endscreen-element-renderer a[href*="/watch"]',
            '.ytp-endscreen-element[data-title]',
            'a.ytp-suggestion-set',
          ].join(', '));
          if (auto) { try { auto.click(); } catch(e){} return; }
          // First recommended video below the player
          var first = document.querySelector([
            'ytm-video-with-context-renderer a.compact-media-item-image',
            'ytm-video-with-context-renderer a[href*="/watch"]',
            'ytm-compact-video-renderer a[href*="/watch"]',
            'ytm-rich-item-renderer a[href*="/watch"]',
          ].join(', '));
          if (first) { try { first.click(); } catch(e){} }
        };
        // _rn_next — called by Control Centre / lock screen next command.
        // Kills any active pre-roll ad first; only navigates once the ad is
        // cleared (or if no ad is active).
        window._rn_next = function(){
          var player = document.querySelector('.html5-video-player');
          var adActive = !!(player && (
            player.classList.contains('ad-showing') ||
            player.classList.contains('ad-interrupting')
          ));
          if (adActive) {
            killAdNow();
            // Give the skip/fast-forward 700 ms to take effect, then navigate.
            setTimeout(function(){ window._rn_next_go(); }, 700);
            return;
          }
          window._rn_next_go();
        };
        window._rn_prev  = function(){ window.history.back(); };
        // Heartbeat so RN can detect if the background audio shim has been
        // overwritten by a YouTube JS update.
        setInterval(function(){
          try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage('appview:heartbeat'); } catch(e){}
        }, 10000);
        document.addEventListener('yt-navigate-finish', function() {
          _trackVideoId = null;
          // Burst-kill ads for ~5 s after every SPA navigation so any
          // pre-roll ad that starts loading on the new video is silenced
          // before the user can hear it (covers the "next song" control-
          // centre bug where ads slip in between tracks).
          killAdNow();
          var _bc = 0;
          var _bt = setInterval(function(){
            killAdNow();
            if (++_bc >= 25) { clearInterval(_bt); }
          }, 200);
          setTimeout(function(){ checkTrack(); attachVideoListeners(); }, 300);
        });
        setInterval(function(){ checkTrack(); attachVideoListeners(); }, 500);
      }

      applyCss();
      installBackgroundAudio();
      installPlaybackBridge();

      var mo = new MutationObserver(function(){ applyCss(); killAdNow(); killAppPrompts(); });
      mo.observe(document.documentElement, {childList:true, subtree:true});

      var adClassObserver = new MutationObserver(function(muts) {
        for (var mi = 0; mi < muts.length; mi++) {
          var t = muts[mi].target;
          if (t && t.classList && (
            t.classList.contains('ad-showing') ||
            t.classList.contains('ad-interrupting')
          )) {
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
      setInterval(function(){ applyCss(); killAdNow(); killAppPrompts(); }, 200);
      setInterval(bumpQuality, 5000);
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage('appview:ready');
    } catch(err) {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage('appview:error:' + (err && err.message));
    }
    true;
  })();`;
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
