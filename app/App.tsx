import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { COLORS } from './src/constants/theme';
import { Home, Users, FileText, Settings } from 'lucide-react-native';
import { store } from './src/store';
import { useAppSelector, useAppDispatch } from './src/store/hooks';
import { loginSuccess } from './src/store/slices/authSlice';
import mockData from './src/data/mockData.json';

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
import SettingsScreen from './src/screens/SettingsScreenNew';
import CreatePostScreen from './src/screens/CreatePostScreen';
import ReportDetailScreen from './src/screens/ReportDetailScreen';

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
  CreatePost: undefined;
  ReportDetail: { reportId: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Feed: undefined;
  Reports: undefined;
  Settings: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// BACKEND TODO: Implement authentication state management
// Use Context API or Redux to manage user authentication state
// Store auth token in secure storage using expo-secure-store
// Check authentication status on app launch
// Automatically navigate to MainApp if user is authenticated

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
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.yellow,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarIcon: ({ focused, color, size }) => {
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
            case 'Settings':
              IconComponent = Settings;
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
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  // Load mock data on app start
  useEffect(() => {
    // BACKEND TODO: Remove this mock data initialization
    // Replace with actual API calls to fetch user data
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
            name="CreatePost"
            component={CreatePostScreen}
            options={{
              presentation: 'modal',
            }}
          />
          <RootStack.Screen
            name="ReportDetail"
            component={ReportDetailScreen}
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
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
