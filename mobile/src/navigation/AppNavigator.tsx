// AppNavigator — bottom tabs for the 4 primary screens.
// The custom TabBar auto-hides when a video is playing and slides back in
// on swipe-up. Icons use emoji to avoid native font-link setup.

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import {HomeScreen} from '../screens/HomeScreen';
import {SearchScreen} from '../screens/SearchScreen';
import {WatchScreen} from '../screens/WatchScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {TabBar} from './TabBar';
import {colors, typography} from '../theme';

export type RootTabParamList = {
  Home: undefined;
  Search: undefined;
  Watch: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function AppNavigator(): React.ReactElement {
  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: colors.accent.red,
          background: colors.background.primary,
          card: colors.background.secondary,
          text: colors.text.primary,
          border: colors.border.subtle,
          notification: colors.accent.red,
        },
      }}>
      <Tab.Navigator
        tabBar={props => <TabBar {...props} />}
        // Keep every screen mounted so switching tabs never kills the WebView.
        detachInactiveScreens={false}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accent.red,
          tabBarInactiveTintColor: colors.text.tertiary,
          tabBarLabelStyle: {
            fontSize: typography.fontSize.xs,
          },
        }}>
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{unmountOnBlur: false}}
        />
        <Tab.Screen
          name="Search"
          component={SearchScreen}
          options={{unmountOnBlur: false}}
        />
        <Tab.Screen
          name="Watch"
          component={WatchScreen}
          options={{unmountOnBlur: false}}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{unmountOnBlur: false}}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
