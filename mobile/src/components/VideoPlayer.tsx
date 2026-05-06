// VideoPlayer — wraps a YouTube embed inside a WebView.
// We use WebView (not react-native-video) because YouTube videos require the
// official player. The embed URL strips most YouTube chrome already.

import React from 'react';
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {WebView} from 'react-native-webview';
import {colors, radius, spacing, typography} from '../theme';

export interface VideoPlayerProps {
  videoId: string;
  rounded?: boolean;
}

export function VideoPlayer(props: VideoPlayerProps): React.ReactElement {
  const {videoId, rounded = true} = props;
  const [loading, setLoading] = React.useState<boolean>(true);
  const [errored, setErrored] = React.useState<boolean>(false);
  const [reloadKey, setReloadKey] = React.useState<number>(0);

  // Use the YouTube IFrame Player API loaded inside an HTML wrapper.
  // Loading the embed URL directly causes "Error 153 — Video player
  // configuration error" because the WebView origin is null/file://.
  // Setting baseUrl to https://www.youtube.com gives the player a valid origin.
  const safeId = encodeURIComponent(videoId);
  // Visibility shim: override document.hidden / visibilityState so that the
  // YouTube iframe player never detects the app being backgrounded and never
  // auto-pauses. Must run BEFORE the YouTube IFrame API script so that our
  // property descriptors are in place when YT registers its own listeners.
  const bgShim =
    `<script>try{` +
    `Object.defineProperty(document,'hidden',{configurable:true,get:function(){return false;}});` +
    `Object.defineProperty(document,'visibilityState',{configurable:true,get:function(){return 'visible';}});` +
    `var _sv=function(e){e.stopImmediatePropagation&&e.stopImmediatePropagation();};` +
    `document.addEventListener('visibilitychange',_sv,true);` +
    `window.addEventListener('visibilitychange',_sv,true);` +
    `}catch(e){}</script>`;
  const html =
    `<!DOCTYPE html><html><head>` +
    `<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no"/>` +
    `<style>html,body{margin:0;padding:0;background:#000;height:100%;width:100%;overflow:hidden;}` +
    `#player{position:absolute;inset:0;width:100%;height:100%;}</style>` +
    bgShim +
    `</head><body><div id="player"></div>` +
    `<script>var tag=document.createElement('script');tag.src='https://www.youtube.com/iframe_api';` +
    `document.head.appendChild(tag);` +
    `function onYouTubeIframeAPIReady(){new YT.Player('player',{videoId:'${safeId}',` +
    `playerVars:{playsinline:1,modestbranding:1,rel:0,fs:1},` +
    `events:{onReady:function(e){e.target.playVideo();},` +
    `onError:function(e){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('error:'+e.data);}}` +
    `});}</script></body></html>`;

  const handleRetry = (): void => {
    setErrored(false);
    setLoading(true);
    setReloadKey(k => k + 1);
  };

  return (
    <View style={[styles.wrapper, rounded && styles.rounded]}>
      {!errored ? (
        <WebView
          key={reloadKey}
          source={{html, baseUrl: 'https://www.youtube.com'}}
          originWhitelist={['*']}
          allowsFullscreenVideo
          javaScriptEnabled
          domStorageEnabled
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          mixedContentMode="always"
          onLoadEnd={() => setLoading(false)}
          onMessage={event => {
            if (event.nativeEvent.data?.startsWith('error:')) {
              setErrored(true);
              setLoading(false);
            }
          }}
          onError={() => {
            setErrored(true);
            setLoading(false);
          }}
          style={styles.web}
        />
      ) : (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Could not load video.</Text>
          <TouchableOpacity onPress={handleRetry} style={styles.retryBtn}>
            <Text style={styles.retryText}>Tap to try again</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && !errored ? (
        <View style={styles.loaderOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.status.loading} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  rounded: {
    borderRadius: radius.lg,
  },
  web: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00000055',
  },
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorText: {
    color: colors.status.error,
    fontSize: typography.fontSize.md,
    marginBottom: spacing.md,
  },
  retryBtn: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  retryText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
  },
});
