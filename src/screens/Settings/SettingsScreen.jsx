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
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
            <ScrollView style={styles.container}>
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
                    <Text style={styles.infoText}>Logged in as: {user?.phoneNumber}</Text>

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
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20, paddingTop: 10 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#333' },
    section: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 20, elevation: 2 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#007bff' },
    editLink: { color: '#007bff', fontSize: 14 },
    label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 5 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 15, backgroundColor: '#fff' },
    disabledInput: { backgroundColor: '#f9f9f9', color: '#888' },
    saveButton: { backgroundColor: '#28a745', padding: 12, borderRadius: 8, alignItems: 'center' },
    editButton: { backgroundColor: '#007bff' },
    saveText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    infoText: { fontSize: 16, color: '#333', marginBottom: 15 },
    logoutButton: { flexDirection: 'row', backgroundColor: '#d32f2f', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});

export default SettingsScreen;
