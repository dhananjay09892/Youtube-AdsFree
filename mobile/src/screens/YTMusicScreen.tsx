// YTMusicScreen — YouTube Music home page inside our in-app browser.
import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {SiteHeader} from '../components/SiteHeader';
import {SiteWebView} from '../components/SiteWebView';
import {ytMusicConfig} from '../config/ytmusic.site';
import {colors} from '../theme';

export function YTMusicScreen(): React.ReactElement {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <SiteHeader tabId="ytmusic:/" site={ytMusicConfig} />
      <View style={styles.container}>
        <SiteWebView site={ytMusicConfig} path="/" tabId="ytmusic:/" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.background.primary},
  container: {flex: 1},
});
