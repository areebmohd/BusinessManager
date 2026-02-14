import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';
import TabNavigator from './TabNavigator';
import AddItemScreen from '../screens/Inventory/AddItemScreen';
import ItemDetailScreen from '../screens/Inventory/ItemDetailScreen';
import CreateSaleScreen from '../screens/Sales/CreateSaleScreen';
import SaleDetailScreen from '../screens/Sales/SaleDetailScreen';
import SaleInfoScreen from '../screens/Sales/SaleInfoScreen';
import EditItemScreen from '../screens/Inventory/EditItemScreen';
import PremiumScreen from '../screens/Subscription/PremiumScreen';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, initializing, subscriptionStatus } = useAuth();

  if (initializing || subscriptionStatus === 'loading') {
    // Wait for subscription check too
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // No User -> Login
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : !user.emailVerified ? (
        // User exists but Email NOT verified -> Verification Screen
        <Stack.Screen
          name="EmailVerification"
          component={EmailVerificationScreen}
        />
      ) : subscriptionStatus === 'expired' ? (
        // Subscription Expired -> Premium Paywall
        <Stack.Screen name="Premium" component={PremiumScreen} />
      ) : (
        // User exists AND verified AND Active -> Main App
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          {/* Inner Screens pushed ON TOP of Tabs (hiding tab bar) */}
          <Stack.Screen
            name="AddItem"
            component={AddItemScreen}
            options={{ headerShown: true, title: 'Add Item' }}
          />
          <Stack.Screen
            name="ItemDetail"
            component={ItemDetailScreen}
            options={{ headerShown: true, title: 'Item Details' }}
          />
          <Stack.Screen
            name="EditItem"
            component={EditItemScreen}
            options={{ headerShown: true, title: 'Edit Item' }}
          />
          <Stack.Screen
            name="CreateSale"
            component={CreateSaleScreen}
            options={{ headerShown: true, title: 'New Sale' }}
          />
          <Stack.Screen
            name="SaleDetail"
            component={SaleDetailScreen}
            options={{ headerShown: true, title: 'Sale Details' }}
          />
          <Stack.Screen
            name="SaleInfo"
            component={SaleInfoScreen}
            options={{ headerShown: true, title: 'Sale Information' }}
          />
          {/* Allow access to Premium Screen from settings even if active */}
          <Stack.Screen
            name="Premium"
            component={PremiumScreen}
            options={{
              headerShown: true,
              title: 'Premium Subscription',
              headerStyle: { backgroundColor: '#111827' },
              headerTintColor: '#fff',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
