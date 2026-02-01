import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { subscribeToItems, subscribeToSales, subscribeToSettings } from '../../services/FirestoreService';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const DashboardScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [sales, setSales] = useState([]);
    const [settings, setSettings] = useState({});

    useEffect(() => {
        if (!user) return;

        // Subscribe to all necessary data
        const unsubItems = subscribeToItems(user.uid, (data) => setItems(data));
        const unsubSales = subscribeToSales(user.uid, (data) => setSales(data));
        const unsubSettings = subscribeToSettings(user.uid, (data) => setSettings(data));

        return () => {
            unsubItems();
            unsubSales();
            unsubSettings();
        };
    }, [user]);

    useEffect(() => {
        if (items.length >= 0 && sales.length >= 0) {
            setLoading(false);
        }
    }, [items, sales]);

    // Analytics Calculations
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalSalesCount = sales.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
    const lowStockLimit = settings.lowStockLimit || 5;
    const lowStockItems = items.filter(item => item.stock < lowStockLimit);
    const inventoryValue = items.reduce((sum, item) => sum + (item.stock * item.sellingPrice), 0);

    // Recent Sales (Top 5)
    const recentSales = sales.slice(0, 5);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Business Dashboard</Text>

            {/* Summary Cards */}
            <View style={styles.statsGrid}>
                <View style={[styles.card, { backgroundColor: '#e3f2fd' }]}>
                    <Text style={styles.cardLabel}>Total Revenue</Text>
                    <Text style={[styles.cardValue, { color: '#0d47a1' }]}>₹{totalRevenue}</Text>
                </View>
                <View style={[styles.card, { backgroundColor: '#e8f5e9' }]}>
                    <Text style={styles.cardLabel}>Inventory Value</Text>
                    <Text style={[styles.cardValue, { color: '#1b5e20' }]}>₹{inventoryValue}</Text>
                </View>
                <View style={[styles.card, { backgroundColor: '#fff3e0' }]}>
                    <Text style={styles.cardLabel}>Total Sales</Text>
                    <Text style={[styles.cardValue, { color: '#e65100' }]}>{totalSalesCount}</Text>
                </View>
                <View style={[styles.card, { backgroundColor: '#ffebee' }]}>
                    <Text style={styles.cardLabel}>Low Stock Items</Text>
                    <Text style={[styles.cardValue, { color: '#b71c1c' }]}>{lowStockItems.length}</Text>
                </View>
            </View>

            {/* Low Stock Warning */}
            {lowStockItems.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="warning" size={24} color="#d32f2f" />
                        <Text style={styles.sectionTitle}>Low Stock Alerts</Text>
                    </View>
                    {lowStockItems.map(item => (
                        <View key={item.id} style={styles.listItem}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.stockWarn}>Only {item.stock} left</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Recent Sales */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Sales</Text>
                {recentSales.map(sale => (
                    <View key={sale.id} style={styles.listItem}>
                        <View>
                            <Text style={styles.itemName}>{sale.itemName}</Text>
                            <Text style={styles.saleDate}>
                                {sale.timestamp?.toDate ? sale.timestamp.toDate().toLocaleDateString() : 'Just now'}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.saleAmount}>₹{sale.total}</Text>
                            <Text style={[styles.status,
                            sale.paymentMethod === 'paid' ? styles.statusPaid :
                                sale.paymentMethod === 'unpaid' ? styles.statusUnpaid : null
                            ]}>
                                {sale.paymentMethod === 'paid' ? 'PAID' : 'UNPAID'}
                            </Text>
                        </View>
                    </View>
                ))}
                {recentSales.length === 0 && (
                    <Text style={{ color: '#aaa', fontStyle: 'italic' }}>No sales yet.</Text>
                )}
            </View>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, color: '#333' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
    card: { width: '48%', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 3 },
    cardLabel: { fontSize: 14, color: '#555', marginBottom: 5 },
    cardValue: { fontSize: 22, fontWeight: 'bold' },
    section: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 20, elevation: 2 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginLeft: 5 },
    listItem: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 10 },
    itemName: { fontSize: 16, fontWeight: '600' },
    stockWarn: { color: '#d32f2f', fontWeight: 'bold' },
    saleAmount: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32' },
    saleDate: { fontSize: 12, color: '#888' },
    status: { fontSize: 10, fontWeight: 'bold', marginTop: 2 },
    statusPaid: { color: '#388e3c' },
    statusUnpaid: { color: '#d32f2f' },
});

export default DashboardScreen;
