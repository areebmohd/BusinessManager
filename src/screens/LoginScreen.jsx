import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const LoginScreen = () => {
    const [loginMethod, setLoginMethod] = useState('phone'); // 'phone' or 'email'
    const [isRegistering, setIsRegistering] = useState(false); // For email mode

    // Phone Auth State
    const [phoneNumber, setPhoneNumber] = useState('');
    const [code, setCode] = useState('');
    const [confirm, setConfirm] = useState(null);

    // Email Auth State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const { signInWithPhoneNumber, confirmCode, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

    // --- Phone Auth Handlers ---
    const handleSendCode = async () => {
        if (!phoneNumber) {
            Alert.alert('Error', 'Please enter a phone number');
            return;
        }
        setLoading(true);
        try {
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
            Alert.alert('Error', 'Please enter code');
            return;
        }
        setLoading(true);
        try {
            await confirmCode(confirm, code);
        } catch (error) {
            Alert.alert('Invalid Code', error.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Email Auth Handlers ---
    const handleEmailAuth = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        setLoading(true);
        try {
            if (isRegistering) {
                await signUpWithEmail(email, password);
            } else {
                await signInWithEmail(email, password);
            }
        } catch (error) {
            Alert.alert('Authentication Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Google Auth Handler ---
    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            await signInWithGoogle();
        } catch (error) {
            Alert.alert('Google Sign-In Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    // Phone Verification Step (OTP)
    if (loginMethod === 'phone' && confirm) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Verify OTP</Text>
                <Text style={styles.subtitle}>Enter code sent to {phoneNumber}</Text>
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
                    <Text style={styles.linkText}>Change Phone Number</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome Back</Text>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, loginMethod === 'phone' && styles.activeTab]}
                    onPress={() => setLoginMethod('phone')}
                >
                    <Text style={[styles.tabText, loginMethod === 'phone' && styles.activeTabText]}>Phone</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, loginMethod === 'email' && styles.activeTab]}
                    onPress={() => setLoginMethod('email')}
                >
                    <Text style={[styles.tabText, loginMethod === 'email' && styles.activeTabText]}>Email</Text>
                </TouchableOpacity>
            </View>

            {/* Phone Login Form */}
            {loginMethod === 'phone' && (
                <View style={styles.form}>
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
            )}

            {/* Email Login Form */}
            {loginMethod === 'email' && (
                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="Email Address"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />
                    <TouchableOpacity style={styles.button} onPress={handleEmailAuth}>
                        <Text style={styles.buttonText}>{isRegistering ? 'Sign Up' : 'Login'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={{ marginTop: 15, alignItems: 'center' }}>
                        <Text style={styles.linkText}>
                            {isRegistering ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Google Login Button */}
            <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.divider} />
            </View>

            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
                <FontAwesome name="google" size={24} color="#DB4437" />
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
        textAlign: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        backgroundColor: '#f1f3f4',
        borderRadius: 8,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeTab: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
    },
    tabText: {
        color: '#666',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#333',
        fontWeight: '700',
    },
    form: {
        width: '100%',
    },
    input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
        marginBottom: 15,
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
    linkText: {
        color: '#007bff',
        fontSize: 14,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 25,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#ddd',
    },
    dividerText: {
        marginHorizontal: 10,
        color: '#999',
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        height: 50,
        width: '100%',
    },
    googleButtonText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
});

export default LoginScreen;
