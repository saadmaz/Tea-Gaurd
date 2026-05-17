import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { EstateProvider } from './src/context/EstateContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <EstateProvider>
        <AppNavigator />
      </EstateProvider>
    </AuthProvider>
  );
}
