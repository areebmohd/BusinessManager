import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { subscribeToItems } from '../../services/FirestoreService';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const InventoryScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToItems(
            user.uid,
            (fetchedItems) => {
                setItems(fetchedItems);
                setLoading(false);
            },
            (error) => {
                console.error("Fetch items failed", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ItemDetail', { item })}
        >
            <View style={styles.cardContent}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemCategory}>{item.category || 'Uncategorized'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.itemPrice}>₹{item.sellingPrice}</Text>
                    <Text style={[styles.stockText, item.stock < 5 && styles.lowStock]}>
                        Stock: {item.stock}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {items.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyText}>No items in inventory.</Text>
                    <Text style={styles.emptySubText}>Tap + to add your first product.</Text>
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                />
            )}

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddItem')}
            >
                <MaterialIcons name="add" size={30} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 10,
        paddingBottom: 80, // Space for FAB
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        elevation: 2, // Shadow for Android
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    itemCategory: {
        fontSize: 14,
        color: '#777',
        marginTop: 2,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2e7d32',
    },
    stockText: {
        fontSize: 14,
        color: '#555',
        marginTop: 2,
    },
    lowStock: {
        color: '#d32f2f',
        fontWeight: 'bold',
    },
    emptyText: {
        fontSize: 18,
        color: '#444',
    },
    emptySubText: {
        fontSize: 14,
        color: '#888',
        marginTop: 5,
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 60,
        height: 60,
        backgroundColor: '#007bff',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
});

export default InventoryScreen;
