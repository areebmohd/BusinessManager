
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
        <ScrollView style={styles.container}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
                style={styles.input}
                placeholder="e.g., Wireless Mouse"
                value={formData.name}
                onChangeText={text => handleChange('name', text)}
            />

            <View style={styles.row}>
                <View style={styles.halfInput}>
                    <Text style={styles.label}>Selling Price (₹) *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="0.00"
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
                        keyboardType="numeric"
                        value={formData.costPrice}
                        onChangeText={text => handleChange('costPrice', text)}
                    />
                </View>
            </View>

            <Text style={styles.label}>Initial Stock *</Text>
            <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="numeric"
                value={formData.stock}
                onChangeText={text => handleChange('stock', text)}
            />

            <Text style={styles.label}>Category</Text>
            <TextInput
                style={styles.input}
                placeholder="e.g., Electronics"
                value={formData.category}
                onChangeText={text => handleChange('category', text)}
            />

            <Text style={styles.label}>Barcode</Text>
            <View style={styles.barcodeContainer}>
                <TextInput
                    style={[styles.input, styles.barcodeInput]}
                    placeholder="Scan or type barcode"
                    value={formData.barcode}
                    onChangeText={text => handleChange('barcode', text)}
                />
                <TouchableOpacity style={styles.scanButton} onPress={() => setScannerVisible(true)}>
                    <MaterialIcons name="qr-code-scanner" size={24} color="#007bff" />
                </TouchableOpacity>
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
        backgroundColor: '#fff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 5,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
        backgroundColor: '#f9f9f9',
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
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 40,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
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
        marginLeft: 10,
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#007bff',
    },
});

export default AddItemScreen;
