/**
 * @jest-environment jsdom
 */
// Evaluates the real page-side ad cleaner source against YouTube-shaped data.

import {CLEAN_ADS_SRC} from '../src/webview/adCleaner';

type Result = {feed: number; prevented: number};
const clean = new Function(
  `${CLEAN_ADS_SRC}; return appviewClean;`,
)() as (root: unknown) => Result;

const video = (id: string) => ({
  richItemRenderer: {content: {videoWithContextRenderer: {videoId: id}}},
});
const feedAd = () => ({
  richItemRenderer: {content: {adSlotRenderer: {enablePacfLoggingWeb: true}}},
});

describe('appviewClean', () => {
  it('removes in-feed ad items from the home feed without leaving gaps', () => {
    const data = {
      contents: {
        richGridRenderer: {contents: [video('a'), feedAd(), video('b'), feedAd()]},
      },
    };
    const res = clean(data);
    expect(data.contents.richGridRenderer.contents).toEqual([video('a'), video('b')]);
    expect(res.feed).toBe(2);
  });

  it('removes promoted items from search results', () => {
    const data = {
      contents: [
        {
          itemSectionRenderer: {
            contents: [
              {videoRenderer: {videoId: 'x'}},
              {promotedSparklesTextSearchRenderer: {}},
              {adSlotRenderer: {}},
              {videoRenderer: {videoId: 'y'}},
            ],
          },
        },
      ],
    };
    clean(data);
    expect(data.contents[0].itemSectionRenderer.contents).toEqual([
      {videoRenderer: {videoId: 'x'}},
      {videoRenderer: {videoId: 'y'}},
    ]);
  });

  it('does not delete a whole section just because it contains an ad', () => {
    const data = {
      sections: [
        {itemSectionRenderer: {contents: [{adSlotRenderer: {}}, {videoRenderer: {videoId: 'k'}}]}},
        {itemSectionRenderer: {contents: [{videoRenderer: {videoId: 'm'}}]}},
      ],
    };
    clean(data);
    expect(data.sections).toHaveLength(2);
    expect(data.sections[0].itemSectionRenderer.contents).toEqual([
      {videoRenderer: {videoId: 'k'}},
    ]);
  });

  it('empties player ad payloads at any depth (e.g. /next -> playerResponse)', () => {
    const data = {
      adPlacements: [{adPlacementRenderer: {}}],
      playerAds: [{playerLegacyDesktopWatchAdsRenderer: {}}],
      playerResponse: {
        adSlots: [{a: 1}],
        adBreakHeartbeatParams: 'abc',
        videoDetails: {videoId: 'v'},
      },
    };
    const res = clean(data);
    expect(data.adPlacements).toEqual([]);
    expect(data.playerAds).toEqual([]);
    expect(data.playerResponse.adSlots).toEqual([]);
    expect(data.playerResponse.adBreakHeartbeatParams).toBe('');
    expect(data.playerResponse.videoDetails).toEqual({videoId: 'v'});
    expect(res.prevented).toBe(4);
  });

  it('leaves ad-free data untouched and reports nothing', () => {
    const data = {
      header: {headerRenderer: {title: 'Hi'}},
      loadMore: {continuationItemRenderer: {}},
      list: [video('a'), video('b')],
      adPlacements: [],
    };
    const copy = JSON.parse(JSON.stringify(data));
    const res = clean(data);
    expect(data).toEqual(copy);
    expect(res).toEqual({feed: 0, prevented: 0});
  });

  it('survives null, primitives and frozen objects', () => {
    expect(() => clean(null)).not.toThrow();
    expect(() => clean('str')).not.toThrow();
    expect(() => clean(Object.freeze({adPlacements: [1]}))).not.toThrow();
  });
});
