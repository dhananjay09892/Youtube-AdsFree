import {shouldHideBar} from '../src/navigation/barVisibility';
import {useStore} from '../src/store/useStore';

const base = {scrollDown: false, videoActive: false, onSettings: false, searchOpen: false};

describe('shouldHideBar', () => {
  it('shows the pill on a normal page', () => {
    expect(shouldHideBar(base)).toBe(false);
  });

  it('hides while scrolling down', () => {
    expect(shouldHideBar({...base, scrollDown: true})).toBe(true);
  });

  it('hides on video pages', () => {
    expect(shouldHideBar({...base, videoActive: true})).toBe(true);
  });

  it('hides while search is open, even on Settings', () => {
    expect(shouldHideBar({...base, searchOpen: true})).toBe(true);
    expect(shouldHideBar({...base, searchOpen: true, onSettings: true})).toBe(true);
  });

  it('never hides on Settings (a stale scroll/video state must not trap the user)', () => {
    expect(
      shouldHideBar({...base, onSettings: true, scrollDown: true, videoActive: true}),
    ).toBe(false);
  });
});

describe('store: scroll + search + ad stats', () => {
  it('tracks scroll direction and search overlay', () => {
    useStore.getState().setScrollDir('down');
    expect(useStore.getState().scrollDir).toBe('down');
    useStore.getState().setScrollDir('up');
    expect(useStore.getState().scrollDir).toBe('up');
    useStore.getState().setSearchOpen(true);
    expect(useStore.getState().searchOpen).toBe(true);
    useStore.getState().setSearchOpen(false);
  });

  it('accumulates and resets ad stats', () => {
    useStore.getState().resetAdStats();
    useStore.getState().addAdStats({feed: 2, prevented: 1, skipped: 0});
    useStore.getState().addAdStats({feed: 1, prevented: 0, skipped: 3});
    expect(useStore.getState().adStats).toEqual({feed: 3, prevented: 1, skipped: 3});
    useStore.getState().resetAdStats();
    expect(useStore.getState().adStats).toEqual({feed: 0, prevented: 0, skipped: 0});
  });
});
