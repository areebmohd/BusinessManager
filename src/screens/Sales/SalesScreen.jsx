import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { subscribeToSales } from '../../services/FirestoreService';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const SalesScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [sales, setSales] = useState([]);
    const [filteredSales, setFilteredSales] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState('All');

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
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(item => {
                const total = item.totalAmount || item.total;
                if (total && total.toString().includes(lowerQuery)) return true;
                if (item.items && Array.isArray(item.items)) {
                    return item.items.some(i => i.itemName.toLowerCase().includes(lowerQuery));
                } else {
                    return item.itemName && item.itemName.toLowerCase().includes(lowerQuery);
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

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('SaleDetail', { sale: item })}
            >
                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        {isGrouped ? (
                            // New Format: List items
                            <View>
                                {item.items.map((subItem, index) => (
                                    <Text key={index} style={styles.itemName}>
                                        {subItem.itemName} <Text style={styles.details}>(x{subItem.quantity})</Text>
                                    </Text>
                                ))}
                            </View>
                        ) : (
                            // Old Format: Single item
                            <Text style={styles.itemName}>{item.itemName}</Text>
                        )}
                    </View>
                    <Text style={styles.amount}>₹{total}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.details}>
                        {isGrouped ? `${item.items.length} Items` : `${item.quantity} x ₹{item.unitPrice}`}
                    </Text>
                    <Text style={[styles.paymentMethod,
                    item.paymentMethod === 'paid' ? styles.cash :
                        item.paymentMethod === 'unpaid' ? styles.unpaid : styles.upi
                    ]}>
                        {item.paymentMethod === 'paid' ? 'PAID' :
                            item.paymentMethod === 'unpaid' ? 'NOT PAID' :
                                item.paymentMethod ? item.paymentMethod.toUpperCase() : 'UNKNOWN'}
                    </Text>
                </View>
                <Text style={styles.date}>{dateStr}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.header}>Sales History</Text>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={24} color="#777" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by Item or Price..."
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <MaterialIcons name="close" size={20} color="#777" />
                    </TouchableOpacity>
                )}
            </View>

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
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20, paddingTop: 10 },
    header: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, color: '#333' },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        elevation: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: '#333',
        paddingVertical: 5,
    },
    // Filter Chips Styles
    filtersContainer: { marginBottom: 15 },
    filtersContent: { paddingRight: 10 },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#e0e0e0',
        marginRight: 10,
    },
    filterChipSelected: { backgroundColor: '#007bff' },
    filterChipText: { fontSize: 14, color: '#333', fontWeight: '500' },
    filterChipTextSelected: { color: '#fff' },
    center: { alignItems: 'center', marginTop: 50 },
    card: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        elevation: 2
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    itemName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    amount: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32' },
    details: { fontSize: 14, color: '#666' },
    paymentMethod: { fontSize: 12, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, overflow: "hidden" },
    upi: { backgroundColor: '#e3f2fd', color: '#1976d2' },
    cash: { backgroundColor: '#e8f5e9', color: '#388e3c' },
    unpaid: { backgroundColor: '#ffebee', color: '#d32f2f' },
    date: { fontSize: 12, color: '#999', marginTop: 5, textAlign: 'right' },
    emptyText: { color: '#888', fontSize: 16 },
    fab: {
        position: 'absolute', bottom: 20, right: 20,
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: '#007bff',
        justifyContent: 'center', alignItems: 'center',
        elevation: 5
    }
});

export default SalesScreen;
