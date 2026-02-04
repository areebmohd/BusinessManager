
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const SaleDetailScreen = ({ route, navigation }) => {
    const { sale } = route.params;

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

                <View style={styles.row}>
                    <Text style={styles.label}>Date</Text>
                    <Text style={styles.value}>{dateStr}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.row}>
                    <Text style={styles.label}>Total Amount</Text>
                    <Text style={styles.totalValue}>₹{sale.totalAmount || sale.total}</Text>
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

            {/* Placeholder for future actions */}
            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionButton}>
                    <MaterialIcons name="print" size={24} color="#555" />
                    <Text style={styles.actionText}>Print Receipt</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <MaterialIcons name="share" size={24} color="#555" />
                    <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    // Header styles removed as we use standard navigation header
    scrollContent: { padding: 20 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    paidBadge: { backgroundColor: '#e8f5e9' },
    unpaidBadge: { backgroundColor: '#ffebee' },
    upiBadge: { backgroundColor: '#e3f2fd' },

    statusText: { fontSize: 12, fontWeight: 'bold' },
    paidText: { color: '#388e3c' },
    unpaidText: { color: '#d32f2f' },
    upiText: { color: '#1976d2' },

    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 5,
    },
    label: { fontSize: 16, color: '#666' },
    value: { fontSize: 16, fontWeight: '500', color: '#333' },
    totalValue: { fontSize: 24, fontWeight: 'bold', color: '#2e7d32' },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },

    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    itemQuantity: { fontSize: 14, color: '#777', marginTop: 2 },
    itemTotal: { fontSize: 16, fontWeight: 'bold', color: '#333' },

    actions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    actionButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: { marginTop: 5, color: '#555', fontSize: 12 },
});

export default SaleDetailScreen;
