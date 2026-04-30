// LibraryScreen — YouTube subscriptions feed inside our in-app browser.
// Users navigate to videos by tapping them anywhere in the app — the WebView
// handles the in-page navigation. This screen just gives them a quick jump
// to their personal feed.

import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {YouTubeWebView} from '../components/YouTubeWebView';
import {colors} from '../theme';

export function WatchScreen(): React.ReactElement {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <YouTubeWebView path="/feed/subscriptions" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.background.primary},
  container: {flex: 1},
});
