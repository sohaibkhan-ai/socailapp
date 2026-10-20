import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import Spinner from '@/components/Spinner';

import WelcomeScreen from '@/screens/WelcomeScreen';
import LoginScreen from '@/screens/LoginScreen';
import RegisterScreen from '@/screens/RegisterScreen';
import ForgotPasswordScreen from '@/screens/ForgotPasswordScreen';
import ResetPasswordScreen from '@/screens/ResetPasswordScreen';
import FeedScreen from '@/screens/FeedScreen';
import SearchScreen from '@/screens/SearchScreen';
import CreatePostScreen from '@/screens/CreatePostScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import EditProfileScreen from '@/screens/EditProfileScreen';
import ChangePasswordScreen from '@/screens/ChangePasswordScreen';
import PostDetailScreen from '@/screens/PostDetailScreen';
import EditPostScreen from '@/screens/EditPostScreen';
import UserProfileScreen from '@/screens/UserProfileScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import AdminReportsScreen from '@/screens/AdminReportsScreen';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function TabIcon(name, focused, color) {
  const map = {
    Feed: focused ? 'home' : 'home-outline',
    Search: focused ? 'search' : 'search-outline',
    'New Post': 'add-circle',
    Profile: focused ? 'person' : 'person-outline',
    Reports: focused ? 'shield' : 'shield-outline',
  };
  return <Ionicons name={map[name]} size={24} color={color} />;
}

function MainTabs() {
  const t = useTheme();
  const role = useAuthStore((s) => s.user?.role);
  const isMod = role === 'MODERATOR' || role === 'ADMIN';
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: t.colors.primary,
        tabBarInactiveTintColor: t.colors.textMuted,
        tabBarStyle: { backgroundColor: t.colors.surface, borderTopColor: t.colors.border },
        tabBarIcon: ({ focused, color }) => TabIcon(route.name, focused, color),
        tabBarLabelStyle: { fontSize: 11 },
      })}
    >
      <Tabs.Screen name="Feed" component={FeedScreen} />
      <Tabs.Screen name="Search" component={SearchScreen} />
      <Tabs.Screen
        name="New Post"
        component={CreatePostScreen}
        options={{ presentation: 'modal' }}
      />
      {isMod ? <Tabs.Screen name="Reports" component={AdminReportsScreen} /> : null}
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const t = useTheme();
  const user = useAuthStore((s) => s.user);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const themePref = useSettingsStore((s) => s.theme);
  const scheme = useTheme().isDark ? 'dark' : 'light';
  const effective = themePref === 'system' ? scheme : themePref;

  const navTheme = {
    ...(effective === 'dark' ? DarkTheme : DefaultTheme),
    colors: { ...(effective === 'dark' ? DarkTheme : DefaultTheme).colors, background: t.colors.background, primary: t.colors.primary, card: t.colors.surface, text: t.colors.text, border: t.colors.border },
  };

  if (isBootstrapping) return <Spinner style={{ flex: 1 }} />;

  return (
    <>
      <StatusBar style={effective === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer theme={navTheme}>
        {user ? (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="PostDetail" component={PostDetailScreen} />
            <Stack.Screen name="EditPost" component={EditPostScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ presentation: 'modal' }} />
          </Stack.Navigator>
        ) : (
          <AuthStack />
        )}
      </NavigationContainer>
    </>
  );
}
