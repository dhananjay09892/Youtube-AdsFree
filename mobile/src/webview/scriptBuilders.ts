// scriptBuilders — builds the CSS and JavaScript strings injected into the
// WebView. Pure TypeScript (no React Native imports) so jest can evaluate the
// generated scripts under jsdom.

import type {AppSettings} from '../store/types';
import type {SiteConfig, FilterRuleSet} from '../config/siteRegistry';
import {CLEAN_ADS_SRC} from './adCleaner';

// ---------------------------------------------------------------------------
// CSS builder — generic, reads FilterRuleSet + AppSettings
// ---------------------------------------------------------------------------

export function buildCssFromRules(rules: FilterRuleSet, s: AppSettings): string {
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
// Early JS builder — runs before the page's own scripts
// ---------------------------------------------------------------------------

// API endpoints whose JSON responses can carry ads.
const API_ENDPOINT_RX =
  '/\\/youtubei\\/v1\\/(player|next|browse|search|reel_watch_sequence|reel_item_watch|get_watch)|get_video_info/';

export function buildEarlyJs(site: SiteConfig): string {
  // Ad removal strategy (all driven by appviewClean from adCleaner.ts):
  //  1. ytInitialPlayerResponse / ytInitialData / ytcfg / __ytd_config__ are
  //     cleaned the moment the page assigns them
  //  2. JSON.parse is wrapped so any other inline JSON carrying ads is cleaned
  //  3. fetch + XHR responses from the Innertube API are cleaned before
  //     YouTube reads them (player, next, browse, search, shorts)
  //  4. sendBeacon pings to ad endpoints are swallowed
  const generic = `(function(){
    try {
      ${CLEAN_ADS_SRC}
      var stats = window.__appviewStats = window.__appviewStats || {feed:0, prevented:0, skipped:0};
      var API_RX = ${API_ENDPOINT_RX};
      function clearAds(d) {
        if (!d || typeof d !== 'object') return d;
        var r = appviewClean(d);
        stats.feed += r.feed; stats.prevented += r.prevented;
        return d;
      }

      // 1. page data assigned by inline scripts
      ['ytInitialPlayerResponse', 'ytInitialData', '__ytd_config__'].forEach(function(name) {
        try {
          Object.defineProperty(window, name, {
            configurable: true,
            set: function(v) {
              try { clearAds(v); } catch(e) {}
              Object.defineProperty(window, name, {configurable: true, writable: true, value: v});
            }
          });
        } catch(e) {}
      });

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

      // 2. JSON.parse (inline JSON blobs)
      try {
        var _parse = JSON.parse;
        JSON.parse = function(text) {
          var r = _parse.apply(this, arguments);
          try {
            if (typeof text === 'string' && text.length > 200 && (
                text.indexOf('adSlotRenderer') !== -1 ||
                text.indexOf('adPlacements') !== -1 ||
                text.indexOf('playerAds') !== -1 ||
                text.indexOf('promotedSparkles') !== -1 ||
                text.indexOf('inFeedAdLayoutRenderer') !== -1)) {
              clearAds(r);
            }
          } catch(e) {}
          return r;
        };
      } catch(e) {}

      // 3a. fetch
      try {
        var _origFetch = window.fetch;
        window.fetch = function(input) {
          var url = typeof input === 'string' ? input
                  : (input && typeof input.url === 'string' ? input.url : '');
          var promise = _origFetch.apply(this, arguments);
          if (!API_RX.test(url)) return promise;
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

      // 3b. XHR — our readystatechange listener is registered FIRST so we can
      // shadow responseText / response before YouTube reads them.
      try {
        var NativeXHR = window.XMLHttpRequest;
        function PatchedXHR() {
          var _xhr = new NativeXHR();
          var _shouldPatch = false;
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
            _shouldPatch = API_RX.test(url || '');
            return _origOpen.apply(null, arguments);
          };
          return _xhr;
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

      // 4. sendBeacon
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
            return true;
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

export function buildInjectedJs(
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

      // Compiled once — previously the whole string was eval'd on every tick.
      var KILL_AD_FN = null;
      try { KILL_AD_FN = KILL_AD_JS ? new Function(KILL_AD_JS) : null; } catch(e) {}
      function killAdNow(){
        try { if (KILL_AD_FN) KILL_AD_FN(); } catch(e) {}
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
          // Ad video fires timeupdate several times a second — kill it fast
          // instead of waiting for the next poll.
          ['timeupdate','loadedmetadata','durationchange','playing'].forEach(function(ev){
            video.addEventListener(ev, killAdNow);
          });
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
        setInterval(function(){ checkTrack(); attachVideoListeners(); }, 1000);

        // Report ad-block counters (deltas) so the app can show what was done.
        var _sent = {feed:0, prevented:0, skipped:0};
        setInterval(function(){
          var st = window.__appviewStats;
          if (!st) return;
          var d = {feed: st.feed - _sent.feed, prevented: st.prevented - _sent.prevented, skipped: st.skipped - _sent.skipped};
          if (d.feed || d.prevented || d.skipped) {
            _sent = {feed: st.feed, prevented: st.prevented, skipped: st.skipped};
            postMsg({type:'adstats', feed:d.feed, prevented:d.prevented, skipped:d.skipped});
          }
        }, 3000);
      }

      applyCss();
      installBackgroundAudio();
      installPlaybackBridge();

      // Coalesce bursts of DOM mutations into one pass (the old code ran the
      // full CSS + ad + prompt scan on every single mutation).
      var _pending = false;
      var _lastPrompt = 0;
      function runAll(){
        _pending = false;
        applyCss(); killAdNow();
        var now = Date.now();
        if (now - _lastPrompt > 500) { _lastPrompt = now; killAppPrompts(); }
      }
      function schedule(){
        if (_pending) return;
        _pending = true;
        setTimeout(runAll, 50);
      }
      var mo = new MutationObserver(schedule);
      mo.observe(document.documentElement, {childList:true, subtree:true});

      // Any class change on the player (ad started OR ended) -> run the killer,
      // which also restores mute / playback rate once the ad is gone.
      var adClassObserver = new MutationObserver(function() { killAdNow(); });
      function watchPlayerForAdClass() {
        var player = document.querySelector('.html5-video-player');
        if (player && !player._adClassWatched) {
          player._adClassWatched = true;
          adClassObserver.observe(player, {attributes: true, attributeFilter: ['class']});
        }
      }
      setInterval(watchPlayerForAdClass, 800);
      setInterval(runAll, 1000); // safety net; events above do the real work
      setInterval(bumpQuality, 5000);
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage('appview:ready');
    } catch(err) {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage('appview:error:' + (err && err.message));
    }
    true;
  })();`;
}
