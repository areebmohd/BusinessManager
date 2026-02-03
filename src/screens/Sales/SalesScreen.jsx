import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { subscribeToSales } from '../../services/FirestoreService';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const SalesScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToSales(user.uid,
            (data) => {
                setSales(data);
                setLoading(false);
            },
            (error) => {
                console.error("Sales fetch error", error);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [user]);

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.row}>
                <Text style={styles.itemName}>{item.itemName}</Text>
                <Text style={styles.amount}>₹{item.total}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.details}>{item.quantity} x ₹{item.unitPrice}</Text>
                <Text style={[styles.paymentMethod,
                item.paymentMethod === 'paid' ? styles.cash :
                    item.paymentMethod === 'unpaid' ? styles.unpaid : styles.upi
                ]}>
                    {item.paymentMethod === 'paid' ? 'PAID' :
                        item.paymentMethod === 'unpaid' ? 'NOT PAID' :
                            item.paymentMethod.toUpperCase()}
                </Text>
            </View>
            <Text style={styles.date}>
                {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleString() : 'Just now'}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.header}>Sales History</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={sales}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 1, paddingBottom: 80 }}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>No sales recorded yet.</Text>
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
