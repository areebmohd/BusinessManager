import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { subscribeToItems, subscribeToSales, subscribeToSettings } from '../../services/FirestoreService';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { LineChart } from 'react-native-chart-kit';

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

    // Helpers
    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const isThisWeek = (date) => {
        const today = new Date();
        const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= oneWeekAgo;
    };

    const isThisMonth = (date) => {
        const today = new Date();
        return date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    // Analytics Calculations
    const metrics = useMemo(() => {
        if (loading) return null;

        let totalRevenue = 0;
        let totalProfit = 0;
        let totalPending = 0;

        let todayRevenue = 0;
        let todayProfit = 0;
        let todayPending = 0;

        let weeklyRevenue = 0;
        let weeklyProfit = 0;

        let monthlyRevenue = 0;
        let monthlyProfit = 0;

        // Helper to safely parse numbers
        const parse = (val) => parseFloat(val) || 0;

        // Item Map for fast lookup of Cost Price
        const itemMap = {};
        items.forEach(item => {
            itemMap[item.id] = item;
        });

        sales.forEach(sale => {
            if (!sale.timestamp?.toDate) return;
            const date = sale.timestamp.toDate();

            // Determine Sale Total safely
            let saleTotal = parse(sale.total);

            // Fallback: If total is 0 or missing, try to sum up items (Legacy support)
            // This prevents "0 - Cost = Negative Profit" if the total wasn't saved correctly.
            if (!saleTotal) {
                if (sale.items && Array.isArray(sale.items)) {
                    saleTotal = sale.items.reduce((sum, item) => sum + (parse(item.unitPrice) * parse(item.quantity)), 0);
                } else if (sale.unitPrice && sale.quantity) {
                    saleTotal = parse(sale.unitPrice) * parse(sale.quantity);
                }
            }

            const isUnpaid = sale.paymentMethod === 'unpaid';

            // Global Totals
            totalRevenue += saleTotal;
            if (isUnpaid) totalPending += saleTotal;

            // Profit Calculation
            // Profit = Final Sale Total - Total Cost of Goods Sold (COGS)
            let saleCost = 0;
            if (sale.items && Array.isArray(sale.items)) {
                sale.items.forEach(subItem => {
                    const currentItem = itemMap[subItem.itemId];
                    const cost = parse(currentItem?.costPrice);
                    saleCost += cost * parse(subItem.quantity);
                });
            } else {
                const currentItem = itemMap[sale.itemId];
                if (currentItem) {
                    const cost = parse(currentItem.costPrice);
                    saleCost += cost * parse(sale.quantity);
                }
            }

            // Exclude Unpaid from Profit
            // We only calculate profit for Realized Sales.
            const saleProfit = isUnpaid ? 0 : (saleTotal - saleCost);

            totalProfit += saleProfit;

            // Time specific metrics
            if (isToday(date)) {
                todayRevenue += saleTotal;
                todayProfit += saleProfit;
                if (isUnpaid) todayPending += saleTotal;
            }

            if (isThisWeek(date)) {
                weeklyRevenue += saleTotal;
                weeklyProfit += saleProfit;
            }

            if (isThisMonth(date)) {
                monthlyRevenue += saleTotal;
                monthlyProfit += saleProfit;
            }
        });

        // Monthly Chart Data Calculation
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const dailySales = new Array(daysInMonth).fill(0);

        sales.forEach(sale => {
            if (!sale.timestamp?.toDate) return;
            const date = sale.timestamp.toDate();
            if (isThisMonth(date)) {
                const day = date.getDate();
                // daily arrays are 0-indexed, so day 1 is index 0
                const saleTotal = parse(sale.total);
                // Fallback for missing total
                const finalTotal = saleTotal || (
                    (sale.items && Array.isArray(sale.items))
                        ? sale.items.reduce((sum, item) => sum + (parse(item.unitPrice) * parse(item.quantity)), 0)
                        : (parse(sale.unitPrice) * parse(sale.quantity))
                );

                if (finalTotal > 0) {
                    dailySales[day - 1] += finalTotal;
                }
            }
        });

        // Generate Labels (1, 5, 10, 15, 20, 25, 30...)
        const displayLabels = Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            return (day === 1 || day % 5 === 0) ? String(day) : '';
        });

        const chartData = {
            labels: displayLabels,
            datasets: [
                {
                    data: dailySales,
                    color: (opacity = 1) => `rgba(21, 101, 192, ${opacity})`, // optional
                    strokeWidth: 2 // optional
                }
            ],
            // legend: ["Daily Sales"] // optional
        };

        // Inventory Stats
        const totalItems = items.length;
        const totalStockValue = items.reduce((sum, item) => sum + (parse(item.costPrice) * parse(item.stock)), 0);

        // Low Stock (10% Rule)
        const lowStockItems = items.filter(item => {
            const initial = parse(item.initialStock);
            const stock = parse(item.stock);
            const threshold = Math.max(initial * 0.1, 0);
            return stock < threshold && stock > 0;
        });

        // Best Sellers
        const productSales = {};
        sales.forEach(sale => {
            if (sale.items && Array.isArray(sale.items)) {
                sale.items.forEach(sub => {
                    productSales[sub.itemName] = (productSales[sub.itemName] || 0) + sub.quantity;
                });
            } else {
                if (sale.itemName) {
                    productSales[sale.itemName] = (productSales[sale.itemName] || 0) + sale.quantity;
                }
            }
        });

        const sortedBestSellers = Object.entries(productSales)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, qty]) => ({ name, qty }));

        return {
            todayRevenue,
            todayProfit,
            todayPending,

            weeklyRevenue,
            weeklyProfit,

            monthlyRevenue,
            monthlyProfit,

            totalItems,
            totalStockValue,
            lowStockItems,

            totalRevenue, // All time
            totalProfit,  // All time
            totalPending, // All time

            bestSellers: sortedBestSellers,
            chartData
        };

    }, [sales, items, loading]);

    if (loading || !metrics) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
            <ScrollView style={styles.container}>
                <View style={styles.headerContainer}>
                    <Text style={styles.header}>Dashboard</Text>
                    {settings?.businessDetails?.businessName ? (
                        <Text style={styles.businessName}>{settings.businessDetails.businessName}</Text>
                    ) : null}
                </View>

                {/* 1. TODAY'S OVERVIEW */}
                <Text style={styles.sectionTitle}>Today's Overview</Text>
                <View style={styles.statsGrid}>
                    <View style={[styles.card, { backgroundColor: '#e3f2fd' }]}>
                        <Text style={styles.cardLabel}>Sales</Text>
                        <Text style={[styles.cardValue, { color: '#1565c0' }]}>₹{metrics.todayRevenue}</Text>
                    </View>
                    <View style={[styles.card, { backgroundColor: '#e8f5e9' }]}>
                        <Text style={styles.cardLabel}>Profit</Text>
                        <Text style={[styles.cardValue, { color: '#2e7d32' }]}>₹{metrics.todayProfit.toFixed(0)}</Text>
                    </View>
                    <View style={[styles.card, { backgroundColor: '#ffebee' }]}>
                        <Text style={styles.cardLabel}>Pending</Text>
                        <Text style={[styles.cardValue, { color: '#c62828' }]}>₹{metrics.todayPending}</Text>
                    </View>
                </View>

                {/* 2. PERFORMANCE */}
                <Text style={styles.sectionTitle}>Performance</Text>
                <View style={styles.rowCard}>
                    <View style={styles.rowItem}>
                        <Text style={styles.rowLabel}>Weekly Sales</Text>
                        <Text style={styles.rowValue}>₹{metrics.weeklyRevenue}</Text>
                        <Text style={[styles.subValue, { color: '#2e7d32' }]}>P: ₹{metrics.weeklyProfit.toFixed(0)}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.rowItem}>
                        <Text style={styles.rowLabel}>Monthly Sales</Text>
                        <Text style={styles.rowValue}>₹{metrics.monthlyRevenue}</Text>
                        <Text style={[styles.subValue, { color: '#2e7d32' }]}>P: ₹{metrics.monthlyProfit.toFixed(0)}</Text>
                    </View>
                </View>

                {/* MONTHLY SALES CHART */}
                <Text style={styles.sectionTitle}>Monthly Sales Trend</Text>
                <View style={[styles.card, { backgroundColor: '#fff', padding: 0, overflow: 'hidden', alignItems: 'center' }]}>
                    <LineChart
                        data={metrics.chartData}
                        width={Dimensions.get("window").width - 40} // from react-native
                        height={220}
                        yAxisLabel="₹"
                        yAxisSuffix=""
                        yAxisInterval={1} // optional, defaults to 1
                        chartConfig={{
                            backgroundColor: "#ffffff",
                            backgroundGradientFrom: "#ffffff",
                            backgroundGradientTo: "#ffffff",
                            decimalPlaces: 0, // optional, defaults to 2dp
                            color: (opacity = 1) => `rgba(21, 101, 192, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                            style: {
                                borderRadius: 16
                            },
                            propsForDots: {
                                r: "4",
                                strokeWidth: "2",
                                stroke: "#1565c0"
                            }
                        }}
                        bezier
                        style={{
                            marginVertical: 8,
                            borderRadius: 16
                        }}
                    />
                </View>

                {/* BEST SELLERS */}
                <Text style={styles.sectionTitle}>Best Selling Products</Text>
                <View style={styles.listSection}>
                    {metrics.bestSellers.length > 0 ? metrics.bestSellers.map((item, index) => (
                        <View key={index} style={styles.listItem}>
                            <Text style={styles.rank}>#{index + 1}</Text>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemQty}>{item.qty} sold</Text>
                        </View>
                    )) : (
                        <Text style={styles.emptyText}>No sales data yet.</Text>
                    )}
                </View>

                {/* 3. INVENTORY SNAPSHOT */}
                <Text style={styles.sectionTitle}>Inventory Snapshot</Text>
                <View style={styles.statsGrid}>
                    <View style={[styles.card, { backgroundColor: '#f3e5f5' }]}>
                        <Text style={styles.cardLabel}>Total Items</Text>
                        <Text style={[styles.cardValue, { color: '#7b1fa2' }]}>{metrics.totalItems}</Text>
                    </View>
                    <View style={[styles.card, { backgroundColor: '#e0f7fa' }]}>
                        <Text style={styles.cardLabel}>Stock Value</Text>
                        <Text style={[styles.cardValue, { color: '#006064' }]}>₹{metrics.totalStockValue}</Text>
                    </View>
                    <View style={[styles.card, { backgroundColor: '#ffebee' }]}>
                        <Text style={styles.cardLabel}>Low Stock</Text>
                        <Text style={[styles.cardValue, { color: '#c62828' }]}>{metrics.lowStockItems.length}</Text>
                    </View>
                </View>

                {/* 4. SALES SNAPSHOT (ALL TIME) */}
                <Text style={styles.sectionTitle}>Sales Snapshot</Text>
                <View style={[styles.statsGrid, { marginBottom: 5 }]}>
                    <View style={[styles.card, { backgroundColor: '#e1f5fe' }]}>
                        <Text style={styles.cardLabel}>Total Sales</Text>
                        <Text style={[styles.cardValue, { color: '#0277bd' }]}>₹{metrics.totalRevenue}</Text>
                    </View>
                    <View style={[styles.card, { backgroundColor: '#f1f8e9' }]}>
                        <Text style={styles.cardLabel}>Total Profit</Text>
                        <Text style={[styles.cardValue, { color: '#558b2f' }]}>₹{metrics.totalProfit.toFixed(0)}</Text>
                    </View>
                </View>
                <View style={[styles.card, { backgroundColor: '#ffebee', width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 }]}>
                    <Text style={[styles.cardLabel, { textAlign: 'left', marginBottom: 0 }]}>Total Pending Amount (Due)</Text>
                    <Text style={[styles.cardValue, { color: '#c62828' }]}>₹{metrics.totalPending}</Text>
                </View>

                {/* LOW STOCK WARNINGS */}
                {metrics.lowStockItems.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="warning" size={20} color="#d32f2f" />
                            <Text style={[styles.sectionTitle, { color: '#d32f2f', marginLeft: 5, marginBottom: 0 }]}>Low Stock Alerts</Text>
                        </View>
                        <View style={styles.listSection}>
                            {metrics.lowStockItems.slice(0, 5).map(item => (
                                <View key={item.id} style={styles.listItem}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.stockWarn}>Only {item.stock} left</Text>
                                </View>
                            ))}
                            {metrics.lowStockItems.length > 5 && (
                                <Text style={styles.moreText}>+ {metrics.lowStockItems.length - 5} more items</Text>
                            )}
                        </View>
                    </>
                )}

                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20, paddingTop: 10 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerContainer: { marginBottom: 20 },
    header: { fontSize: 28, fontWeight: 'bold', color: '#333' },
    businessName: { fontSize: 16, color: '#666', marginTop: 2 },

    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#444', marginBottom: 10, marginTop: 10 },

    statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    card: { flex: 1, padding: 12, borderRadius: 12, marginHorizontal: 4, elevation: 2, alignItems: 'center', justifyContent: 'center' },
    cardLabel: { fontSize: 12, color: '#555', textAlign: 'center', marginBottom: 4 },
    cardValue: { fontSize: 18, fontWeight: 'bold' },

    rowCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 15, elevation: 2, marginBottom: 10, justifyContent: 'space-between' },
    rowItem: { flex: 1, alignItems: 'center' },
    divider: { width: 1, backgroundColor: '#eee', height: '100%' },
    rowLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
    rowValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    subValue: { fontSize: 12, fontWeight: '600', marginTop: 2 },

    listSection: { backgroundColor: '#fff', borderRadius: 12, padding: 10, elevation: 2 },
    listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    rank: { width: 30, fontWeight: 'bold', color: '#888' },
    itemName: { flex: 1, fontSize: 15, color: '#333' },
    itemQty: { fontSize: 14, fontWeight: 'bold', color: '#007bff' },
    stockWarn: { fontSize: 14, fontWeight: 'bold', color: '#d32f2f' },
    emptyText: { color: '#999', fontStyle: 'italic', textAlign: 'center', padding: 10 },
    moreText: { textAlign: 'center', color: '#007bff', padding: 10, fontSize: 12 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 15, marginBottom: 10 }
});

export default DashboardScreen;
