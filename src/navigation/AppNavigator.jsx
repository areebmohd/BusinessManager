import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import TabNavigator from './TabNavigator';
import AddItemScreen from '../screens/Inventory/AddItemScreen';
import ItemDetailScreen from '../screens/Inventory/ItemDetailScreen';
import CreateSaleScreen from '../screens/Sales/CreateSaleScreen';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    const { user, initializing } = useAuth();

    if (initializing) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!user ? (
                <Stack.Screen name="Login" component={LoginScreen} />
            ) : (
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
                        name="CreateSale"
                        component={CreateSaleScreen}
                        options={{ headerShown: true, title: 'New Sale' }}
                    />
                </>
            )}
        </Stack.Navigator>
    );
};

export default AppNavigator;
