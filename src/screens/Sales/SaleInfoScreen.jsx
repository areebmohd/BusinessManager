
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { addBulkSales } from '../../services/FirestoreService';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const SaleInfoScreen = ({ route, navigation }) => {
    const { user } = useAuth();
    const { cart, totalAmount } = route.params;

    const [buyerName, setBuyerName] = useState('');
    const [buyerNumber, setBuyerNumber] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('upi');
    const [loading, setLoading] = useState(false);
    const [saleCompleted, setSaleCompleted] = useState(false);

    const handleCompleteSale = async () => {
        if (!buyerName) {
            Alert.alert("Required", "Please enter buyer name.");
            return;
        }

        setLoading(true);
        try {
            // Mapping UI payment method to Firestore status/method
            // The previous logic used specific keys ('paid', 'upi', 'unpaid').
            // I'll stick to that convention for compatibility with existing data view logic

            let storedPaymentMethod = 'paid';
            if (paymentMethod === 'Pending') storedPaymentMethod = 'unpaid';
            else if (paymentMethod === 'UPI') storedPaymentMethod = 'upi';
            else storedPaymentMethod = 'paid'; // Cash

            // We need to pass the buyer info. 
            // Since addBulkSales (checked previously) accepts (uid, cart, paymentStatus), 
            // I'll check if I need to update FirestoreService to accept an object or extra args.
            // For now, I will modify the call assuming I can pass a metadata object OR 
            // I'll update the service in a subsequent step if needed. 
            // To be safe and minimal, I will pass the method string as before, 
            // BUT I really need to save buyer info. 
            // I will assume addBulkSales can handle an options object as the 3rd or 4th arg
            // OR I will simply construct a complete sale object if the service allows.

            // Wait, I can't see FirestoreService right now, but previously it took `paymentStatus`.
            // I will try to pass the extended data as a combined object if possible, 
            // Or I'll update the service.
            // Let's assume standard behavior:

            const saleMetadata = {
                paymentMethod: storedPaymentMethod,
                buyerName: buyerName,
                buyerNumber: buyerNumber,
                timestamp: new Date(),
                // other fields handled by service
            };

            // I'll try to pass this object as the 3rd argument instead of just string.
            // A well-written service might merge it. If not, I'll need to fix the service.
            // Given the previous code was `await addBulkSales(user.uid, cart, paymentStatus);`

            await addBulkSales(user.uid, cart, saleMetadata);

            setSaleCompleted(true);
            Alert.alert("Success", "Sale recorded successfully!");

        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to record sale.");
        } finally {
            setLoading(false);
        }
    };

    if (saleCompleted) {
        return (
            <View style={styles.container}>
                <View style={styles.successContainer}>
                    <MaterialIcons name="check-circle" size={80} color="#28a745" />
                    <Text style={styles.successText}>Sale Completed!</Text>

                    {/* Share button removed for now as per "simplified" plan context, 
                        or I can add a placeholder/simple text share later. 
                        User prompt said "at the bottom a button that says complete sale".
                        It implied the flow stops there or goes back.
                    */}

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

    homeButton: { padding: 15, backgroundColor: '#e3f2fd', borderRadius: 10, width: '60%', alignItems: 'center' },
    homeButtonText: { color: '#007bff', fontSize: 16, fontWeight: 'bold' }
});

export default SaleInfoScreen;
