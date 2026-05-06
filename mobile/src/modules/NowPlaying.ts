// NowPlaying — thin TypeScript wrapper around the native RCTNowPlayingModule.
// On iOS it populates MPNowPlayingInfoCenter (Control Centre / lock screen)
// and proxies MPRemoteCommandCenter events back to JavaScript.
// On Android all methods are silent no-ops so the same JS code works on both
// platforms without runtime errors.

import {NativeEventEmitter, NativeModules, Platform} from 'react-native';

const Module =
  Platform.OS === 'ios' ? NativeModules.RCTNowPlayingModule : null;

const emitter: NativeEventEmitter | null = Module
  ? new NativeEventEmitter(Module)
  : null;

export interface NowPlayingInfo {
  title: string;
  artist: string;
  /** Full URL to the video thumbnail (e.g. YouTube hqdefault.jpg). */
  artwork?: string;
}

interface Subscription {
  remove: () => void;
}

export const NowPlaying = {
  /** Set the Now Playing metadata shown in Control Centre / lock screen. */
  update(info: NowPlayingInfo): void {
    Module?.update(info);
  },

  /**
   * Sync the playback-rate indicator in Now Playing.
   * Call with `true` when the video plays, `false` when it pauses.
   */
  setPlaybackState(playing: boolean): void {
    Module?.setPlaybackState(playing);
  },

  /** Remove Now Playing info entirely (e.g. when leaving the watch screen). */
  clear(): void {
    Module?.clear();
  },

  /**
   * Fired when the user presses Play in Control Centre / lock screen,
   * or taps the headphone remote (single tap = toggle).
   * `data.toggle === true` means this was a toggle tap — check current state
   * in your handler to decide whether to play or pause.
   */
  onRemotePlay(
    cb: (data: {toggle?: boolean} | null) => void,
  ): Subscription {
    if (!emitter) return {remove: () => {}};
    return emitter.addListener('onRemotePlay', cb);
  },

  /** Fired when the user presses Pause in Control Centre / lock screen. */
  onRemotePause(cb: () => void): Subscription {
    if (!emitter) return {remove: () => {}};
    return emitter.addListener('onRemotePause', cb);
  },

  /** Fired when the user presses Next Track in Control Centre / lock screen. */
  onRemoteNext(cb: () => void): Subscription {
    if (!emitter) return {remove: () => {}};
    return emitter.addListener('onRemoteNext', cb);
  },

  /** Fired when the user presses Previous Track in Control Centre / lock screen. */
  onRemotePrev(cb: () => void): Subscription {
    if (!emitter) return {remove: () => {}};
    return emitter.addListener('onRemotePrev', cb);
  },
};
