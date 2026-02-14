import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';

import { AlertProvider } from './src/context/AlertContext';
import AppUpdateChecker from './src/components/AppUpdateChecker';

const App = () => {
  return (
    <AuthProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <AlertProvider>
        <NavigationContainer>
          <AppNavigator />
          <AppUpdateChecker />
        </NavigationContainer>
      </AlertProvider>
    </AuthProvider>
  );
};

export default App;
