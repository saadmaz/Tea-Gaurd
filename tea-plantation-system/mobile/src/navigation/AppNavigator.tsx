import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import DiseaseDetectionScreen from '../screens/DiseaseDetectionScreen';
import PestDetectionScreen from '../screens/PestDetectionScreen';
import FertilizerScreen from '../screens/FertilizerScreen';
import MapScreen from '../screens/MapScreen';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const AppTabs = () => (
  <Tabs.Navigator>
    <Tabs.Screen name="Home" component={HomeScreen} />
    <Tabs.Screen name="Detect" component={DiseaseDetectionScreen} />
    <Tabs.Screen name="Pest" component={PestDetectionScreen} />
    <Tabs.Screen name="Fertilizer" component={FertilizerScreen} />
    <Tabs.Screen name="Map" component={MapScreen} />
  </Tabs.Navigator>
);

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={AppTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
