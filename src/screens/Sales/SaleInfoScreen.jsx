
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { addBulkSales, subscribeToSettings } from '../../services/FirestoreService';
import { generateBillText } from '../../utils/BillUtils';
import { shareBillToWhatsApp } from '../../utils/WhatsAppUtils';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const SaleInfoScreen = ({ route, navigation }) => {
    const { user } = useAuth();
    const { cart, totalAmount } = route.params;

    const [buyerName, setBuyerName] = useState('');
    const [buyerNumber, setBuyerNumber] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('upi'); // UI default
    const [loading, setLoading] = useState(false);
    const [saleCompleted, setSaleCompleted] = useState(false);

    // For sharing
    const [businessInfo, setBusinessInfo] = useState({});
    const [lastSale, setLastSale] = useState(null);

    useEffect(() => {
        const unsubscribe = subscribeToSettings(user.uid, (settings) => {
            setBusinessInfo(settings || {});
        });
        return unsubscribe;
    }, []);

    const handleCompleteSale = async () => {
        if (!buyerName) {
            Alert.alert("Required", "Please enter buyer name.");
            return;
        }

        setLoading(true);
        try {
            let storedPaymentMethod = 'paid';
            if (paymentMethod === 'Pending') storedPaymentMethod = 'unpaid';
            else if (paymentMethod === 'UPI') storedPaymentMethod = 'upi';
            else storedPaymentMethod = 'paid'; // Cash

            const saleMetadata = {
                paymentMethod: storedPaymentMethod,
                buyerName: buyerName,
                buyerNumber: buyerNumber,
                timestamp: new Date(),
            };

            const saleId = await addBulkSales(user.uid, cart, saleMetadata);

            // Construct sale object for sharing
            const completedSale = {
                bill_Id: saleId || 'PENDING',
                items: cart.map(item => ({
                    itemName: item.name,
                    quantity: item.quantity,
                    unitPrice: item.sellingPrice,
                    total: item.quantity * item.sellingPrice
                })),
                totalAmount: totalAmount,
                timestamp: saleMetadata.timestamp,
                paymentMethod: storedPaymentMethod,
                buyerName: buyerName,
                buyerNumber: buyerNumber
            };

            setLastSale(completedSale);
            setSaleCompleted(true);
            Alert.alert("Success", "Sale recorded successfully!");

        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to record sale.");
        } finally {
            setLoading(false);
        }
    };

    const handleShareBill = () => {
        if (!lastSale) return;
        const billText = generateBillText(lastSale, businessInfo);
        shareBillToWhatsApp(billText, lastSale.buyerNumber);
    };

    if (saleCompleted) {
        return (
            <View style={styles.container}>
                <View style={styles.successContainer}>
                    <MaterialIcons name="check-circle" size={80} color="#28a745" />
                    <Text style={styles.successText}>Sale Completed!</Text>

                    <TouchableOpacity style={styles.shareButton} onPress={handleShareBill}>
                        <MaterialIcons name="share" size={24} color="#fff" />
                        <Text style={styles.shareButtonText}>Share Bill on WhatsApp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Main', { screen: 'Sales' })}>
                        <Text style={styles.homeButtonText}>Return to Sales</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Customer Details</Text>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Buyer Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter Name"
                    value={buyerName}
                    onChangeText={setBuyerName}
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Mobile Number</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter Number"
                    keyboardType="numeric"
                    value={buyerNumber}
                    onChangeText={setBuyerNumber}
                />
            </View>

            <Text style={styles.header}>Payment Method</Text>
            <View style={styles.paymentContainer}>
                {['Cash', 'UPI', 'Pending'].map(method => (
                    <TouchableOpacity
                        key={method}
                        style={[styles.paymentOption, paymentMethod === method && styles.activePayment]}
                        onPress={() => setPaymentMethod(method)}
                    >
                        <Text style={[styles.paymentText, paymentMethod === method && styles.activePaymentText]}>
                            {method}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.summary}>
                <Text style={styles.summaryText}>Total to Pay</Text>
                <Text style={styles.totalAmount}>₹{totalAmount}</Text>
            </View>

            <TouchableOpacity
                style={styles.completeButton}
                onPress={handleCompleteSale}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.completeButtonText}>Complete Sale</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
    header: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333', marginTop: 10 },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, color: '#666', marginBottom: 5 },
    input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', fontSize: 16 },

    paymentContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    paymentOption: { flex: 1, padding: 15, alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, marginHorizontal: 5, borderWidth: 1, borderColor: '#ddd' },
    activePayment: { backgroundColor: '#007bff', borderColor: '#007bff' },
    paymentText: { fontWeight: 'bold', color: '#555' },
    activePaymentText: { color: '#fff' },

    summary: { alignItems: 'center', marginBottom: 30, padding: 20, backgroundColor: '#fff', borderRadius: 10 },
    summaryText: { fontSize: 16, color: '#666' },
    totalAmount: { fontSize: 32, fontWeight: 'bold', color: '#28a745', marginTop: 5 },

    completeButton: { backgroundColor: '#28a745', padding: 18, borderRadius: 10, alignItems: 'center', elevation: 3 },
    completeButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

    successContainer: { alignItems: 'center', justifyContent: 'center', flex: 1, marginTop: 50 },
    successText: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 40 },

    shareButton: { flexDirection: 'row', backgroundColor: '#25D366', padding: 15, borderRadius: 10, width: '80%', alignItems: 'center', justifyContent: 'center', marginBottom: 20, elevation: 2 },
    shareButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },

    homeButton: { padding: 15, backgroundColor: '#e3f2fd', borderRadius: 10, width: '60%', alignItems: 'center' },
    homeButtonText: { color: '#007bff', fontSize: 16, fontWeight: 'bold' }
});

export default SaleInfoScreen;
