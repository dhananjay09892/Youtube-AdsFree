// AndroidMediaSession — thin wrapper around the native MediaSessionModule.
// On Android this starts/stops the MediaPlaybackService foreground service,
// keeping WebView audio alive in the background.  On iOS all methods are
// silent no-ops so the same JS code works on both platforms.

import {NativeModules, Platform} from 'react-native';

const Module =
  Platform.OS === 'android' ? NativeModules.MediaSession : null;

export interface MediaMetadata {
  title?: string;
  artist?: string;
}

export const AndroidMediaSession = {
  /** Start the foreground service with optional notification metadata. */
  startPlayback(metadata: MediaMetadata = {}): void {
    Module?.startPlayback({
      title:  metadata.title  ?? 'Playing',
      artist: metadata.artist ?? 'AdsFree Player',
    });
  },

  /** Stop the foreground service. */
  stopPlayback(): void {
    Module?.stopPlayback();
  },
};
