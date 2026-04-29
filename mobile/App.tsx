// App entry — wraps the navigator in gesture handler + safe area + error
// boundary, and loads persisted settings on mount.

import 'react-native-gesture-handler';
import React from 'react';
import {StatusBar, View, ActivityIndicator, StyleSheet} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {AppNavigator} from './src/navigation/AppNavigator';
import {ErrorBoundary} from './src/components/ErrorBoundary';
import {useStore} from './src/store/useStore';
import {colors} from './src/theme';

function App(): React.ReactElement {
  const isLoading = useStore(s => s.isLoading);
  const loadSettingsFromStorage = useStore(s => s.loadSettingsFromStorage);

  React.useEffect(() => {
    void loadSettingsFromStorage();
  }, [loadSettingsFromStorage]);

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.status.loading} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <StatusBar
            barStyle="light-content"
            backgroundColor={colors.background.primary}
          />
          <AppNavigator />
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
  },
});

export default App;
