// RCTNowPlayingModule — native iOS bridge that populates
// MPNowPlayingInfoCenter (Control Centre / lock screen Now Playing widget)
// with the currently-playing YouTube video's metadata and registers
// MPRemoteCommandCenter handlers so the user can play/pause from Control
// Centre even when the app is backgrounded.
//
// NOTE: MediaPlayer.framework is a standard iOS system framework.
// If Xcode reports a linker error, open the AdsFreePlayer target →
// Build Phases → Link Binary with Libraries → (+) → MediaPlayer.framework.

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCTNowPlayingModule : RCTEventEmitter <RCTBridgeModule>
@end
