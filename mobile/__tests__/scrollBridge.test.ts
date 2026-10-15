/**
 * @jest-environment jsdom
 */
// Scroll-direction bridge: kept in its own file so it gets a fresh jsdom page
// (injecting the script twice into one document would register two listeners).

import {youtubeConfig} from '../src/config/youtube.site';
import {DEFAULT_SETTINGS} from '../src/store/types';
import {buildCssFromRules, buildInjectedJs} from '../src/webview/scriptBuilders';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = window as any;

describe('scroll bridge', () => {
  const dirs = (): string[] =>
    (w.__msgs as string[])
      .filter(m => m.startsWith('{'))
      .map(m => JSON.parse(m))
      .filter(m => m.type === 'scroll')
      .map(m => m.dir);

  const scrollTo = (y: number): void => {
    Object.defineProperty(window, 'pageYOffset', {value: y, configurable: true});
    document.dispatchEvent(new Event('scroll'));
  };

  beforeAll(() => {
    w.__msgs = [];
    w.ReactNativeWebView = {postMessage: (m: string) => w.__msgs.push(m)};
    document.body.innerHTML = '<div></div>';
    const css = buildCssFromRules(youtubeConfig.filterRules, DEFAULT_SETTINGS);
    w.eval(buildInjectedJs(css, false, undefined));
  });

  it('reports down once, ignores jitter and repeats, then reports up', () => {
    scrollTo(0);
    scrollTo(3); // jitter < 10px
    expect(dirs()).toEqual([]);
    scrollTo(200);
    scrollTo(400); // still down — no repeat message
    expect(dirs()).toEqual(['down']);
    scrollTo(300);
    expect(dirs()).toEqual(['down', 'up']);
  });

  it('treats being near the top as up', () => {
    scrollTo(500);
    scrollTo(20);
    expect(dirs().slice(-1)).toEqual(['up']);
  });
});
