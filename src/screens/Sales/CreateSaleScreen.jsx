import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, FlatList } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { subscribeToItems, addSale } from '../../services/FirestoreService';

const CreateSaleScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [quantity, setQuantity] = useState('1');
    const [paymentStatus, setPaymentStatus] = useState('paid'); // 'paid' or 'unpaid'

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToItems(user.uid, (data) => setItems(data));
        return () => unsubscribe();
    }, [user]);

    const filteredItems = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

    const handleCreateSale = async () => {
        if (!selectedItem) {
            Alert.alert("Selection Error", "Please select an item first.");
            return;
        }
        const qty = parseInt(quantity);
        if (!qty || qty <= 0) {
            Alert.alert("Validation Error", "Quantity must be at least 1.");
            return;
        }
        if (qty > selectedItem.stock) {
            Alert.alert("Stock Error", `Only ${selectedItem.stock} items in stock.`);
            return;
        }

        await processSale();
    };

    const processSale = async () => {
        try {
            await addSale(user.uid, {
                itemId: selectedItem.id,
                itemName: selectedItem.name,
                quantity: parseInt(quantity),
                unitPrice: selectedItem.sellingPrice,
                total: parseInt(quantity) * selectedItem.sellingPrice,
                paymentMethod: paymentStatus, // Storing 'paid' or 'unpaid'
                buyerRef: ''
            });
            Alert.alert("Success", "Sale recorded!", [{ text: "OK", onPress: () => navigation.goBack() }]);
        } catch (error) {
            Alert.alert("Error", "Could not record sale.");
        }
    };

    const calculateTotal = () => {
        if (!selectedItem) return 0;
        return (parseInt(quantity) || 0) * selectedItem.sellingPrice;
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.itemCard, selectedItem?.id === item.id && styles.selectedCard]}
            onPress={() => setSelectedItem(item)}
        >
            <View>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.stock}>Stock: {item.stock}</Text>
            </View>
            <Text style={styles.price}>₹{item.sellingPrice}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* 1. Item Selection */}
            <Text style={styles.label}>Select Item</Text>
            <TextInput
                style={styles.input}
                placeholder="Search item..."
                value={search}
                onChangeText={setSearch}
            />

            <View style={styles.listContainer}>
                <FlatList
                    data={filteredItems}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                />
            </View>

            {/* 2. Sale Details */}
            <View style={styles.detailsContainer}>
                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.label}>Quantity</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={quantity}
                            onChangeText={setQuantity}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Total Amount</Text>
                        <Text style={styles.totalText}>₹{calculateTotal()}</Text>
                    </View>
                </View>

                <Text style={styles.label}>Payment Status</Text>
                <View style={styles.paymentRow}>
                    {['paid', 'unpaid'].map(status => (
                        <TouchableOpacity
                            key={status}
                            style={[styles.paymentOption, paymentStatus === status && styles.activePayment]}
                            onPress={() => setPaymentStatus(status)}
                        >
                            <Text style={[styles.paymentText, paymentStatus === status && styles.activePaymentText]}>
                                {status === 'paid' ? 'Paid' : 'Not Paid'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.submitButton} onPress={handleCreateSale}>
                    <Text style={styles.submitText}>Complete Sale</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
    label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 5 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginBottom: 10 },
    listContainer: { flex: 1, marginBottom: 20 },
    itemCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: '#fff', marginBottom: 8, borderRadius: 8 },
    selectedCard: { borderColor: '#007bff', borderWidth: 2, backgroundColor: '#e3f2fd' },
    itemName: { fontSize: 16, fontWeight: 'bold' },
    stock: { fontSize: 12, color: '#777' },
    price: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32' },
    detailsContainer: { backgroundColor: '#fff', padding: 15, borderRadius: 10, elevation: 5 },
    row: { flexDirection: 'row', marginBottom: 10 },
    totalText: { fontSize: 24, fontWeight: 'bold', color: '#000', marginTop: 5 },
    paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    paymentOption: { flex: 1, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginHorizontal: 4 },
    activePayment: { backgroundColor: '#007bff', borderColor: '#007bff' },
    paymentText: { color: '#333', fontWeight: 'bold' },
    activePaymentText: { color: '#fff' },
    submitButton: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center' },
    submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default CreateSaleScreen;
