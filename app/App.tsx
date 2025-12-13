import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, Animated, StyleSheet } from 'react-native';
import { COLORS } from './src/constants/theme';
import { Home, Activity, Search, Settings, FileWarning } from 'lucide-react-native';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import MonitoringScreen from './src/screens/MonitoringScreen';
import AnalyzeScreen from './src/screens/AnalyzeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ReportScreen from './src/screens/ReportScreen';
import ResourcesScreen from './src/screens/ResourcesScreen';

import { LucideIcon } from 'lucide-react-native';

// ... imports

export type RootStackParamList = {
  Main: undefined;
  Resources: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Monitor: undefined;
  Report: undefined;
  Analyze: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

interface AnimatedTabIconProps {
  focused: boolean;
  icon: any;
}

const AnimatedTabIcon = ({ focused, icon: Icon }: AnimatedTabIconProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.15,
          useNativeDriver: true,
          friction: 4,
          tension: 100,
        }),
        Animated.spring(translateYAnim, {
          toValue: -8,
          useNativeDriver: true,
          friction: 4,
          tension: 100,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 4,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 4,
        }),
      ]).start();
    }
  }, [focused]);

  return (
    <Animated.View
      style={[
        styles.iconWrapper,
        {
          transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
        },
      ]}
    >
      <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
        <Icon
          color={focused ? COLORS.background : COLORS.textSecondary}
          size={22}
          strokeWidth={focused ? 2.5 : 2}
        />
      </View>
    </Animated.View>
  );
};

function TabNavigator() {
  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon icon={Home} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Monitor"
        component={MonitoringScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon icon={Activity} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Report"
        component={ReportScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon icon={FileWarning} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Analyze"
        component={AnalyzeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon icon={Search} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon icon={Settings} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="Resources" component={ResourcesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 0,
    height: 70,
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    borderRadius: 35,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
  },
  tabBarItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 46,
    height: 46,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconContainerFocused: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
});
