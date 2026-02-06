import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import InventoryScreen from '../screens/Inventory/InventoryScreen';
import SalesScreen from '../screens/Sales/SalesScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
    return (
        <Tab.Navigator screenOptions={{
            headerShown: false,
            tabBarShowLabel: true,
            tabBarActiveTintColor: '#007bff',
            tabBarInactiveTintColor: '#9CA3AF',
            tabBarStyle: {
                backgroundColor: '#ffffff',
                height: 65,
                paddingTop: 2,
                borderTopWidth: 1,
                borderTopColor: '#F3F4F6',
                elevation: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '600',
                marginTop: 2,
            }
        }}>
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <MaterialIcons name="dashboard" color={color} size={26} />
                    ),
                }}
            />
            <Tab.Screen
                name="Inventory"
                component={InventoryScreen}
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <MaterialIcons name="inventory" color={color} size={26} />
                    ),
                }}
            />
            <Tab.Screen
                name="Sales"
                component={SalesScreen}
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <MaterialIcons name="point-of-sale" color={color} size={26} />
                    ),
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <MaterialIcons name="settings" color={color} size={26} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

export default TabNavigator;
