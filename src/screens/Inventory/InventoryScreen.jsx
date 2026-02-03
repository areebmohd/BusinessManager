import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { subscribeToItems } from '../../services/FirestoreService';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const InventoryScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');

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
                (item.category && item.category.toLowerCase().includes(lowerQuery))
            );
        }

        setFilteredItems(result);
    }, [searchQuery, items, selectedCategory]);

    const renderItem = ({ item }) => {
        const initialStock = item.initialStock || 0;
        const lowStockThreshold = Math.max(initialStock * 0.1, 0); // 10%
        const isLowStock = item.stock < lowStockThreshold && item.stock > 0;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('ItemDetail', { item })}
            >
                <View style={styles.cardContent}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemCategory}>{item.category || 'Uncategorized'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.itemPrice}>₹{item.sellingPrice}</Text>
                        <Text style={[styles.stockText, isLowStock && styles.lowStock]}>
                            Stock: {item.stock}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.header}>Inventory</Text>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={24} color="#777" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search items..."
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
                    <Text style={styles.emptyText}>No items in inventory.</Text>
                    <Text style={styles.emptySubText}>Tap + to add your first product.</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredItems}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
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
        backgroundColor: '#f5f5f5',
        padding: 20,
        paddingTop: 10,
    },
    header: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
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
    categoriesContainer: {
        marginBottom: 10,
    },
    categoriesContent: {
        paddingVertical: 5,
        paddingRight: 10,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#e0e0e0',
        marginRight: 10,
    },
    categoryChipSelected: {
        backgroundColor: '#007bff',
    },
    categoryChipText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    categoryChipTextSelected: {
        color: '#fff',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 1,
        paddingBottom: 80,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    itemCategory: {
        fontSize: 14,
        color: '#777',
        marginTop: 2,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2e7d32',
    },
    stockText: {
        fontSize: 14,
        color: '#555',
        marginTop: 2,
    },
    lowStock: {
        color: '#d32f2f',
        fontWeight: 'bold',
    },
    emptyText: {
        fontSize: 18,
        color: '#444',
    },
    emptySubText: {
        fontSize: 14,
        color: '#888',
        marginTop: 5,
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 60,
        height: 60,
        backgroundColor: '#007bff',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
});

export default InventoryScreen;
