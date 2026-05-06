#import "RCTNowPlayingModule.h"
#import <MediaPlayer/MediaPlayer.h>
#import <UIKit/UIKit.h>

@implementation RCTNowPlayingModule {
  BOOL _hasListeners;
  BOOL _remoteControlsRegistered;
}

RCT_EXPORT_MODULE()

// Must run on the main thread because MPNowPlayingInfoCenter and
// MPRemoteCommandCenter are UIKit-adjacent APIs.
+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"onRemotePlay", @"onRemotePause"];
}

- (void)startObserving {
  _hasListeners = YES;
}

- (void)stopObserving {
  _hasListeners = NO;
}

// Register play/pause/toggle handlers exactly once.
// MPRemoteCommandCenter uses additive handlers — calling addTargetWithHandler
// more than once on the same command accumulates duplicate handlers, so we
// guard with a BOOL flag.
- (void)registerRemoteControlsOnce {
  if (_remoteControlsRegistered) return;
  _remoteControlsRegistered = YES;

  MPRemoteCommandCenter *cc = [MPRemoteCommandCenter sharedCommandCenter];

  [cc.playCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent *event) {
    if (self->_hasListeners) {
      [self sendEventWithName:@"onRemotePlay" body:nil];
    }
    return MPRemoteCommandHandlerStatusSuccess;
  }];

  [cc.pauseCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent *event) {
    if (self->_hasListeners) {
      [self sendEventWithName:@"onRemotePause" body:nil];
    }
    return MPRemoteCommandHandlerStatusSuccess;
  }];

  // Headphone single-tap and Control Centre play/pause icon both fire this.
  [cc.togglePlayPauseCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent *event) {
    if (self->_hasListeners) {
      [self sendEventWithName:@"onRemotePlay" body:@{@"toggle": @YES}];
    }
    return MPRemoteCommandHandlerStatusSuccess;
  }];
}

// update({title, artist, artwork}) — call whenever the playing video changes.
RCT_EXPORT_METHOD(update:(NSDictionary *)info) {
  dispatch_async(dispatch_get_main_queue(), ^{
    [self registerRemoteControlsOnce];

    NSMutableDictionary *nowPlaying = [NSMutableDictionary new];
    nowPlaying[MPMediaItemPropertyTitle]             = info[@"title"]  ?: @"";
    nowPlaying[MPMediaItemPropertyArtist]            = info[@"artist"] ?: @"";
    nowPlaying[MPNowPlayingInfoPropertyIsLiveStream] = @NO;
    nowPlaying[MPNowPlayingInfoPropertyPlaybackRate] = @1.0;
    MPNowPlayingInfoCenter.defaultCenter.nowPlayingInfo = nowPlaying;

    // Fetch artwork from the YouTube thumbnail URL in the background so we
    // don't stall the main thread.
    NSString *artworkURLString = info[@"artwork"];
    if (artworkURLString.length > 0) {
      NSURL *artworkURL = [NSURL URLWithString:artworkURLString];
      dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        NSData *data   = [NSData dataWithContentsOfURL:artworkURL];
        UIImage *image = data ? [UIImage imageWithData:data] : nil;
        if (!image) return;
        MPMediaItemArtwork *artwork = [[MPMediaItemArtwork alloc]
            initWithBoundsSize:image.size
               requestHandler:^UIImage * _Nonnull(CGSize __unused size) {
                 return image;
               }];
        dispatch_async(dispatch_get_main_queue(), ^{
          NSMutableDictionary *updated =
              [MPNowPlayingInfoCenter.defaultCenter.nowPlayingInfo mutableCopy]
              ?: [NSMutableDictionary new];
          updated[MPMediaItemPropertyArtwork] = artwork;
          MPNowPlayingInfoCenter.defaultCenter.nowPlayingInfo = updated;
        });
      });
    }
  });
}

// setPlaybackState(playing) — call on every play/pause transition so the
// rate shown in the Now Playing widget stays in sync with reality.
RCT_EXPORT_METHOD(setPlaybackState:(BOOL)playing) {
  dispatch_async(dispatch_get_main_queue(), ^{
    NSMutableDictionary *info =
        [MPNowPlayingInfoCenter.defaultCenter.nowPlayingInfo mutableCopy]
        ?: [NSMutableDictionary new];
    info[MPNowPlayingInfoPropertyPlaybackRate] = @(playing ? 1.0 : 0.0);
    MPNowPlayingInfoCenter.defaultCenter.nowPlayingInfo = info;
  });
}

// clear() — remove Now Playing info (e.g. when user leaves the watch screen).
RCT_EXPORT_METHOD(clear) {
  dispatch_async(dispatch_get_main_queue(), ^{
    MPNowPlayingInfoCenter.defaultCenter.nowPlayingInfo = nil;
  });
}

@end
