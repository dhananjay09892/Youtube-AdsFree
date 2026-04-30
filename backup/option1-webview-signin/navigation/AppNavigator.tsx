// AppNavigator — bottom tabs for the 4 primary screens.
// Uses emoji icons to avoid native font-link setup for vector icons during
// initial bootstrap. Swap to react-native-vector-icons when fonts are linked.

import React from 'react';
import {Text} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import {HomeScreen} from '../screens/HomeScreen';
import {SearchScreen} from '../screens/SearchScreen';
import {WatchScreen} from '../screens/WatchScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {colors, typography} from '../theme';

export type RootTabParamList = {
  Home: undefined;
  Search: undefined;
  Watch: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

function makeIcon(active: string, inactive: string) {
  // eslint-disable-next-line react/display-name
  return ({focused}: {focused: boolean; color: string; size: number}): React.ReactElement => (
    <Text style={{fontSize: 22}}>{focused ? active : inactive}</Text>
  );
}

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
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.background.secondary,
            borderTopColor: colors.border.subtle,
            borderTopWidth: 1,
            height: 60,
          },
          tabBarActiveTintColor: colors.accent.red,
          tabBarInactiveTintColor: colors.text.tertiary,
          tabBarLabelStyle: {
            fontSize: typography.fontSize.xs,
          },
        }}>
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: makeIcon('🏠', '🏚'),
          }}
        />
        <Tab.Screen
          name="Search"
          component={SearchScreen}
          options={{
            tabBarIcon: makeIcon('🔎', '🔍'),
          }}
        />
        <Tab.Screen
          name="Watch"
          component={WatchScreen}
          options={{
            tabBarIcon: makeIcon('▶️', '⏵'),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarIcon: makeIcon('⚙️', '⚙'),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
