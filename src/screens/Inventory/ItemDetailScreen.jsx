import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { deleteItem } from '../../services/FirestoreService';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

const ItemDetailScreen = ({ route, navigation }) => {
    const { user } = useAuth();
    const { item } = route.params;
    const [loading, setLoading] = useState(false);

    const handleDelete = () => {
        Alert.alert(
            "Delete Item",
            `Are you sure you want to delete ${item.name}? This cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await deleteItem(user.uid, item.id);
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete item.");
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>{item.name}</Text>
                    <Text style={styles.categoryBadge}>{item.category || 'Uncategorized'}</Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="info-outline" size={20} color="#6B7280" />
                        <Text style={styles.sectionHeaderText}>Item Details</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <View>
                            <Text style={styles.label}>Selling Price</Text>
                            <Text style={[styles.value, { color: '#007bff' }]}>₹{item.sellingPrice}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.label}>Cost Price</Text>
                            <Text style={styles.value}>₹{item.costPrice || item.purchasePrice || '0.00'}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <View>
                            <Text style={styles.label}>Current Stock</Text>
                            <Text style={[styles.value, (item.stock < (item.initialStock || 0) * 0.1 && item.stock > 0) ? styles.lowStock : null]}>
                                {item.stock} units
                            </Text>
                        </View>
                        {item.initialStock !== undefined && (
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.label}>Initial Stock</Text>
                                <Text style={styles.value}>{item.initialStock} units</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.divider} />

                    {item.barcode ? (
                        <View style={styles.detailRow}>
                            <View>
                                <Text style={styles.label}>Barcode</Text>
                                <Text style={styles.value}>{item.barcode}</Text>
                            </View>
                            <MaterialIcons name="qr-code" size={24} color="#374151" />
                        </View>
                    ) : null}

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Added On</Text>
                        <Text style={styles.dateValue}>
                            {item.createdAt?.toDate
                                ? item.createdAt.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                                : 'Unknown'}
                        </Text>
                    </View>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.button, styles.editButton]}
                        onPress={() => navigation.navigate('EditItem', { item })}
                        disabled={loading}
                    >
                        <MaterialIcons name="edit" size={20} color="#fff" />
                        <Text style={styles.buttonText}>Edit Item</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.deleteButton]}
                        onPress={handleDelete}
                        disabled={loading}
                    >
                        <MaterialIcons name="delete" size={20} color="#fff" />
                        <Text style={styles.buttonText}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 40,
    },
    headerRow: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#E3F2FD',
        color: '#007bff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        fontSize: 13,
        fontWeight: '600',
        overflow: 'hidden',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionHeaderText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginLeft: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 12,
    },
    label: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 4,
        fontWeight: '500',
    },
    value: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    dateValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
    },
    lowStock: {
        color: '#D32F2F',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    editButton: {
        backgroundColor: '#007bff',
    },
    deleteButton: {
        backgroundColor: '#EF4444',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
        marginLeft: 8,
    },
});

export default ItemDetailScreen;
