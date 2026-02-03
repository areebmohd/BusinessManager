import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import InventoryNavigator from './InventoryNavigator';
import SalesNavigator from './SalesNavigator';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
    return (
        <Tab.Navigator screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#007bff',
            tabBarStyle: {
                height: 65,
                paddingTop: 5,
                paddingBottom: 10,
            }
        }}>
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="dashboard" color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="InventoryTab"
                component={InventoryNavigator}
                options={{
                    tabBarLabel: 'Inventory',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="inventory" color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="SalesTab"
                component={SalesNavigator}
                options={{
                    tabBarLabel: 'Sales',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="point-of-sale" color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="settings" color={color} size={size} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

export default TabNavigator;
