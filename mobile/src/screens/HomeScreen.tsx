// HomeScreen — YouTube home page inside our in-app browser.
import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {SiteHeader} from '../components/SiteHeader';
import {YouTubeWebView} from '../components/YouTubeWebView';
import {youtubeConfig} from '../config/youtube.site';
import {colors} from '../theme';

export function HomeScreen(): React.ReactElement {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <SiteHeader tabId="youtube:/" site={youtubeConfig} />
      <View style={styles.container}>
        <YouTubeWebView path="/" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.background.primary},
  container: {flex: 1},
});
