import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InventoryScreen from '../screens/Inventory/InventoryScreen';
import AddItemScreen from '../screens/Inventory/AddItemScreen';
import ItemDetailScreen from '../screens/Inventory/ItemDetailScreen';
import EditItemScreen from '../screens/Inventory/EditItemScreen';
// import BarcodeScannerScreen from '../screens/Inventory/BarcodeScannerScreen';

const Stack = createNativeStackNavigator();

const InventoryNavigator = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="InventoryList"
                component={InventoryScreen}
                options={{ title: 'Inventory', headerShown: false }}
            />
            <Stack.Screen
                name="AddItem"
                component={AddItemScreen}
                options={{ title: 'Add New Item' }}
            />
            <Stack.Screen
                name="ItemDetail"
                component={ItemDetailScreen}
                options={{ title: 'Item Details' }}
            />
            <Stack.Screen
                name="EditItem"
                component={EditItemScreen}
                options={{ title: 'Edit Item' }}
            />
        </Stack.Navigator>
    );
};

export default InventoryNavigator;
