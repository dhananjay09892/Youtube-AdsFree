/**
 * @jest-environment jsdom
 */
// Runs the REAL generated early + injected scripts inside jsdom and checks the
// end-to-end behaviour: data cleaning hooks, fetch interception, beacon
// blocking, and the video-ad killer lifecycle.

import {youtubeConfig} from '../src/config/youtube.site';
import {DEFAULT_SETTINGS} from '../src/store/types';
import {
  buildCssFromRules,
  buildEarlyJs,
  buildInjectedJs,
} from '../src/webview/scriptBuilders';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = window as any;

const feedAd = () => ({richItemRenderer: {content: {adSlotRenderer: {}}}});
const vid = (id: string) => ({richItemRenderer: {content: {video: id}}});

describe('early script', () => {
  const origParse = JSON.parse;

  beforeAll(() => {
    w.navigator.sendBeacon = jest.fn(() => false);
    w.fetch = jest.fn();
    w.Response = class {
      constructor(public body: string, public init: unknown) {}
      json() {
        return Promise.resolve(origParse(this.body));
      }
    };
    w.eval(buildEarlyJs(youtubeConfig));
  });
  afterAll(() => {
    JSON.parse = origParse;
  });

  it('cleans ytInitialData the moment the page assigns it', () => {
    w.ytInitialData = {contents: [vid('a'), feedAd(), vid('b')]};
    expect(w.ytInitialData.contents).toEqual([vid('a'), vid('b')]);
  });

  it('cleans ytInitialPlayerResponse', () => {
    w.ytInitialPlayerResponse = {
      adPlacements: [{x: 1}],
      videoDetails: {videoId: 'q'},
    };
    expect(w.ytInitialPlayerResponse.adPlacements).toEqual([]);
    expect(w.ytInitialPlayerResponse.videoDetails.videoId).toBe('q');
  });

  it('cleans inline JSON.parse blobs that carry ads, and leaves others alone', () => {
    const pad = 'x'.repeat(300);
    const withAd = JSON.stringify({pad, list: [vid('a'), feedAd()]});
    expect(JSON.parse(withAd).list).toEqual([vid('a')]);
    const plain = JSON.stringify({pad, list: [vid('a')]});
    expect(JSON.parse(plain).list).toEqual([vid('a')]);
    expect(JSON.parse('{"adSlotRenderer":1}')).toEqual({adSlotRenderer: 1});
  });

  it.each(['browse', 'next', 'search', 'player'])(
    'cleans /youtubei/v1/%s fetch responses',
    async endpoint => {
      const payload = {contents: [vid('a'), feedAd()], adPlacements: [{}]};
      // The page's fetch is wrapped at eval time, so install a fresh stub and
      // re-run the early script against it.
      w.fetch = jest.fn().mockResolvedValue({
        status: 200,
        statusText: 'OK',
        clone: () => ({
          json: () => Promise.resolve(origParse(JSON.stringify(payload))),
        }),
      });
      w.eval(buildEarlyJs(youtubeConfig));
      const resp = await w.fetch(
        `https://m.youtube.com/youtubei/v1/${endpoint}?prettyPrint=false`,
      );
      const json = await resp.json();
      expect(json.contents).toEqual([vid('a')]);
      expect(json.adPlacements).toEqual([]);
    },
  );

  it('passes non-API fetches through untouched', async () => {
    const raw = {status: 200, clone: jest.fn()};
    w.fetch = jest.fn().mockResolvedValue(raw);
    w.eval(buildEarlyJs(youtubeConfig));
    const resp = await w.fetch('https://m.youtube.com/some/other.js');
    expect(resp).toBe(raw);
    expect(raw.clone).not.toHaveBeenCalled();
  });

  it('swallows ad beacons but lets normal ones through', () => {
    const real = jest.fn(() => false);
    w.navigator.sendBeacon = real;
    w.eval(buildEarlyJs(youtubeConfig));
    expect(w.navigator.sendBeacon('https://www.youtube.com/api/stats/ads?x=1')).toBe(true);
    expect(w.navigator.sendBeacon('https://ad.doubleclick.net/p')).toBe(true);
    expect(real).not.toHaveBeenCalled();
    w.navigator.sendBeacon('https://www.youtube.com/api/stats/watchtime');
    expect(real).toHaveBeenCalledTimes(1);
  });

  it('counts what it removed in window.__appviewStats', () => {
    expect(w.__appviewStats.feed).toBeGreaterThan(0);
    expect(w.__appviewStats.prevented).toBeGreaterThan(0);
  });
});

describe('injected script + video ad killer', () => {
  const messages: string[] = [];
  let player: HTMLElement;
  let video: HTMLVideoElement;
  let skipClicks = 0;

  beforeAll(() => {
    jest.useFakeTimers();
    w.ReactNativeWebView = {postMessage: (m: string) => messages.push(m)};
    document.body.innerHTML = `
      <div class="html5-video-player" id="movie_player">
        <video class="html5-main-video"></video>
      </div>`;
    player = document.querySelector('.html5-video-player') as HTMLElement;
    video = document.querySelector('video') as HTMLVideoElement;
    let rate = 1;
    let time = 0;
    Object.defineProperty(video, 'duration', {value: 30, configurable: true});
    Object.defineProperty(video, 'currentTime', {
      get: () => time,
      set: v => {
        time = v;
      },
      configurable: true,
    });
    Object.defineProperty(video, 'playbackRate', {
      get: () => rate,
      set: v => {
        rate = v;
      },
      configurable: true,
    });
    w.__appviewStats = {feed: 0, prevented: 0, skipped: 0};

    const css = buildCssFromRules(youtubeConfig.filterRules, DEFAULT_SETTINGS);
    w.eval(buildInjectedJs(css, true, youtubeConfig.filterRules.killAdJs));
    jest.advanceTimersByTime(1000);
  });
  afterAll(() => jest.useRealTimers());

  it('announces readiness', () => {
    expect(messages).toContain('appview:ready');
  });

  it('applies the hide-ads CSS', () => {
    const tag = document.getElementById('appview-css');
    expect(tag?.textContent).toContain('ytd-ad-slot-renderer');
    expect(tag?.textContent).toContain('ad-showing video');
  });

  it('skips, mutes and fast-forwards an ad, then restores the video', async () => {
    document.body.insertAdjacentHTML(
      'beforeend',
      '<button class="ytp-ad-skip-button"></button>',
    );
    document.querySelector('.ytp-ad-skip-button')!.addEventListener('click', () => {
      skipClicks++;
    });

    player.classList.add('ad-showing');
    // MutationObserver callbacks are microtasks; flush, then the 50 ms debounce.
    await Promise.resolve();
    jest.advanceTimersByTime(100);

    expect(skipClicks).toBeGreaterThan(0);
    expect(video.muted).toBe(true);
    expect(video.currentTime).toBeCloseTo(29.9, 1);
    expect(video.playbackRate).toBe(16);

    player.classList.remove('ad-showing');
    await Promise.resolve();
    jest.advanceTimersByTime(100);

    expect(video.muted).toBe(false);
    expect(video.playbackRate).toBe(1);
  });

  it('reports ad stats to the app', () => {
    jest.advanceTimersByTime(3500);
    const stat = messages
      .filter(m => m.startsWith('{'))
      .map(m => JSON.parse(m))
      .find(m => m.type === 'adstats');
    expect(stat).toBeDefined();
    expect(stat.skipped).toBe(1);
  });

  it('does not touch a user-muted video when no ad is showing', () => {
    video.muted = true;
    jest.advanceTimersByTime(1500);
    expect(video.muted).toBe(true);
  });
});
