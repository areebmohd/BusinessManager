import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

const LoginScreen = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [code, setCode] = useState('');
    const [confirm, setConfirm] = useState(null);
    const [loading, setLoading] = useState(false);
    const { signInWithPhoneNumber, confirmCode } = useAuth();

    const handleSendCode = async () => {
        if (!phoneNumber) {
            Alert.alert('Error', 'Please enter a phone number');
            return;
        }
        setLoading(true);
        try {
            // Ensure number is in E.164 format, e.g. +919999999999
            const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
            const confirmation = await signInWithPhoneNumber(formattedNumber);
            setConfirm(confirmation);
        } catch (error) {
            Alert.alert('Error Sending Code', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmCode = async () => {
        if (!code) {
            Alert.alert('Error', 'Please enter content code');
            return;
        }
        setLoading(true);
        try {
            await confirmCode(confirm, code);
            // Auth state change will auto-redirect in AppNavigator
        } catch (error) {
            Alert.alert('Invalid Code', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    if (!confirm) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Welcome Back!</Text>
                <Text style={styles.subtitle}>Enter your phone number to continue</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Phone Number (e.g. 9876543210)"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                />

                <TouchableOpacity style={styles.button} onPress={handleSendCode}>
                    <Text style={styles.buttonText}>Send OTP</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>Enter the code sent to {phoneNumber}</Text>

            <TextInput
                style={styles.input}
                placeholder="Enter 6-digit Code"
                keyboardType="number-pad"
                value={code}
                onChangeText={setCode}
            />

            <TouchableOpacity style={styles.button} onPress={handleConfirmCode}>
                <Text style={styles.buttonText}>Verify Code</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setConfirm(null)} style={{ marginTop: 20 }}>
                <Text style={{ color: '#007bff' }}>Change Phone Number</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
        marginBottom: 20,
        backgroundColor: '#f9f9f9',
    },
    button: {
        width: '100%',
        height: 50,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});

export default LoginScreen;
