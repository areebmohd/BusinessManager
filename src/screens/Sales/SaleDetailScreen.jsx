
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { generateBillText } from '../../utils/BillUtils';
import { shareBillToWhatsApp } from '../../utils/WhatsAppUtils';
import { useAuth } from '../../context/AuthContext';
import { subscribeToSettings, updateSaleStatus } from '../../services/FirestoreService';

const SaleDetailScreen = ({ route, navigation }) => {
    const { sale } = route.params;
    const { user } = useAuth();
    const [businessInfo, setBusinessInfo] = useState({});
    const [billText, setBillText] = useState('');

    useEffect(() => {
        const unsubscribe = subscribeToSettings(user.uid, (settings) => {
            const info = settings || {};
            setBusinessInfo(info);
            // Generate bill text once info is available
            setBillText(generateBillText(sale, info));
        });
        return unsubscribe;
    }, []);

    const handleShareBill = () => {
        shareBillToWhatsApp(billText, sale.buyerNumber);
    };

    const handleUpdateStatus = async () => {
        try {
            await updateSaleStatus(user.uid, sale.id, 'paid');
            Alert.alert("Success", "Payment status updated to paid!");
            navigation.goBack(); // Easy way to refresh list and state is to go back, or we could update local state
        } catch (error) {
            Alert.alert("Error", "Failed to update payment status.");
        }
    };

    const handleCopyBill = () => {
        Clipboard.setString(billText);
        Alert.alert("Copied", "Bill text copied to clipboard!");
    };

    const dateStr = sale.timestamp?.toDate ? sale.timestamp.toDate().toLocaleString() : 'Just now';
    const isGrouped = sale.items && Array.isArray(sale.items);

    // Helper to safely get payment method string
    let paymentMethodStr = sale.paymentMethod;
    if (typeof paymentMethodStr === 'object' && paymentMethodStr !== null) {
        // Handle case where it might be saved as an object wrapping the string
        paymentMethodStr = paymentMethodStr.paymentMethod || 'unknown';
    }
    if (typeof paymentMethodStr !== 'string') {
        paymentMethodStr = 'unknown';
    }
    // Normalize case for comparison
    const lowerMethod = paymentMethodStr.toLowerCase();

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            {/* Header handled by Navigation */}
            <View style={styles.card}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Summary</Text>
                    <View style={[styles.statusBadge,
                    lowerMethod === 'paid' ? styles.paidBadge :
                        lowerMethod === 'unpaid' ? styles.unpaidBadge : styles.upiBadge
                    ]}>
                        <Text style={[styles.statusText,
                        lowerMethod === 'paid' ? styles.paidText :
                            lowerMethod === 'unpaid' ? styles.unpaidText : styles.upiText
                        ]}>
                            {paymentMethodStr.toUpperCase()}
                        </Text>
                    </View>
                </View>

                {/* Mark as Paid Action */}
                {lowerMethod === 'unpaid' && (
                    <TouchableOpacity style={styles.markPaidButton} onPress={handleUpdateStatus}>
                        <MaterialIcons name="check-circle" size={20} color="#fff" />
                        <Text style={styles.markPaidText}>Mark as Paid</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.row}>
                    <Text style={styles.label}>Date</Text>
                    <Text style={styles.value}>{dateStr}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.row}>
                    <Text style={styles.label}>Total Amount</Text>
                    <Text style={styles.totalValue}>₹{sale.totalAmount || sale.total}</Text>
                </View>

                {/* Buyer Details */}
                <View style={styles.divider} />
                <View style={styles.row}>
                    <Text style={styles.label}>Buyer Name</Text>
                    <Text style={styles.value}>{sale.buyerName || 'N/A'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Buyer Mobile</Text>
                    <Text style={styles.value}>{sale.buyerNumber || 'N/A'}</Text>
                </View>

            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Items</Text>
                <View style={styles.divider} />

                {isGrouped ? (
                    sale.items.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>{item.itemName}</Text>
                                <Text style={styles.itemQuantity}>{item.quantity} x ₹{item.unitPrice}</Text>
                            </View>
                            <Text style={styles.itemTotal}>₹{item.total}</Text>
                        </View>
                    ))
                ) : (
                    <View style={styles.itemRow}>
                        <View style={styles.itemInfo}>
                            <Text style={styles.itemName}>{sale.itemName}</Text>
                            <Text style={styles.itemQuantity}>{sale.quantity} x ₹{sale.unitPrice}</Text>
                        </View>
                        <Text style={styles.itemTotal}>₹{sale.total}</Text>
                    </View>
                )}
            </View>

            {/* Bill Preview Section */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Bill Preview</Text>
                <View style={styles.divider} />
                <View style={styles.previewContainer}>
                    <Text style={styles.previewText} selectable={true}>{billText}</Text>
                </View>
                <TouchableOpacity style={styles.copyButton} onPress={handleCopyBill}>
                    <MaterialIcons name="content-copy" size={20} color="#007bff" />
                    <Text style={styles.copyButtonText}>Copy Bill Text</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionButton}>
                    <MaterialIcons name="print" size={24} color="#555" />
                    <Text style={styles.actionText}>Print Receipt</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleShareBill}>
                    <MaterialIcons name="share" size={24} color="#555" />
                    <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' }, // Updated background
    scrollContent: { padding: 20 },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    paidBadge: { backgroundColor: '#E8F5E9' },
    unpaidBadge: { backgroundColor: '#FFEBEE' },
    upiBadge: { backgroundColor: '#E3F2FD' },

    statusText: { fontSize: 12, fontWeight: '700' },
    paidText: { color: '#2E7D32' },
    unpaidText: { color: '#D32F2F' },
    upiText: { color: '#007bff' },

    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 6,
    },
    label: { fontSize: 15, color: '#6B7280', fontWeight: '500' },
    value: { fontSize: 16, fontWeight: '600', color: '#111827' },
    totalValue: { fontSize: 24, fontWeight: '800', color: '#007bff' },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },

    markPaidButton: {
        flexDirection: 'row',
        backgroundColor: '#28a745',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 15,
        shadowColor: '#28a745',
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3
    },
    markPaidText: {
        color: '#fff',
        fontWeight: '700',
        marginLeft: 8,
        fontSize: 15
    },

    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 16, fontWeight: '700', color: '#111827' },
    itemQuantity: { fontSize: 14, color: '#6B7280', marginTop: 2 },
    itemTotal: { fontSize: 16, fontWeight: '700', color: '#111827' },

    previewContainer: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 12,
    },
    previewText: {
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#374151',
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#007bff',
        borderRadius: 12,
        backgroundColor: '#F0F9FF',
    },
    copyButtonText: {
        color: '#007bff',
        marginLeft: 8,
        fontWeight: '700',
    },

    actions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
        marginBottom: 30
    },
    actionButton: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
    actionText: { marginTop: 6, color: '#6B7280', fontSize: 13, fontWeight: '500' },
});

export default SaleDetailScreen;
