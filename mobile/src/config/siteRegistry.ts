// siteRegistry — data-driven multi-site configuration.
//
// Every site the app supports is described by a SiteConfig object. The app's
// WebView component (SiteWebView) reads from this config instead of having
// site-specific logic hard-coded into it.
//
// To add a new site:
//   1. Create a `src/config/<name>.site.ts` that exports a SiteConfig.
//   2. Import it here and add it to SITE_REGISTRY.
//   That is the ONLY change required — no component edits needed.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * CSS/JS rules used to clean up a site's UI.
 * All fields are optional so a minimal config can be built incrementally.
 */
export interface FilterRuleSet {
  /** CSS selectors for ad containers (display:none). */
  adSelectors?: string[];
  /** CSS selectors for "open in app" / install promo banners. */
  promoSelectors?: string[];
  /** CSS selectors for short-form video shelves (e.g. Shorts). */
  shortsSelectors?: string[];
  /** CSS selectors for the comment section. */
  commentSelectors?: string[];
  /** CSS selectors for trending / explore sections. */
  trendingSelectors?: string[];
  /** CSS selectors for the site's own native navigation bar. */
  ownNavSelectors?: string[];
  /** Raw CSS always appended regardless of user toggles. */
  alwaysCss?: string;
  /** JS string run during killAdNow() for site-specific ad fast-forward. */
  killAdJs?: string;
}

/**
 * Full configuration for one supported site.
 */
export interface SiteConfig {
  /** Unique machine-readable key. Also used as the store's activeSiteId value. */
  id: string;
  /** Human-readable name shown in the UI. */
  displayName: string;
  /** Base URL loaded by the WebView (no trailing slash). */
  baseUrl: string;
  /** Default path for the Home tab. */
  homeTabPath: string;
  /** Default path for the Watch/Library tab. */
  feedTabPath?: string;
  /**
   * Builds the URL path for a search query.
   * Receives the raw user input (not yet encoded).
   */
  searchPath: (query: string) => string;
  /** Ionicons icon name used in the tab bar. */
  tabIcon: string;
  /** Brand accent colour (hex) used for active tab indicator. */
  brandColor: string;
  /** Override the User-Agent header for this site. Falls back to the Safari UA. */
  userAgent?: string;
  /** Rules applied to generate hiding CSS and ad-kill JS. */
  filterRules: FilterRuleSet;
  /**
   * Site-specific JavaScript injected BEFORE the page loads
   * (injectedJavaScriptBeforeContentLoaded). Runs in addition to the
   * generic early-blocker in SiteWebView.
   */
  earlyJs?: string;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

import {youtubeConfig} from './youtube.site';
import {ytMusicConfig} from './ytmusic.site';

/**
 * Ordered list of all supported sites. The first entry is the default.
 * The tab bar renders one entry per site.
 */
export const SITE_REGISTRY: SiteConfig[] = [youtubeConfig, ytMusicConfig];

/** Convenience lookup by id. */
export function getSiteById(id: string): SiteConfig | undefined {
  return SITE_REGISTRY.find(s => s.id === id);
}
