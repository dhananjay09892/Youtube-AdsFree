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
  [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayback
                                          mode:AVAudioSessionModeMoviePlayback
                                       options:0
                                         error:&audioSessionError];
  if (audioSessionError == nil) {
    [[AVAudioSession sharedInstance] setActive:YES error:&audioSessionError];
  }

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
