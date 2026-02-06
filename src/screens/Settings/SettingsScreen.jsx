import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { saveSettings, subscribeToSettings } from '../../services/FirestoreService';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const SettingsScreen = () => {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [businessDetails, setBusinessDetails] = useState({
        businessName: '',
        ownerName: '',
        phone: '',
        email: '',
        upiId: ''
    });

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToSettings(user.uid, (settings) => {
            if (settings && settings.businessDetails) {
                setBusinessDetails(prev => ({ ...prev, ...settings.businessDetails }));
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleSave = async () => {
        try {
            setLoading(true);
            await saveSettings(user.uid, {
                businessDetails: businessDetails
            });
            Alert.alert('Success', 'Business details saved successfully');
            setIsEditing(false);
        } catch (error) {
            Alert.alert('Error', 'Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    const toggleEdit = () => {
        if (isEditing) {
            handleSave();
        } else {
            setIsEditing(true);
        }
    };

    const handleChange = (field, value) => {
        setBusinessDetails(prev => ({ ...prev, [field]: value }));
    };

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Logout", onPress: logout, style: "destructive" }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.header}>Settings</Text>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Business Details</Text>
                    </View>

                    <Text style={styles.label}>Business Name</Text>
                    <TextInput
                        style={[styles.input, !isEditing && styles.disabledInput]}
                        placeholder="e.g. My General Store"
                        value={businessDetails.businessName}
                        onChangeText={(text) => handleChange('businessName', text)}
                        editable={isEditing}
                    />

                    <Text style={styles.label}>Owner Name</Text>
                    <TextInput
                        style={[styles.input, !isEditing && styles.disabledInput]}
                        placeholder="e.g. John Doe"
                        value={businessDetails.ownerName}
                        onChangeText={(text) => handleChange('ownerName', text)}
                        editable={isEditing}
                    />

                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                        style={[styles.input, !isEditing && styles.disabledInput]}
                        placeholder="e.g. +91 9876543210"
                        keyboardType="phone-pad"
                        value={businessDetails.phone}
                        onChangeText={(text) => handleChange('phone', text)}
                        editable={isEditing}
                    />

                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                        style={[styles.input, !isEditing && styles.disabledInput]}
                        placeholder="e.g. business@example.com"
                        keyboardType="email-address"
                        value={businessDetails.email}
                        onChangeText={(text) => handleChange('email', text)}
                        editable={isEditing}
                    />

                    <Text style={styles.label}>UPI ID</Text>
                    <TextInput
                        style={[styles.input, !isEditing && styles.disabledInput]}
                        placeholder="e.g. business@upi"
                        value={businessDetails.upiId}
                        onChangeText={(text) => handleChange('upiId', text)}
                        editable={isEditing}
                    />

                    <TouchableOpacity
                        style={[styles.saveButton, !isEditing ? styles.editButton : {}]}
                        onPress={toggleEdit}
                    >
                        <Text style={styles.saveText}>{isEditing ? 'Save Details' : 'Edit Details'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <Text style={styles.infoText}>{user?.email || 'User'}</Text>

                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <MaterialIcons name="logout" size={20} color="#fff" />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: { flexGrow: 1, padding: 20, paddingTop: 10, paddingBottom: 0 },
    container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20, paddingTop: 10 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { fontSize: 28, fontWeight: '800', marginBottom: 10, color: '#111827', letterSpacing: 0.5 },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3
    },
    // Removed accountSection style to remove forced gap
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { fontSize: 21, fontWeight: '700', color: '#111827' },
    editLink: { color: '#007bff', fontSize: 14, fontWeight: '600' },
    label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12, // Comfortable padding
        fontSize: 14,
        marginBottom: 14, // Increased spacing between inputs
        backgroundColor: '#FFFFFF',
        color: '#111827'
    },
    disabledInput: { backgroundColor: '#F9FAFB', color: '#6B7280' },
    saveButton: {
        backgroundColor: '#28a745',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#28a745',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3
    },
    editButton: {
        backgroundColor: '#007bff',
        shadowColor: '#007bff'
    },
    saveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    infoText: { fontSize: 14, color: '#374151', marginBottom: 16, fontWeight: '500' },
    logoutButton: {
        flexDirection: 'row',
        backgroundColor: '#FF3B30',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2
    },
    logoutText: { color: '#fff', fontSize: 15, fontWeight: '700', marginLeft: 8 },
});

export default SettingsScreen;
