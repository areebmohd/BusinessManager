import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SalesScreen from '../screens/Sales/SalesScreen';
import CreateSaleScreen from '../screens/Sales/CreateSaleScreen';

const Stack = createNativeStackNavigator();

const SalesNavigator = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="SalesHistory"
                component={SalesScreen}
                options={{ title: 'Sales History' }}
            />
            <Stack.Screen
                name="CreateSale"
                component={CreateSaleScreen}
                options={{ title: 'New Sale' }}
            />
        </Stack.Navigator>
    );
};

export default SalesNavigator;
