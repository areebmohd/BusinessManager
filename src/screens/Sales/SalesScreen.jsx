import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { subscribeToSales } from '../../services/FirestoreService';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import BarcodeScannerModal from '../../components/BarcodeScannerModal';

const SalesScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [sales, setSales] = useState([]);
    const [filteredSales, setFilteredSales] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState('All');
    const [scannerVisible, setScannerVisible] = useState(false);

    const filters = ['All', 'Cash', 'UPI', 'Pending', 'Daily', 'Weekly', 'Monthly'];

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToSales(user.uid,
            (data) => {
                setSales(data);
                setFilteredSales(data);
                setLoading(false);
            },
            (error) => {
                console.error("Sales fetch error", error);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        let result = sales;

        // 1. Filter by Search Query
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase().trim();
            result = result.filter(item => {
                const total = item.totalAmount || item.total;
                if (total && total.toString().includes(lowerQuery)) return true;
                if (item.items && Array.isArray(item.items)) {
                    return item.items.some(i =>
                        i.itemName.toLowerCase().includes(lowerQuery) ||
                        (i.barcode && i.barcode.toLowerCase().includes(lowerQuery))
                    );
                } else {
                    return (item.itemName && item.itemName.toLowerCase().includes(lowerQuery)) ||
                        (item.barcode && item.barcode.toLowerCase().includes(lowerQuery));
                }
            });
        }

        // 2. Filter by Chip Selection
        if (selectedFilter !== 'All') {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            result = result.filter(item => {
                // Payment Status Filtering
                if (selectedFilter === 'Cash') return item.paymentMethod === 'paid';
                if (selectedFilter === 'UPI') return item.paymentMethod === 'upi';
                if (selectedFilter === 'Pending') return item.paymentMethod === 'unpaid';

                // Date Filtering
                if (!item.timestamp?.toDate) return false;
                const saleDate = item.timestamp.toDate();

                if (selectedFilter === 'Daily') {
                    return saleDate >= todayStart;
                }
                if (selectedFilter === 'Weekly') {
                    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return saleDate >= oneWeekAgo;
                }
                if (selectedFilter === 'Monthly') {
                    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    return saleDate >= oneMonthAgo;
                }
                return true;
            });
        }

        setFilteredSales(result);
    }, [searchQuery, sales, selectedFilter]);

    const renderItem = ({ item }) => {
        const isGrouped = item.items && Array.isArray(item.items);
        const total = isGrouped ? item.totalAmount : item.total;

        // Format date
        const dateStr = item.timestamp?.toDate ? item.timestamp.toDate().toLocaleString() : 'Just now';

        // Payment Label Logic
        let paymentLabel = 'UNKNOWN';
        let paymentStyle = styles.paidBadge; // Default
        let paymentTextStyle = styles.paidText;

        const method = item.paymentMethod;
        const normalizedMethod = (typeof method === 'string' ? method : method?.paymentMethod || '').toLowerCase();

        if (normalizedMethod === 'paid') {
            paymentLabel = 'CASH';
            paymentStyle = styles.cash;
            paymentTextStyle = styles.cashText;
        } else if (normalizedMethod === 'upi') {
            paymentLabel = 'UPI';
            paymentStyle = styles.upi;
            paymentTextStyle = styles.upiText;
        } else if (normalizedMethod === 'unpaid') {
            paymentLabel = 'NOT PAID';
            paymentStyle = styles.unpaid;
            paymentTextStyle = styles.unpaidText;
        } else {
            paymentLabel = normalizedMethod.toUpperCase();
        }

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('SaleDetail', { sale: item })}
            >
                <View style={styles.cardContent}>
                    {/* Left Column: Items & Details */}
                    <View style={styles.leftCol}>
                        {isGrouped ? (
                            <View>
                                {item.items.map((subItem, index) => (
                                    <Text key={index} style={styles.itemName}>
                                        {subItem.itemName} <Text style={styles.itemQty}>(x{subItem.quantity})</Text>
                                    </Text>
                                ))}
                            </View>
                        ) : (
                            <Text style={styles.itemName}>{item.itemName}</Text>
                        )}
                        <Text style={styles.detailsText}>
                            {isGrouped ? `${item.items.length} Items` : `${item.quantity} x ₹{item.unitPrice}`}
                        </Text>
                    </View>

                    {/* Right Column: Price, Payment, Date */}
                    <View style={styles.rightCol}>
                        <Text style={styles.amount}>₹{total}</Text>

                        <View style={[styles.paymentBadge, paymentStyle]}>
                            <Text style={[styles.paymentText, paymentTextStyle]}>{paymentLabel}</Text>
                        </View>

                        <Text style={styles.date}>{dateStr}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.header}>Sales History</Text>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={24} color="#007bff" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by Item or Price..."
                    placeholderTextColor="#6B7280"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <MaterialIcons name="close" size={20} color="#6B7280" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setScannerVisible(true)} style={{ marginLeft: 10 }}>
                    <MaterialIcons name="qr-code-scanner" size={24} color="#007bff" />
                </TouchableOpacity>
            </View>

            <BarcodeScannerModal
                visible={scannerVisible}
                onClose={() => setScannerVisible(false)}
                onScan={(code) => setSearchQuery(code)}
            />

            {/* Filter Chips */}
            <View style={styles.filtersContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersContent}
                >
                    {filters.map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            style={[
                                styles.filterChip,
                                selectedFilter === filter && styles.filterChipSelected
                            ]}
                            onPress={() => setSelectedFilter(filter)}
                        >
                            <Text style={[
                                styles.filterChipText,
                                selectedFilter === filter && styles.filterChipTextSelected
                            ]}>
                                {filter}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={filteredSales}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 1, paddingBottom: 80 }}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>
                                {searchQuery || selectedFilter !== 'All' ? "No sales match your filters." : "No sales recorded yet."}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* FAB to Add Sale */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('CreateSale')}
            >
                <MaterialIcons name="add" size={30} color="#fff" />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' }, // Updated background
    header: { fontSize: 28, fontWeight: '800', marginBottom: 20, color: '#111827', paddingHorizontal: 20, paddingTop: 10, letterSpacing: 0.5 }, // Updated header
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 0, // Flat search bar
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#111827',
        paddingVertical: 0,
    },
    // Filter Chips Styles
    filtersContainer: { marginBottom: 15 },
    filtersContent: { paddingHorizontal: 20, paddingRight: 10 },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    filterChipSelected: { backgroundColor: '#007bff', borderColor: '#007bff' },
    filterChipText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
    filterChipTextSelected: { color: '#FFFFFF' },
    center: { alignItems: 'center', marginTop: 50 },
    card: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        marginHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    leftCol: {
        flex: 1,
        justifyContent: 'center',
        paddingRight: 10,
    },
    rightCol: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        minWidth: 80,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    itemQty: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6B7280',
    },
    detailsText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
        marginTop: 4,
    },
    amount: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 6,
    },
    paymentBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    paymentText: {
        fontSize: 11,
        fontWeight: '700',
    },
    // Colors for badges
    cash: { backgroundColor: '#E8F5E9' },
    cashText: { color: '#2E7D32' },
    upi: { backgroundColor: '#E3F2FD' },
    upiText: { color: '#007bff' },
    unpaid: { backgroundColor: '#FFEBEE' },
    unpaidText: { color: '#D32F2F' },

    date: {
        fontSize: 11,
        color: '#9CA3AF',
        textAlign: 'right',
        fontWeight: '500'
    },

    // FAB
    fab: {
        position: 'absolute', bottom: 24, right: 24,
        width: 56, height: 56, borderRadius: 16,
        backgroundColor: '#007bff',
        justifyContent: 'center', alignItems: 'center',
        elevation: 4,
        shadowColor: '#007bff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    }
});

export default SalesScreen;
