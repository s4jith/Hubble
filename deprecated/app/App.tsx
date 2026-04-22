import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { COLORS } from './src/constants/theme';
import { Home, Users, FileText, Info } from 'lucide-react-native';
import { store } from './src/store';
import { useAppSelector, useAppDispatch } from './src/store/hooks';
import { loginSuccess } from './src/store/slices/authSlice';
import mockData from './src/data/mockData.json';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
} from '@expo-google-fonts/poppins';
import { View, ActivityIndicator } from 'react-native';

// Auth Screens
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';

// Main App Screens
import DashboardScreen from './src/screens/DashboardScreen';
import FeedScreen from './src/screens/FeedScreen';
import ChatBotScreen from './src/screens/ChatBotScreen';
import ComplaintUploadScreen from './src/screens/ComplaintUploadScreen';
import ReportsLogScreen from './src/screens/ReportsLogScreen';
import AboutScreen from './src/screens/AboutScreen';
import ReportDetailScreen from './src/screens/ReportDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  MainApp: undefined;
  ComplaintUpload: undefined;
  ChatBot: undefined;
  ReportDetail: { reportId: string };
  Profile: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Feed: undefined;
  Reports: undefined;
  About: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: { name: keyof MainTabParamList } }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.borderLight,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500' as const,
          fontFamily: 'Poppins_500Medium',
        },
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
          let IconComponent;

          switch (route.name) {
            case 'Dashboard':
              IconComponent = Home;
              break;
            case 'Feed':
              IconComponent = Users;
              break;
            case 'Reports':
              IconComponent = FileText;
              break;
            case 'About':
              IconComponent = Info;
              break;
            default:
              IconComponent = Home;
          }

          return <IconComponent size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{ tabBarLabel: 'Community' }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsLogScreen}
        options={{ tabBarLabel: 'Reports' }}
      />
      <Tab.Screen
        name="About"
        component={AboutScreen}
        options={{ tabBarLabel: 'About' }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  // BACKEND TODO: Remove this mock data initialization
  // Replace with actual API calls to fetch user data
  useEffect(() => {
    // Load mock data on app start
  }, []);

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      {!isAuthenticated ? (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <RootStack.Screen name="MainApp" component={MainTabNavigator} />
          <RootStack.Screen
            name="ComplaintUpload"
            component={ComplaintUploadScreen}
            options={{
              presentation: 'modal',
            }}
          />
          <RootStack.Screen
            name="ChatBot"
            component={ChatBotScreen}
          />
          <RootStack.Screen
            name="ReportDetail"
            component={ReportDetailScreen}
          />
          <RootStack.Screen
            name="Profile"
            component={ProfileScreen}
          />
        </>
      )}
    </RootStack.Navigator>
  );
}

function AppContent() {
  return (
    <>
      <StatusBar style="dark" />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
