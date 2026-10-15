// adCleaner — plain-JS source strings that run INSIDE the WebView page.
//
// They are kept as strings (not functions) because they are injected into the
// page. Keeping them in a module with no React Native imports lets the jest
// suite evaluate the exact same source under jsdom.

/**
 * Defines `appviewClean(root)`. Walks a parsed YouTube API / page-data object
 * and removes ads in place:
 *  - ad payload keys (adPlacements, playerAds, ...) are emptied at ANY depth
 *  - array items that are (or directly wrap) an ad renderer are spliced out,
 *    so no empty slot is left behind in home / search / watch-next feeds
 * Returns {feed, prevented} counts for the in-app stats.
 */
export const CLEAN_ADS_SRC = `
var APPVIEW_AD_KEYS = {
  adPlacements:1, playerAds:1, adSlots:1, adBreaks:1, adPodMetadata:1,
  adBreakHeartbeatParams:1, adMessagesRenderer:1, adPreviewRenderer:1,
  adInfoRenderer:1, adPlacementConfig:1, adBreakConfig:1,
  adBreakOffsetMsec:1, adTimeOffset:1
};
var APPVIEW_AD_RENDERERS = {
  adSlotRenderer:1, displayAdRenderer:1, inFeedAdLayoutRenderer:1,
  statementBannerRenderer:1, bannerPromoRenderer:1, adBreakServiceRenderer:1,
  videoMastheadAdV3Renderer:1, primetimePromoRenderer:1,
  brandVideoSingletonRenderer:1, brandVideoShelfRenderer:1,
  companionSlotRenderer:1, actionCompanionAdRenderer:1, searchPyvRenderer:1,
  playerLegacyDesktopWatchAdsRenderer:1, adSlotAndLayoutRenderer:1
};
var APPVIEW_AD_PREFIX = /^(promoted|inFeedAd|displayAd|companionAd|adSlot)/;
function appviewIsAdRenderer(k) {
  return APPVIEW_AD_RENDERERS[k] === 1 || APPVIEW_AD_PREFIX.test(k);
}
function appviewHasAdKey(o, depth) {
  if (!o || typeof o !== 'object') return false;
  for (var k in o) {
    if (!Object.prototype.hasOwnProperty.call(o, k)) continue;
    if (appviewIsAdRenderer(k)) return true;
    if (depth > 0 && appviewHasAdKey(o[k], depth - 1)) return true;
  }
  return false;
}
function appviewClean(root) {
  var res = {feed: 0, prevented: 0};
  var budget = 300000;
  function walk(n, d) {
    if (!n || typeof n !== 'object' || d > 60 || budget-- <= 0) return;
    if (Array.isArray(n)) {
      for (var i = n.length - 1; i >= 0; i--) {
        var el = n[i];
        if (el && typeof el === 'object' && appviewHasAdKey(el, 2)) {
          n.splice(i, 1); res.feed++;
        } else {
          walk(el, d + 1);
        }
      }
      return;
    }
    for (var k in n) {
      if (!Object.prototype.hasOwnProperty.call(n, k)) continue;
      if (APPVIEW_AD_KEYS[k] === 1) {
        var v = n[k];
        if (v && (!Array.isArray(v) || v.length)) {
          try { n[k] = Array.isArray(v) ? [] : (typeof v === 'string' ? '' : null); res.prevented++; } catch (e) {}
        }
        continue;
      }
      if (appviewIsAdRenderer(k)) {
        try { delete n[k]; res.feed++; } catch (e) {}
        continue;
      }
      walk(n[k], d + 1);
    }
  }
  try { walk(root, 0); } catch (e) {}
  return res;
}
`;

/**
 * Body of the video-ad killer. Compiled ONCE with `new Function(...)` by the
 * injected script and called on every DOM change / video timeupdate.
 *  - detects an ad via the player's ad-showing / ad-interrupting classes
 *  - clicks any skip button, mutes, and jumps the ad video to its end
 *  - restores mute and playback rate as soon as the ad is gone
 */
export const VIDEO_AD_KILLER_SRC = `
(function(){
  var st = window.__appviewStats || (window.__appviewStats = {feed:0, prevented:0, skipped:0});
  var player = document.querySelector('.html5-video-player');
  var cls = player && player.classList;
  var adActive = !!(cls && (cls.contains('ad-showing') || cls.contains('ad-interrupting')));
  var mainVideo = document.querySelector('.html5-main-video, video.video-stream.html5-main-video') || document.querySelector('video');
  if (!adActive) {
    window.__appviewAdActive = false;
    if (mainVideo && mainVideo.dataset) {
      if (mainVideo.dataset.appviewMuted === '1') {
        try { mainVideo.muted = false; } catch(e){}
        try { delete mainVideo.dataset.appviewMuted; } catch(e){}
      }
      if (mainVideo.dataset.appviewFast === '1') {
        try { mainVideo.playbackRate = 1; } catch(e){}
        try { delete mainVideo.dataset.appviewFast; } catch(e){}
      }
    }
    return;
  }
  if (!window.__appviewAdActive) { window.__appviewAdActive = true; st.skipped++; }
  var skip = document.querySelector([
    '.ytp-ad-skip-button',
    '.ytp-skip-ad-button',
    '.ytp-ad-skip-button-modern',
    '.ytp-ad-skip-button-text',
    '.ytp-ad-overlay-close-button',
    'button[class*="skip-ad"]',
    'button[class*="skipAd"]',
    '[id*="skip-ad"]'
  ].join(', '));
  if (skip) { try { skip.click(); } catch(e){} }
  var adVideo = document.querySelector('.video-ads video, .ad-showing video, .ad-interrupting video');
  var target = adVideo || mainVideo;
  if (target) {
    try {
      if (!target.muted) { target.muted = true; if (target.dataset) target.dataset.appviewMuted = '1'; }
    } catch(e){}
    if (isFinite(target.duration) && target.duration > 0 && target.duration < 600) {
      try { target.currentTime = Math.max(target.currentTime, target.duration - 0.1); } catch(e){}
      try { target.playbackRate = 16; if (target.dataset) target.dataset.appviewFast = '1'; } catch(e){}
    }
  }
})();
`;
