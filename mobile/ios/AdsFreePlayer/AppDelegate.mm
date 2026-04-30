#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <AVFoundation/AVFoundation.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"AdsFreePlayer";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  // Enable background audio so YouTube playback continues when the app is
  // minimized or the screen is locked. Paired with UIBackgroundModes=audio
  // in Info.plist and a JS Page Visibility shim in YouTubeWebView.tsx.
  NSError *audioSessionError = nil;
  AVAudioSession *session = [AVAudioSession sharedInstance];
  [session setCategory:AVAudioSessionCategoryPlayback
                  mode:AVAudioSessionModeMoviePlayback
               options:AVAudioSessionCategoryOptionAllowAirPlay
                 error:&audioSessionError];
  if (audioSessionError == nil) {
    [session setActive:YES error:&audioSessionError];
  }
  // Re-activate the audio session whenever the app returns to foreground,
  // and also after iOS interruptions (phone calls, Siri) so playback can
  // resume cleanly in background.
  [[NSNotificationCenter defaultCenter]
      addObserverForName:UIApplicationDidBecomeActiveNotification
                  object:nil
                   queue:[NSOperationQueue mainQueue]
              usingBlock:^(NSNotification * _Nonnull note) {
                NSError *err = nil;
                [[AVAudioSession sharedInstance] setActive:YES error:&err];
              }];
  [[NSNotificationCenter defaultCenter]
      addObserverForName:AVAudioSessionInterruptionNotification
                  object:nil
                   queue:[NSOperationQueue mainQueue]
              usingBlock:^(NSNotification * _Nonnull note) {
                NSNumber *typeValue = note.userInfo[AVAudioSessionInterruptionTypeKey];
                if (typeValue.unsignedIntegerValue == AVAudioSessionInterruptionTypeEnded) {
                  NSError *err = nil;
                  [[AVAudioSession sharedInstance] setActive:YES error:&err];
                }
              }];

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self getBundleURL];
}

- (NSURL *)getBundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
