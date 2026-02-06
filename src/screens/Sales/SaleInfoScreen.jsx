import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { addBulkSales, subscribeToSettings } from '../../services/FirestoreService';
import { generateBillText } from '../../utils/BillUtils';
import { shareBillToWhatsApp } from '../../utils/WhatsAppUtils';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import QRCode from 'react-native-qrcode-svg';

const SaleInfoScreen = ({ route, navigation }) => {
    const { user } = useAuth();
    const { cart, totalAmount } = route.params;

    const [buyerName, setBuyerName] = useState('');
    const [buyerNumber, setBuyerNumber] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('upi'); // UI default
    const [loading, setLoading] = useState(false);
    const [saleCompleted, setSaleCompleted] = useState(false);

    // For sharing & UPI
    const [businessInfo, setBusinessInfo] = useState({});
    const [lastSale, setLastSale] = useState(null);
    const [showQR, setShowQR] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToSettings(user.uid, (settings) => {
            const info = settings || {};
            // Ensure nested structure is flattened or handled consistent with BillUtils 
            // Currently BillUtils handles nested details. Let's start storing businessInfo.
            // If settings has businessDetails, we might want to access that for UPI ID.
            if (settings && settings.businessDetails) {
                // Merge businessDetails into the top level for easier access if preferred, 
                // or just keep structure.
                setBusinessInfo({ ...settings, ...settings.businessDetails });
            } else {
                setBusinessInfo(settings || {});
            }
        });
        return unsubscribe;
    }, []);

    const finalizeSale = async () => {
        // Validation handled in wrapper
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
            setShowQR(false); // Close QR if open
        }
    };

    const handleCompleteSaleCheck = async () => {
        if (!buyerName) {
            Alert.alert("Required", "Please enter buyer name.");
            return;
        }

        // Check for UPI flow
        if (paymentMethod === 'UPI' && businessInfo.upiId) {
            setShowQR(true);
            return;
        }

        // Proceed directly if not UPI or no UPI ID configured
        await finalizeSale();
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

    // UPI QR Value: upi://pay?pa=URI&pn=NAME&am=AMOUNT&cu=INR
    const qrValue = businessInfo.upiId
        ? `upi://pay?pa=${businessInfo.upiId}&pn=${encodeURIComponent(businessInfo.businessName || 'Merchant')}&am=${totalAmount}&cu=INR`
        : '';

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Customer Details</Text>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Buyer Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter Name"
                    selectionColor="#007bff"
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
                    selectionColor="#007bff"
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
                onPress={handleCompleteSaleCheck}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.completeButtonText}>Complete Sale</Text>}
            </TouchableOpacity>

            {/* UPI QR Modal */}
            <Modal
                visible={showQR}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowQR(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Scan to Pay</Text>
                        <Text style={styles.modalAmount}>₹{totalAmount}</Text>

                        <View style={styles.qrContainer}>
                            {qrValue ? (
                                <QRCode
                                    value={qrValue}
                                    size={200}
                                    color="black"
                                    backgroundColor="white"
                                />
                            ) : (
                                <Text>Invalid UPI ID</Text>
                            )}
                        </View>
                        <Text style={styles.modalSubtitle}>Paying to: {businessInfo.businessName || businessInfo.upiId}</Text>

                        <TouchableOpacity style={styles.doneButton} onPress={finalizeSale}>
                            <Text style={styles.doneButtonText}>Done</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cancelButton} onPress={() => setShowQR(false)}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20 }, // Updated background
    header: { fontSize: 20, fontWeight: '800', marginBottom: 15, color: '#111827', marginTop: 10 },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, color: '#374151', marginBottom: 8, fontWeight: '600' },
    input: {
        backgroundColor: '#FFFFFF',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        fontSize: 16,
        color: '#111827'
    },

    paymentContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    paymentOption: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 1
    },
    activePayment: { backgroundColor: '#007bff', borderColor: '#007bff' },
    paymentText: { fontWeight: '700', color: '#6B7280' },
    activePaymentText: { color: '#FFFFFF' },

    summary: {
        alignItems: 'center',
        marginBottom: 30,
        padding: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10
    },
    summaryText: { fontSize: 16, color: '#6B7280', fontWeight: '500' },
    totalAmount: { fontSize: 36, fontWeight: '800', color: '#007bff', marginTop: 8 },

    completeButton: {
        backgroundColor: '#007bff', // Match theme
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#007bff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
    },
    completeButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },

    successContainer: { alignItems: 'center', justifyContent: 'center', flex: 1, },
    successText: { fontSize: 28, fontWeight: '800', color: '#111827', marginTop: 20, marginBottom: 40 },

    shareButton: {
        flexDirection: 'row',
        backgroundColor: '#25D366',
        padding: 16,
        borderRadius: 16,
        width: '90%',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        elevation: 3
    },
    shareButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 10 },

    homeButton: {
        padding: 16,
        backgroundColor: '#E3F2FD',
        borderRadius: 16,
        width: '70%',
        alignItems: 'center'
    },
    homeButtonText: { color: '#007bff', fontSize: 16, fontWeight: '700' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: {
        width: '85%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        elevation: 10
    },
    modalTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 10 },
    modalAmount: { fontSize: 36, fontWeight: '800', color: '#007bff', marginBottom: 20 },
    qrContainer: { padding: 12, backgroundColor: '#FFFFFF', borderRadius: 16, elevation: 2, marginBottom: 20 },
    modalSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 30, textAlign: 'center' },
    doneButton: {
        backgroundColor: '#007bff',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center',
        marginBottom: 10
    },
    doneButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    cancelButton: { padding: 15 },
    cancelButtonText: { color: '#6B7280', fontSize: 16, fontWeight: '600' }
});

export default SaleInfoScreen;
