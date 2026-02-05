import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { updateItem } from '../../services/FirestoreService';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import BarcodeScannerModal from '../../components/BarcodeScannerModal';

const EditItemScreen = ({ route, navigation }) => {
    const { user } = useAuth();
    const { item } = route.params;

    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(item.name);
    const [category, setCategory] = useState(item.category || '');
    const [sellingPrice, setSellingPrice] = useState(String(item.sellingPrice));
    const [purchasePrice, setPurchasePrice] = useState(String(item.purchasePrice));
    const [stock, setStock] = useState(String(item.stock));
    const [barcode, setBarcode] = useState(item.barcode || '');
    const [scannerVisible, setScannerVisible] = useState(false);

    const handleUpdate = async () => {
        if (!name || !sellingPrice || !purchasePrice || !stock) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        try {
            setLoading(true);
            await updateItem(user.uid, item.id, {
                name,
                category,
                sellingPrice: parseFloat(sellingPrice),
                purchasePrice: parseFloat(purchasePrice),
                stock: parseInt(stock),
                barcode: barcode
            });
            Alert.alert('Success', 'Item updated successfully', [
                { text: 'OK', onPress: () => navigation.navigate('Main', { screen: 'Inventory' }) } // Go back to list, details will update via subscription
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to update item');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.card}>
                    <Text style={styles.label}>Item Name *</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. Wireless Mouse"
                    />

                    <Text style={styles.label}>Category</Text>
                    <TextInput
                        style={styles.input}
                        value={category}
                        onChangeText={setCategory}
                        placeholder="e.g. Electronics"
                    />

                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            <Text style={styles.label}>Selling Price *</Text>
                            <TextInput
                                style={styles.input}
                                value={sellingPrice}
                                onChangeText={setSellingPrice}
                                keyboardType="numeric"
                                placeholder="0.00"
                            />
                        </View>
                        <View style={styles.halfInput}>
                            <Text style={styles.label}>Purchase Price *</Text>
                            <TextInput
                                style={styles.input}
                                value={purchasePrice}
                                onChangeText={setPurchasePrice}
                                keyboardType="numeric"
                                placeholder="0.00"
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>Stock Quantity *</Text>
                    <TextInput
                        style={styles.input}
                        value={stock}
                        onChangeText={setStock}
                        keyboardType="numeric"
                        placeholder="0"
                    />

                    <Text style={styles.label}>Barcode</Text>
                    <View style={styles.barcodeContainer}>
                        <TextInput
                            style={[styles.input, styles.barcodeInput]}
                            value={barcode}
                            onChangeText={setBarcode}
                            placeholder="Scan or enter barcode"
                        />
                        <TouchableOpacity style={styles.scanButton} onPress={() => setScannerVisible(true)}>
                            <MaterialIcons name="qr-code-scanner" size={24} color="#007bff" />
                        </TouchableOpacity>
                    </View>
                </View>

                <BarcodeScannerModal
                    visible={scannerVisible}
                    onClose={() => setScannerVisible(false)}
                    onScan={(code) => setBarcode(code)}
                />

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleUpdate}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Save Changes</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        elevation: 2,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#555',
        marginBottom: 5,
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    halfInput: { width: '48%' },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    halfInput: { width: '48%' },
    barcodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    barcodeInput: {
        flex: 1,
    },
    scanButton: {
        padding: 12,
        marginLeft: 10,
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#007bff',
        marginBottom: 15, // Match input margin
    },
    button: {
        backgroundColor: '#28a745',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        elevation: 3,
    },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default EditItemScreen;
