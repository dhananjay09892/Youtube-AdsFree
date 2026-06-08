// AppNavigator — two main tabs (YouTube + YT Music) plus a Settings route
// accessible via the gear icon in the TabBar. Search and Watch are replaced
// by each site's own built-in search / library UI inside the WebView.

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import {HomeScreen} from '../screens/HomeScreen';
import {YTMusicScreen} from '../screens/YTMusicScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {TabBar} from './TabBar';
import {colors, typography} from '../theme';

export type RootTabParamList = {
  YouTube: undefined;
  YTMusic: undefined;
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
          name="YouTube"
          component={HomeScreen}
          options={{unmountOnBlur: false}}
        />
        <Tab.Screen
          name="YTMusic"
          component={YTMusicScreen}
          options={{unmountOnBlur: false, tabBarLabel: 'YT Music'}}
        />
        {/* Settings is not rendered as a visible tab — the TabBar shows a
            gear icon that navigates here instead. */}
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{unmountOnBlur: false}}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

