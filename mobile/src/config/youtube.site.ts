// youtube.site.ts — YouTube-specific SiteConfig.
//
// All CSS selectors, ad-kill JS, and early injection logic that was previously
// hard-coded inside YouTubeWebView.tsx now lives here as data. SiteWebView
// reads these values generically so adding a new site requires no component
// changes.

import {SiteConfig} from './siteRegistry';
import {VIDEO_AD_KILLER_SRC} from '../webview/adCleaner';

export const youtubeConfig: SiteConfig = {
  id: 'youtube',
  displayName: 'YouTube',
  baseUrl: 'https://m.youtube.com',
  homeTabPath: '/',
  feedTabPath: '/feed/subscriptions',
  searchPath: (q: string) =>
    `/results?search_query=${encodeURIComponent(q)}`,
  tabIcon: 'logo-youtube',
  brandColor: '#ff0000',
  userAgent:
    // Pretend to be mobile Safari — Google refuses sign-in from any UA
    // that contains "wv" (WebView marker) or "WKWebView".
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',

  filterRules: {
    adSelectors: [
      'ytd-display-ad-renderer',
      'ytd-promoted-sparkles-web-renderer',
      'ytd-promoted-video-renderer',
      'ytd-search-pyv-renderer',
      'ytd-banner-promo-renderer',
      'ytd-statement-banner-renderer',
      'ytd-in-feed-ad-layout-renderer',
      'ytd-ad-slot-renderer',
      'ytd-rich-item-renderer:has(ytd-ad-slot-renderer)',
      '.ytp-ad-module',
      '.ytp-ad-overlay-container',
      '.ytp-ad-text-overlay',
      '.video-ads',
      '#player-ads',
      '#masthead-ad',
      'ytm-promoted-sparkles-web-renderer',
      'ytm-companion-slot',
      'ytm-promoted-video-renderer',
      '.companion-slot',
      '.ad-container',
      'ytm-ad-slot-renderer',
    ],

    promoSelectors: [
      'ytm-promoted-sparkles-text-search-renderer',
      '.ytm-promoted-sparkles-web-renderer-thumbnail',
      'ytm-mealbar-promo-renderer',
      'ytm-app-promo-renderer',
      'ytm-app-deeplink-redirect-renderer',
      'ytm-fullscreen-app-promo-renderer',
      'ytm-promoted-app-renderer',
      '.mealbar-promo-renderer',
      '.app-promo-renderer',
      '.app-promo-button',
      'ytm-singleton-snackbar-container',
      '.singleton-snackbar-container',
      'ytm-upsell-dialog-renderer',
      'ytm-mobile-topbar-renderer .topbar-menu-button-app-promo',
      'ytm-menu-item:has(*[aria-label*="app" i])',
      'a[href*="play.google.com/store/apps/details?id=com.google.android.youtube"]',
      'a[href*="apps.apple.com"][href*="youtube"]',
      'a[href^="intent:"]',
      'a[href^="vnd.youtube:"]',
      'a[href^="market:"]',
      'ytm-consent-bump-v2-lightbox',
      'tp-yt-paper-dialog[role="dialog"]:has(*[aria-label*="cookie" i])',
    ],

    shortsSelectors: [
      'ytd-reel-shelf-renderer',
      'ytd-rich-shelf-renderer:has([is-shorts])',
      'ytd-guide-entry-renderer:has(a[title="Shorts"])',
      'a[href^="/shorts"]',
      'ytm-reel-shelf-renderer',
      'ytm-pivot-bar-item-renderer:has(a[href^="/shorts"])',
    ],

    commentSelectors: [
      '#comments',
      'ytd-comments',
      'ytm-comments-entry-point-header-renderer',
      'ytm-comment-section-renderer',
    ],

    trendingSelectors: [
      'a[href^="/feed/trending"]',
      'a[href^="/feed/explore"]',
      'ytd-guide-entry-renderer:has(a[title="Trending"])',
    ],

    // YouTube's own bottom nav (Home/Shorts/You) conflicts with our tab bar.
    ownNavSelectors: [
      'ytm-pivot-bar-renderer',
      '.pivot-bar',
      'ytm-pivot-bar',
      '#pivot-bar',
      '.mobile-topbar-shadow ~ ytm-pivot-bar-renderer',
    ],

    alwaysCss: `
      /* Remove bottom padding that YouTube adds for its nav bar */
      body, ytm-app { padding-bottom: 0 !important; }
      ytm-app { --ytm-pivot-bar-height: 0px !important; }

      /* Cap the inline player to 16:9 of viewport width so metadata stays
         visible. Do NOT touch overflow/height on body — that detaches the
         <video> element during seeks and triggers "An error occurred". */
      ytm-watch #player .player-container,
      ytm-watch .player-size,
      ytm-watch[is-watch-page] #player .player-container {
        max-height: 56.25vw !important;
      }
      /* Hide the ad picture while it is being fast-forwarded so it never flashes. */
      .html5-video-player.ad-showing video,
      .html5-video-player.ad-interrupting video { opacity: 0 !important; }
      ytm-watch-metadata-section-renderer,
      ytm-item-section-renderer { display: block !important; }
    `,

    // Shared ad killer (see webview/adCleaner.ts): skips, mutes and
    // fast-forwards any ad that starts, then restores mute / speed.
    killAdJs: VIDEO_AD_KILLER_SRC,
  },

  // API-response ad stripping is handled generically in webview/scriptBuilders
  // (buildEarlyJs) so all sites benefit without duplication.
  earlyJs: undefined,
};
