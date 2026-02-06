import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { useAlert } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';
import { subscribeToItems, addBulkSales } from '../../services/FirestoreService';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import BarcodeScannerModal from '../../components/BarcodeScannerModal';

const CreateSaleScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { showAlert } = useAlert();
    const [items, setItems] = useState([]);
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState('');
    const [scannerVisible, setScannerVisible] = useState(false);

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
            result = result.filter(i =>
                i.name.toLowerCase().includes(search.toLowerCase()) ||
                (i.barcode && i.barcode.toLowerCase().includes(search.toLowerCase()))
            );
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
            showAlert("Out of Stock", "This item is currently out of stock.", "warning");
            return;
        }

        setCart(prevCart => {
            const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
            const currentQty = existingItem ? existingItem.quantity : 0;
            const newQty = currentQty + change;

            if (newQty > item.stock) {
                showAlert("Limit Reached", `Only ${item.stock} units available.`, "warning");
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

    const renderItemCard = React.useCallback(({ item }) => {
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
    }, [handleQuantityChange]);

    return (
        <View style={styles.container}>
            <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={24} color="#007bff" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search items..."
                        placeholderTextColor="#6B7280"
                        selectionColor="#007bff"
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <MaterialIcons name="close" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => setScannerVisible(true)} style={{ marginLeft: 10 }}>
                        <MaterialIcons name="qr-code-scanner" size={24} color="#007bff" />
                    </TouchableOpacity>
                </View>

                <BarcodeScannerModal
                    visible={scannerVisible}
                    onClose={() => setScannerVisible(false)}
                    onScan={(code) => setSearch(code)}
                />
            </View>

            <FlatList
                data={filteredAndSortedItems}
                keyExtractor={item => item.id}
                renderItem={renderItemCard}
                contentContainerStyle={styles.listContent}
                initialNumToRender={10}
                windowSize={5}
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
    container: { flex: 1, backgroundColor: '#F5F7FA' }, // Updated background
    searchSection: { padding: 20, paddingBottom: 10, backgroundColor: '#F5F7FA' }, // Updated padding and bg
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 0, // Flat
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#111827',
        paddingVertical: 0,
    },

    listContent: { paddingHorizontal: 20, paddingBottom: 180, paddingTop: 10 }, // Increased bottom padding for footer
    itemCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16, // Radius 16
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'transparent'
    },
    itemCardSelected: {
        borderColor: '#007bff',
        backgroundColor: '#F0F9FF', // Lighter blue bg for selected
        borderWidth: 1
    },
    itemName: { fontSize: 16, fontWeight: '700', color: '#111827' },
    stock: { fontSize: 13, color: '#6B7280', marginTop: 4, fontWeight: '500' },
    lowStock: { color: '#D32F2F', fontWeight: 'bold' },
    price: { fontSize: 16, fontWeight: '800', color: '#111827', marginTop: 4 }, // Dark price

    qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 20, padding: 4 },
    qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#007bff', justifyContent: 'center', alignItems: 'center', elevation: 2 },
    qtyText: { marginHorizontal: 16, fontSize: 16, fontWeight: '700', color: '#111827' },

    footer: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        elevation: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    totalLabel: { fontSize: 18, fontWeight: '700', color: '#111827' },
    totalValue: { fontSize: 24, fontWeight: '800', color: '#007bff' },

    paymentSection: { marginBottom: 15 },
    label: { fontSize: 14, color: '#666', marginBottom: 8 },
    paymentRow: { flexDirection: 'row', justifyContent: 'space-between' },
    paymentOption: { flex: 1, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginHorizontal: 4 },
    activePayment: { backgroundColor: '#007bff', borderColor: '#007bff' },
    paymentText: { color: '#333', fontWeight: 'bold' },
    activePaymentText: { color: '#fff' },

    completeButton: {
        backgroundColor: '#007bff', // Match theme
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#007bff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
    },
    disabledButton: { backgroundColor: '#A0A0A0', shadowOpacity: 0, elevation: 0 },
    completeButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});

export default CreateSaleScreen;
