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
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>{item.name}</Text>
                    <Text style={styles.categoryBadge}>{item.category || 'Uncategorized'}</Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Selling Price</Text>
                        <Text style={[styles.value, { color: '#2e7d32' }]}>₹{item.sellingPrice}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Purchase Price</Text>
                        <Text style={styles.value}>₹{item.purchasePrice}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Current Stock</Text>
                        <Text style={[styles.value, (item.stock < (item.initialStock || 0) * 0.1 && item.stock > 0) ? styles.lowStock : null]}>
                            {item.stock} units
                        </Text>
                    </View>
                    {item.initialStock !== undefined && (
                        <>
                            <View style={styles.divider} />
                            <View style={styles.detailRow}>
                                <Text style={styles.label}>Initial Stock</Text>
                                <Text style={styles.value}>{item.initialStock} units</Text>
                            </View>
                        </>
                    )}
                    <View style={styles.divider} />
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Added On</Text>
                        <Text style={styles.value}>
                            {item.createdAt?.toDate
                                ? item.createdAt.toDate().toLocaleDateString()
                                : 'Unknown'}
                        </Text>
                    </View>
                    {item.barcode ? (
                        <>
                            <View style={styles.divider} />
                            <View style={styles.detailRow}>
                                <Text style={styles.label}>Barcode</Text>
                                <Text style={styles.value}>{item.barcode}</Text>
                            </View>
                        </>
                    ) : null}
                </View>

                {item.description ? (
                    <View style={styles.card}>
                        <Text style={styles.label}>Description</Text>
                        <Text style={styles.description}>{item.description}</Text>
                    </View>
                ) : null}

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
                        <Text style={styles.buttonText}>Delete Item</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20 },
    headerRow: { marginBottom: 20 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#e3f2fd',
        color: '#1976d2',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        fontSize: 14,
        marginTop: 5,
        overflow: 'hidden',
        fontWeight: 'bold'
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        elevation: 2,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    divider: { height: 1, backgroundColor: '#eee' },
    label: { fontSize: 14, color: '#666' },
    value: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    lowStock: { color: '#d32f2f' },
    description: { marginTop: 5, fontSize: 16, color: '#333', lineHeight: 22 },
    actions: { flexDirection: 'row', justifyContent: 'space-between' },
    button: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
        marginHorizontal: 5,
        elevation: 2,
    },
    editButton: { backgroundColor: '#007bff' },
    deleteButton: { backgroundColor: '#d32f2f' },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
});

export default ItemDetailScreen;
