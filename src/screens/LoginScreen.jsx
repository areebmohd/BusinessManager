
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const LoginScreen = () => {
    const { showAlert } = useAlert();
    const [isRegistering, setIsRegistering] = useState(false);

    // Email Auth State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

    // --- Email Auth Handlers ---
    const handleEmailAuth = async () => {
        if (!email || !password) {
            showAlert('Error', 'Please fill all fields', 'error');
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
            showAlert('Authentication Error', error.message, 'error');
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
            showAlert('Google Sign-In Error', error.message, 'error');
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

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{isRegistering ? 'Create Account' : 'Welcome Back'}</Text>
            <Text style={styles.subtitle}>{isRegistering ? 'Sign up to get started' : 'Sign in to continue'}</Text>

            {/* Email Login Form */}
            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#9CA3AF"
                    selectionColor="#007bff"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#9CA3AF"
                    selectionColor="#007bff"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
                <TouchableOpacity style={styles.button} onPress={handleEmailAuth}>
                    <Text style={styles.buttonText}>{isRegistering ? 'Sign Up' : 'Login'}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={{ alignItems: 'center' }}>
                    <Text style={styles.linkText}>
                        {isRegistering ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
                    </Text>
                </TouchableOpacity>
            </View>

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
        padding: 24,
        backgroundColor: '#F5F7FA',
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 8,
        textAlign: 'center',
        color: '#111827',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 40,
        textAlign: 'center',
        fontWeight: '500',
    },
    form: {
        width: '100%',
    },
    input: {
        width: '100%',
        height: 56,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
        color: '#111827',
    },
    button: {
        width: '100%',
        height: 56,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        marginTop: 8,
        shadowColor: '#007bff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    linkText: {
        color: '#007bff',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 16,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 30,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        marginHorizontal: 10,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        height: 56,
        width: '100%',
        elevation: 0,
    },
    googleButtonText: {
        marginLeft: 12,
        fontSize: 16,
        color: '#111827',
        fontWeight: '600',
    },
});

export default LoginScreen;
