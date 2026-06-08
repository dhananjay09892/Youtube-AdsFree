// ytmusic.site.ts — YouTube Music site config for SiteWebView.
//
// music.youtube.com uses the same underlying YouTube Innertube API, so the
// generic earlyJs fetch-interception in SiteWebView (strips adPlacements /
// playerAds from /youtubei/v1/player responses) already blocks most audio
// pre-roll ads. The killAdJs here handles any that slip through.

import {SiteConfig} from './siteRegistry';

export const ytMusicConfig: SiteConfig = {
  id: 'ytmusic',
  displayName: 'YT Music',
  baseUrl: 'https://music.youtube.com',
  homeTabPath: '/',
  feedTabPath: '/library',
  searchPath: (q: string) =>
    `/search?q=${encodeURIComponent(q)}`,
  tabIcon: 'musical-notes',
  brandColor: '#ff0000',
  userAgent:
    // Same mobile Safari UA as YouTube — avoids "open in app" nags.
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',

  filterRules: {
    adSelectors: [
      // Companion video ads shown below the player
      'ytmusic-companion-slot',
      'ytmusic-display-ad-renderer',
      // In-feed sponsored items
      'ytmusic-shelf-renderer[aria-label*="sponsor" i]',
      // Overlay / interstitial ads
      'ytmusic-interstitial-notification-dialog',
      // Reuse YouTube desktop ad classes (same player infrastructure)
      '.ytp-ad-module',
      '.ytp-ad-overlay-container',
      '.video-ads',
      '#player-ads',
    ],

    promoSelectors: [
      // "Try YouTube Premium" meal-bar
      'ytmusic-mealbar-promo-renderer',
      // App install / upsell dialogs
      'ytmusic-popup-container ytmusic-alert-with-button-renderer',
      // Premium upgrade button rows
      'ytmusic-header-renderer .ytmusic-premium-button',
      // Consent bump / cookie dialogs
      'ytmusic-consent-bump-v2-renderer',
      // "Open in app" links
      'a[href*="play.google.com/store/apps/details?id=com.google.android.music"]',
      'a[href*="apps.apple.com"][href*="music"]',
      'a[href^="intent:"][href*="ytmusic"]',
    ],

    // YT Music has no Shorts equivalent — leave empty.
    shortsSelectors: [],

    // Comment section is not shown in YT Music — leave empty.
    commentSelectors: [],

    // YT Music's own bottom navigation (Home / Explore / Library).
    // We replace it with our two-tab bar, so hide theirs.
    ownNavSelectors: [
      'ytmusic-pivot-bar-renderer',
      '.pivot-bar-background',
      '#pivot-bar',
    ],

    alwaysCss: `
      /* Remove bottom padding YT Music reserves for its own nav bar */
      ytmusic-app, body { padding-bottom: 0 !important; }
      ytmusic-app { --ytmusic-pivot-bar-height: 0px !important; }

      /* Keep the mini-player visible above our tab bar */
      ytmusic-player-bar {
        bottom: 0 !important;
        z-index: 100 !important;
      }
    `,

    // Fast-forward / skip any audio pre-roll that wasn't blocked by the
    // fetch interception (same technique as the YouTube killAdJs).
    killAdJs: `
      (function(){
        var player = document.querySelector('.html5-video-player');
        var adActive = !!(player && (
          player.classList.contains('ad-showing') ||
          player.classList.contains('ad-interrupting')
        ));
        if (!adActive) return;
        var skip = document.querySelector([
          '.ytp-ad-skip-button',
          '.ytp-skip-ad-button',
          '.ytp-ad-skip-button-modern',
          '.ytp-ad-skip-button-text',
          'button[class*="skip-ad"]',
        ].join(', '));
        if (skip) { try { skip.click(); } catch(e){} }
        var video = document.querySelector('video');
        if (video && isFinite(video.duration) && video.duration > 0 && video.duration < 600) {
          try { video.muted = true; } catch(e){}
          try { video.currentTime = Math.max(video.currentTime, video.duration - 0.1); } catch(e){}
          try { video.playbackRate = 16; } catch(e){}
        }
      })();
    `,
  },

  // No additional earlyJs needed — the generic fetch interception in
  // SiteWebView (buildEarlyJs) covers /youtubei/v1/player for music too.
  earlyJs: undefined,
};
