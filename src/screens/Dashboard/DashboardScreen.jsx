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
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.headerContainer}>
                    <View>
                        <Text style={styles.header}>Dashboard</Text>
                        {settings?.businessDetails?.businessName && (
                            <Text style={styles.businessName}>{settings.businessDetails.businessName}</Text>
                        )}
                    </View>
                    <View style={styles.dateBadge}>
                        <Text style={styles.dateText}>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
                    </View>
                </View>

                {/* 1. TODAY'S OVERVIEW */}
                <Text style={styles.sectionTitle}>Today's Overview</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
                                <MaterialIcons name="attach-money" size={24} color="#1565C0" />
                            </View>
                            <Text style={styles.cardLabel}>Sales</Text>
                        </View>
                        <Text style={styles.cardValue}>₹{metrics.todayRevenue.toLocaleString()}</Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                                <MaterialIcons name="trending-up" size={24} color="#2E7D32" />
                            </View>
                            <Text style={styles.cardLabel}>Profit</Text>
                        </View>
                        <Text style={[styles.cardValue, { color: '#2E7D32' }]}>₹{metrics.todayProfit.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Pending Card Separate Row */}
                <View style={[styles.card, { marginTop: 8 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[styles.iconContainer, { backgroundColor: '#FFEBEE', width: 40, height: 40 }]}>
                                <MaterialIcons name="pending-actions" size={20} color="#C62828" />
                            </View>
                            <Text style={[styles.cardLabel, { marginLeft: 12, marginBottom: 0 }]}>Pending (Today)</Text>
                        </View>
                        <Text style={[styles.cardValue, { fontSize: 20, color: '#C62828' }]}>₹{metrics.todayPending.toLocaleString()}</Text>
                    </View>
                </View>

                {/* 2. PERFORMANCE */}
                <Text style={styles.sectionTitle}>Performance Insights</Text>
                <View style={styles.rowCard}>
                    <View style={styles.rowItem}>
                        <Text style={styles.rowLabel}>Weekly Sales</Text>
                        <Text style={styles.rowValue}>₹{metrics.weeklyRevenue.toLocaleString()}</Text>
                        <Text style={[styles.subValue, { color: '#2E7D32' }]}>
                            <MaterialIcons name="arrow-upward" size={12} /> Profit: ₹{metrics.weeklyProfit.toLocaleString()}
                        </Text>
                    </View>
                    <View style={styles.verticalDivider} />
                    <View style={styles.rowItem}>
                        <Text style={styles.rowLabel}>Monthly Sales</Text>
                        <Text style={styles.rowValue}>₹{metrics.monthlyRevenue.toLocaleString()}</Text>
                        <Text style={[styles.subValue, { color: '#2E7D32' }]}>
                            <MaterialIcons name="arrow-upward" size={12} /> Profit: ₹{metrics.monthlyProfit.toLocaleString()}
                        </Text>
                    </View>
                </View>

                {/* MONTHLY SALES CHART */}
                <Text style={styles.sectionTitle}>Monthly Sales Trend</Text>
                <View style={styles.chartCard}>
                    <LineChart
                        data={metrics.chartData}
                        width={Dimensions.get("window").width - 32} // Adjusted width
                        height={240}
                        yAxisLabel="₹"
                        yAxisSuffix=""
                        yAxisInterval={1}
                        chartConfig={{
                            backgroundColor: "#ffffff",
                            backgroundGradientFrom: "#ffffff",
                            backgroundGradientTo: "#ffffff",
                            fillShadowGradientFrom: "#1565C0",
                            fillShadowGradientTo: "#ffffff",
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(21, 101, 192, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                            style: {
                                borderRadius: 16
                            },
                            propsForDots: {
                                r: "5",
                                strokeWidth: "2",
                                stroke: "#1565C0"
                            }
                        }}
                        bezier
                        style={{
                            marginVertical: 8,
                            borderRadius: 16
                        }}
                        withInnerLines={false}
                        withOuterLines={false}
                    />
                </View>

                {/* BEST SELLERS */}
                <Text style={styles.sectionTitle}>Top Products</Text>
                <View style={styles.listSection}>
                    {metrics.bestSellers.length > 0 ? metrics.bestSellers.map((item, index) => (
                        <View key={index} style={[styles.listItem, index === metrics.bestSellers.length - 1 && styles.lastItem]}>
                            <View style={styles.rankBadge}>
                                <Text style={styles.rankText}>{index + 1}</Text>
                            </View>
                            <View style={{ flex: 1, paddingHorizontal: 12 }}>
                                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                                <Text style={styles.itemSubtext}>Top Performer</Text>
                            </View>
                            <Text style={styles.itemQty}>{item.qty} units</Text>
                        </View>
                    )) : (
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="inventory-2" size={48} color="#CCC" />
                            <Text style={styles.emptyText}>No sales recorded yet.</Text>
                        </View>
                    )}
                </View>

                {/* 3. INVENTORY SNAPSHOT */}
                <Text style={styles.sectionTitle}>Inventory Status</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryValue}>{metrics.totalItems}</Text>
                        <Text style={styles.summaryLabel}>Total Items</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryValue}>₹{metrics.totalStockValue.toLocaleString()}</Text>
                        <Text style={styles.summaryLabel}>Stock Value</Text>
                    </View>
                </View>

                {/* LOW STOCK WARNINGS */}
                {metrics.lowStockItems.length > 0 && (
                    <View style={styles.warningSection}>
                        <Text style={[styles.sectionTitle, { color: '#D32F2F', marginTop: 0 }]}>Low Stock Alerts ({metrics.lowStockItems.length})</Text>
                        <View style={styles.listSection}>
                            {metrics.lowStockItems.slice(0, 5).map((item, idx) => (
                                <View key={item.id} style={[styles.listItem, idx === 4 && styles.lastItem]}>
                                    <View style={[styles.rankBadge, { backgroundColor: '#FFEBEE' }]}>
                                        <MaterialIcons name="priority-high" size={16} color="#D32F2F" />
                                    </View>
                                    <View style={{ flex: 1, paddingHorizontal: 12 }}>
                                        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                                    </View>
                                    <View style={styles.countBadge}>
                                        <Text style={styles.countText}>{item.stock} left</Text>
                                    </View>
                                </View>
                            ))}
                            {metrics.lowStockItems.length > 5 && (
                                <View style={{ padding: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                                    <Text style={{ color: '#D32F2F', fontSize: 13, fontWeight: '600' }}>
                                        View {metrics.lowStockItems.length - 5} more alerts
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* 4. TOTALS (ALL TIME) */}
                <Text style={styles.sectionTitle}>Business Lifetime Totals</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: '#E1F5FE' }]}>
                                <MaterialIcons name="account-balance" size={24} color="#0277BD" />
                            </View>
                            <Text style={styles.cardLabel}>All Sales</Text>
                        </View>
                        <Text style={styles.cardValue}>₹{metrics.totalRevenue.toLocaleString()}</Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                                <MaterialIcons name="monetization-on" size={24} color="#2E7D32" />
                            </View>
                            <Text style={styles.cardLabel}>Net Profit</Text>
                        </View>
                        <Text style={[styles.cardValue, { color: '#2E7D32' }]}>₹{metrics.totalProfit.toLocaleString()}</Text>
                    </View>
                </View>

                <View style={[styles.card, { marginTop: 8 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[styles.iconContainer, { backgroundColor: '#FFEBEE', width: 40, height: 40 }]}>
                                <MaterialIcons name="assignment-late" size={20} color="#C62828" />
                            </View>
                            <Text style={[styles.cardLabel, { marginLeft: 12, marginBottom: 0 }]}>Total Outstanding (Due)</Text>
                        </View>
                        <Text style={[styles.cardValue, { fontSize: 20, color: '#C62828' }]}>₹{metrics.totalPending.toLocaleString()}</Text>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
        padding: 16,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA'
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 8
    },
    header: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: 0.5
    },
    businessName: {
        fontSize: 15,
        color: '#6B7280',
        fontWeight: '500',
        marginTop: 4
    },
    dateBadge: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20
    },
    dateText: {
        color: '#1565C0',
        fontWeight: '700',
        fontSize: 14
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 12,
        marginTop: 24,
        marginLeft: 4
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12
    },
    card: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    cardLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600'
    },
    cardValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827'
    },
    rowCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    rowItem: {
        flex: 1,
        alignItems: 'center'
    },
    verticalDivider: {
        width: 1,
        backgroundColor: '#E5E7EB',
        height: '80%',
        marginHorizontal: 10
    },
    rowLabel: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 6,
        fontWeight: '500'
    },
    rowValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827'
    },
    subValue: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
        flexDirection: 'row',
        alignItems: 'center'
    },
    chartCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 0, // remove padding to let chart fill
        paddingBottom: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        overflow: 'hidden'
    },
    listSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    lastItem: {
        borderBottomWidth: 0
    },
    rankBadge: {
        width: 24,
        height: 24,
        backgroundColor: '#EBF5FF',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    rankText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1565C0'
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151'
    },
    itemSubtext: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2
    },
    itemQty: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827'
    },
    emptyContainer: {
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center'
    },
    emptyText: {
        color: '#9CA3AF',
        marginTop: 10,
        fontSize: 14
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        alignItems: 'flex-start',
        borderLeftWidth: 4,
        borderLeftColor: '#7C3AED', // Purple
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2
    },
    summaryValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4
    },
    summaryLabel: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500'
    },
    warningSection: {
        marginTop: 24
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    },
    countBadge: {
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginLeft: 8
    },
    countText: {
        color: '#D32F2F',
        fontSize: 12,
        fontWeight: 'bold'
    },
    alertCard: {
        backgroundColor: '#FFFFFF',
        width: 140,
        padding: 12,
        borderRadius: 12,
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#FEE2E2'
    },
    alertIconBg: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#FFEBEE',
        justifyContent: 'center',
        alignItems: 'center'
    },
    alertItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 2
    },
    alertStockText: {
        fontSize: 12,
        color: '#D32F2F',
        fontWeight: '700'
    },
    warningTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#D32F2F',
        marginLeft: 8
    },
    warningBadge: {
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12
    },
    warningText: {
        color: '#D32F2F',
        fontWeight: '700',
        fontSize: 12
    },
    moreText: {
        textAlign: 'center',
        color: '#1565C0',
        padding: 12,
        fontSize: 13,
        fontWeight: '600'
    }
});

export default DashboardScreen;
