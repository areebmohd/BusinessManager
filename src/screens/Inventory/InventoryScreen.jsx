import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { subscribeToItems } from '../../services/FirestoreService';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import BarcodeScannerModal from '../../components/BarcodeScannerModal';

const InventoryScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [scannerVisible, setScannerVisible] = useState(false);

    // Extract unique categories from items
    const categories = useMemo(() => {
        const uniqueCategories = [...new Set(items.map(item => item.category || 'Uncategorized'))];
        return ['All', ...uniqueCategories.sort()];
    }, [items]);

    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToItems(
            user.uid,
            (fetchedItems) => {
                setItems(fetchedItems);
                setFilteredItems(fetchedItems);
                setLoading(false);
            },
            (error) => {
                console.error("Fetch items failed", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        let result = items;

        // Filter by Category
        if (selectedCategory !== 'All') {
            result = result.filter(item =>
                (item.category || 'Uncategorized') === selectedCategory
            );
        }

        // Filter by Search Query
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(item =>
                item.name.toLowerCase().includes(lowerQuery) ||
                (item.category && item.category.toLowerCase().includes(lowerQuery)) ||
                (item.barcode && item.barcode.toLowerCase().includes(lowerQuery))
            );
        }

        setFilteredItems(result);
    }, [searchQuery, items, selectedCategory]);

    const renderItem = React.useCallback(({ item }) => {
        const initialStock = item.initialStock || 0;
        const lowStockThreshold = Math.max(initialStock * 0.1, 0); // 10%
        const isLowStock = item.stock < lowStockThreshold && item.stock > 0;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('ItemDetail', { item })}
            >
                <View style={styles.cardContent}>
                    <View style={styles.iconContainer}>
                        <MaterialIcons name="inventory-2" size={24} color="#007bff" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemCategory}>{item.category || 'Uncategorized'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.itemPrice}>₹{item.sellingPrice}</Text>
                        <View style={[styles.stockBadge, isLowStock ? styles.lowStockBadge : styles.normalStockBadge]}>
                            <Text style={[styles.stockText, isLowStock ? styles.lowStockText : styles.normalStockText]}>
                                {item.stock} Left
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }, [navigation]);

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <View>
                    <Text style={styles.header}>Inventory</Text>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={24} color="#007bff" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search items..."
                    placeholderTextColor="#6B7280"
                    selectionColor="#007bff"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <MaterialIcons name="close" size={20} color="#6B7280" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setScannerVisible(true)} style={styles.scanButton}>
                    <MaterialIcons name="qr-code-scanner" size={24} color="#007bff" />
                </TouchableOpacity>
            </View>

            <BarcodeScannerModal
                visible={scannerVisible}
                onClose={() => setScannerVisible(false)}
                onScan={(code) => {
                    setSearchQuery(code);
                }}
            />

            {/* Category Chips */}
            <View style={styles.categoriesContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesContent}
                >
                    {categories.map((category) => (
                        <TouchableOpacity
                            key={category}
                            style={[
                                styles.categoryChip,
                                selectedCategory === category && styles.categoryChipSelected
                            ]}
                            onPress={() => setSelectedCategory(category)}
                        >
                            <Text style={[
                                styles.categoryChipText,
                                selectedCategory === category && styles.categoryChipTextSelected
                            ]}>
                                {category}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {items.length === 0 ? (
                <View style={styles.centerContainer}>
                    <MaterialIcons name="inventory" size={64} color="#E5E7EB" />
                    <Text style={styles.emptyText}>No items in inventory.</Text>
                    <Text style={styles.emptySubText}>Tap + to add your first product.</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredItems}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    initialNumToRender={10}
                    windowSize={5}
                />
            )}

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddItem')}
            >
                <MaterialIcons name="add" size={30} color="#fff" />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    headerContainer: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
    },
    header: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: 0.5,
    },
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
        elevation: 0,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#111827',
        paddingVertical: 0,
    },
    scanButton: {
        marginLeft: 10,
    },
    categoriesContainer: {
        marginBottom: 10,
    },
    categoriesContent: {
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    categoryChipSelected: {
        backgroundColor: '#007bff',
        borderColor: '#007bff',
    },
    categoryChipText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
    },
    categoryChipTextSelected: {
        color: '#FFFFFF',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA'
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    itemCategory: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
        alignSelf: 'flex-end',
        marginBottom: 6,
    },
    stockBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    normalStockBadge: {
        backgroundColor: '#F3F4F6',
    },
    lowStockBadge: {
        backgroundColor: '#FFEBEE',
    },
    stockText: {
        fontSize: 12,
        fontWeight: '700',
    },
    normalStockText: {
        color: '#4B5563',
    },
    lowStockText: {
        color: '#D32F2F',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#374151',
        marginTop: 16,
    },
    emptySubText: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 8,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        backgroundColor: '#007bff',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#007bff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
});


export default InventoryScreen;
