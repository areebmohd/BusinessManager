import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, FlatList, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { subscribeToItems, addBulkSales } from '../../services/FirestoreService';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const CreateSaleScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToItems(user.uid, (data) => setItems(data));
        return () => unsubscribe();
    }, [user]);

    // Derived state: Items with cart quantity merged in
    const itemsWithQty = useMemo(() => {
        return items.map(item => {
            const cartItem = cart.find(c => c.id === item.id);
            return cartItem ? { ...item, quantity: cartItem.quantity } : { ...item, quantity: 0 };
        });
    }, [items, cart]);

    const filteredAndSortedItems = useMemo(() => {
        let result = itemsWithQty;

        if (search) {
            result = result.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
        }

        // Sort: Items in cart (quantity > 0) go to top, then alphabetical
        return result.sort((a, b) => {
            if (a.quantity > 0 && b.quantity === 0) return -1;
            if (a.quantity === 0 && b.quantity > 0) return 1;
            return a.name.localeCompare(b.name);
        });
    }, [itemsWithQty, search]);

    const handleQuantityChange = (item, change) => {
        if (item.stock <= 0 && change > 0) {
            Alert.alert("Out of Stock", "This item is currently out of stock.");
            return;
        }

        setCart(prevCart => {
            const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
            const currentQty = existingItem ? existingItem.quantity : 0;
            const newQty = currentQty + change;

            if (newQty > item.stock) {
                Alert.alert("Limit Reached", `Only ${item.stock} units available.`);
                return prevCart;
            }

            if (newQty <= 0) {
                // Remove from cart
                return prevCart.filter(cartItem => cartItem.id !== item.id);
            }

            if (existingItem) {
                // Update existing
                return prevCart.map(cartItem =>
                    cartItem.id === item.id ? { ...cartItem, quantity: newQty } : cartItem
                );
            } else {
                // Add new
                return [...prevCart, { ...item, quantity: newQty }];
            }
        });
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
    };

    const renderItemCard = ({ item }) => {
        const inCart = item.quantity > 0;
        const initialStock = item.initialStock || 0;
        const lowStockThreshold = Math.max(initialStock * 0.1, 0); // 10%
        const isLowStock = item.stock < lowStockThreshold && item.stock > 0;

        return (
            <View style={[styles.itemCard, inCart && styles.itemCardSelected]}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={[styles.stock, isLowStock && styles.lowStock]}>
                        Stock: {item.stock}
                    </Text>
                    <Text style={styles.price}>₹{item.sellingPrice}</Text>
                </View>

                {inCart ? (
                    <View style={styles.qtyContainer}>
                        <TouchableOpacity onPress={() => handleQuantityChange(item, -1)} style={styles.qtyBtn}>
                            <MaterialIcons name="remove" size={20} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity onPress={() => handleQuantityChange(item, 1)} style={styles.qtyBtn}>
                            <MaterialIcons name="add" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity onPress={() => handleQuantityChange(item, 1)}>
                        <MaterialIcons name="add-circle-outline" size={32} color="#007bff" />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={24} color="#777" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search items..."
                        placeholderTextColor="#999"
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <MaterialIcons name="close" size={20} color="#777" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <FlatList
                data={filteredAndSortedItems}
                keyExtractor={item => item.id}
                renderItem={renderItemCard}
                contentContainerStyle={styles.listContent}
            />

            {/* Footer Summary */}
            <View style={styles.footer}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Amount:</Text>
                    <Text style={styles.totalValue}>₹{calculateTotal()}</Text>
                </View>

                <TouchableOpacity
                    style={[styles.completeButton, (cart.length === 0) && styles.disabledButton]}
                    onPress={() => {
                        if (cart.length === 0) return;
                        navigation.navigate('SaleInfo', { cart, totalAmount: calculateTotal() });
                    }}
                    disabled={cart.length === 0}
                >
                    <Text style={styles.completeButtonText}>
                        Next (₹{calculateTotal()})
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    searchSection: { padding: 15, paddingBottom: 10, backgroundColor: '#f5f5f5' },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        elevation: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: '#333',
        paddingVertical: 5,
    },

    listContent: { padding: 15, paddingBottom: 10, paddingTop: 0 },
    itemCard: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10,
        elevation: 1, borderWidth: 1, borderColor: 'transparent'
    },
    itemCardSelected: { borderColor: '#007bff', backgroundColor: '#f0f8ff' },
    itemName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    stock: { fontSize: 12, color: '#666', marginTop: 2 },
    lowStock: { color: '#d32f2f', fontWeight: 'bold' },
    price: { fontSize: 15, fontWeight: 'bold', color: '#2e7d32', marginTop: 4 },

    qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0e0e0', borderRadius: 20, padding: 3 },
    qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#007bff', justifyContent: 'center', alignItems: 'center' },
    qtyText: { marginHorizontal: 15, fontSize: 16, fontWeight: 'bold', color: '#333' },

    footer: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 5
    },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    totalValue: { fontSize: 24, fontWeight: 'bold', color: '#2e7d32' },

    paymentSection: { marginBottom: 15 },
    label: { fontSize: 14, color: '#666', marginBottom: 8 },
    paymentRow: { flexDirection: 'row', justifyContent: 'space-between' },
    paymentOption: { flex: 1, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginHorizontal: 4 },
    activePayment: { backgroundColor: '#007bff', borderColor: '#007bff' },
    paymentText: { color: '#333', fontWeight: 'bold' },
    activePaymentText: { color: '#fff' },

    completeButton: { backgroundColor: '#28a745', padding: 15, borderRadius: 10, alignItems: 'center' },
    disabledButton: { backgroundColor: '#a5d6a7' },
    completeButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default CreateSaleScreen;
