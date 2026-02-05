
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { addItem } from '../../services/FirestoreService';
import { useAuth } from '../../context/AuthContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import BarcodeScannerModal from '../../components/BarcodeScannerModal';

const AddItemScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [scannerVisible, setScannerVisible] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        sellingPrice: '',
        costPrice: '',
        stock: '',
        category: '',
        barcode: ''
    });

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!formData.name || !formData.sellingPrice || !formData.stock) {
            Alert.alert('Validation Error', 'Name, Price, and Stock are required.');
            return;
        }

        setLoading(true);
        try {
            await addItem(user.uid, {
                name: formData.name,
                sellingPrice: parseFloat(formData.sellingPrice),
                costPrice: parseFloat(formData.costPrice) || 0,
                stock: parseInt(formData.stock),
                initialStock: parseInt(formData.stock),
                category: formData.category,
                barcode: formData.barcode
            });
            Alert.alert('Success', 'Item added successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to save item. Please try again.');
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
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.headerContainer}>
                <Text style={styles.header}>Add New Product</Text>
                <Text style={styles.subHeader}>Enter item details below</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Product Name *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., Wireless Mouse"
                    placeholderTextColor="#9CA3AF"
                    value={formData.name}
                    onChangeText={text => handleChange('name', text)}
                />

                <View style={styles.row}>
                    <View style={styles.halfInput}>
                        <Text style={styles.label}>Selling Price (₹) *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            value={formData.sellingPrice}
                            onChangeText={text => handleChange('sellingPrice', text)}
                        />
                    </View>
                    <View style={styles.halfInput}>
                        <Text style={styles.label}>Cost Price (₹)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            value={formData.costPrice}
                            onChangeText={text => handleChange('costPrice', text)}
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.halfInput}>
                        <Text style={styles.label}>Initial Stock *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            value={formData.stock}
                            onChangeText={text => handleChange('stock', text)}
                        />
                    </View>
                    <View style={styles.halfInput}>
                        <Text style={styles.label}>Category</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Electronics"
                            placeholderTextColor="#9CA3AF"
                            value={formData.category}
                            onChangeText={text => handleChange('category', text)}
                        />
                    </View>
                </View>

                <Text style={styles.label}>Barcode</Text>
                <View style={styles.barcodeContainer}>
                    <TextInput
                        style={[styles.input, styles.barcodeInput]}
                        placeholder="Scan or type barcode"
                        placeholderTextColor="#9CA3AF"
                        value={formData.barcode}
                        onChangeText={text => handleChange('barcode', text)}
                    />
                    <TouchableOpacity style={styles.scanButton} onPress={() => setScannerVisible(true)}>
                        <MaterialIcons name="qr-code-scanner" size={24} color="#007bff" />
                    </TouchableOpacity>
                </View>
            </View>

            <BarcodeScannerModal
                visible={scannerVisible}
                onClose={() => setScannerVisible(false)}
                onScan={(code) => handleChange('barcode', code)}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save Item</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F5F7FA',
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
        marginBottom: 6,
        color: '#374151',
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        marginBottom: 20,
        backgroundColor: '#F9FAFB',
        color: '#111827',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    saveButton: {
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
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    barcodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    barcodeInput: {
        flex: 1,
        marginBottom: 0, // Override default margin
    },
    scanButton: {
        padding: 12,
        marginLeft: 12,
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
});

export default AddItemScreen;
