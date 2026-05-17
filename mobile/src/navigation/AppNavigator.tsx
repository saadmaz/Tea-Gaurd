import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import DiseaseDetectionScreen from '../screens/DiseaseDetectionScreen';
import PestDetectionScreen from '../screens/PestDetectionScreen';
import FertilizerScreen from '../screens/FertilizerScreen';
import WeatherScreen from '../screens/WeatherScreen';
import MapScreen from '../screens/MapScreen';
import HistoryScreen from '../screens/HistoryScreen';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  Home: '🏡',
  DiseaseDetection: '🔬',
  PestDetection: '🦟',
  Fertilizer: '🌱',
  Map: '🗺',
};

function AppTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        tabBarLabel: route.name === 'DiseaseDetection' ? 'Disease' : route.name === 'PestDetection' ? 'Pest' : route.name,
        tabBarIcon: ({ focused }) => {
          const icon = TAB_ICONS[route.name] ?? '●';
          return <View><ActivityIndicator style={{ display: 'none' }} /></View>;
        },
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#9E9E9E',
        headerShown: false,
      })}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="DiseaseDetection" component={DiseaseDetectionScreen} options={{ title: 'Disease' }} />
      <Tabs.Screen name="PestDetection" component={PestDetectionScreen} options={{ title: 'Pest' }} />
      <Tabs.Screen name="Fertilizer" component={FertilizerScreen} />
      <Tabs.Screen name="Map" component={MapScreen} />
    </Tabs.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: true, title: 'Create Account' }} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={AppTabs} />
      <Stack.Screen name="History" component={HistoryScreen} options={{ headerShown: true, title: 'Detection History', headerTintColor: '#2E7D32' }} />
      <Stack.Screen name="Weather" component={WeatherScreen} options={{ headerShown: true, title: 'Weather', headerTintColor: '#1565C0' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { state } = useAuth();

  if (!state.bootstrapped) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {state.token ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
