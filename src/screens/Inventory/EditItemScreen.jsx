import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { updateItem } from '../../services/FirestoreService';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import BarcodeScannerModal from '../../components/BarcodeScannerModal';

const EditItemScreen = ({ route, navigation }) => {
    const { user } = useAuth();
    const { showAlert } = useAlert();
    const { item } = route.params;

    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(item.name);
    const [category, setCategory] = useState(item.category || '');
    const [sellingPrice, setSellingPrice] = useState(String(item.sellingPrice));
    const [costPrice, setCostPrice] = useState(String(item.costPrice || item.purchasePrice || '0'));
    const [stock, setStock] = useState(String(item.stock));
    const [barcode, setBarcode] = useState(item.barcode || '');
    const [scannerVisible, setScannerVisible] = useState(false);

    const handleUpdate = async () => {
        if (!name || !sellingPrice || !stock) {
            showAlert('Error', 'Please fill all required fields', 'error');
            return;
        }

        try {
            setLoading(true);
            await updateItem(user.uid, item.id, {
                name,
                category,
                sellingPrice: parseFloat(sellingPrice),
                costPrice: parseFloat(costPrice),
                stock: parseInt(stock),
                barcode: barcode
            });
            showAlert('Success', 'Item updated successfully', 'success', [
                { text: 'OK', onPress: () => navigation.navigate('Main', { screen: 'Inventory' }) }
            ]);
        } catch (error) {
            showAlert('Error', 'Failed to update item', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.headerContainer}>
                    <Text style={styles.header}>Edit Product</Text>
                    <Text style={styles.subHeader}>Update item details</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>Item Name *</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. Wireless Mouse"
                        placeholderTextColor="#9CA3AF"
                        selectionColor="#007bff"
                    />

                    <Text style={styles.label}>Category</Text>
                    <TextInput
                        style={styles.input}
                        value={category}
                        onChangeText={setCategory}
                        placeholder="e.g. Electronics"
                        placeholderTextColor="#9CA3AF"
                        selectionColor="#007bff"
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
                                placeholderTextColor="#9CA3AF"
                                selectionColor="#007bff"
                            />
                        </View>
                        <View style={styles.halfInput}>
                            <Text style={styles.label}>Cost Price</Text>
                            <TextInput
                                style={styles.input}
                                value={costPrice}
                                onChangeText={setCostPrice}
                                keyboardType="numeric"
                                placeholder="0.00"
                                placeholderTextColor="#9CA3AF"
                                selectionColor="#007bff"
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
                        placeholderTextColor="#9CA3AF"
                        selectionColor="#007bff"
                    />

                    <Text style={styles.label}>Barcode</Text>
                    <View style={styles.barcodeContainer}>
                        <TextInput
                            style={[styles.input, styles.barcodeInput]}
                            value={barcode}
                            onChangeText={setBarcode}
                            placeholder="Scan or enter barcode"
                            placeholderTextColor="#9CA3AF"
                            selectionColor="#007bff"
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
                    <Text style={styles.buttonText}>Save Changes</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 40,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA'
    },
    headerContainer: {
        marginBottom: 24,
    },
    header: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
    },
    subHeader: {
        fontSize: 14,
        color: '#6B7280',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        backgroundColor: '#F9FAFB',
        marginBottom: 20,
        color: '#111827',
    },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    halfInput: { width: '48%' },
    barcodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    barcodeInput: {
        flex: 1,
        marginBottom: 0,
    },
    scanButton: {
        padding: 12,
        marginLeft: 12,
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    button: {
        backgroundColor: '#007bff',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#007bff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default EditItemScreen;
