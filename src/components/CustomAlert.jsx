import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const CustomAlert = ({ visible, title, message, type = 'info', buttons = [], onClose }) => {
    const scaleValue = useRef(new Animated.Value(0)).current;
    const opacityValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleValue, {
                    toValue: 1,
                    useNativeDriver: true,
                    speed: 20,
                    bounciness: 8
                }),
                Animated.timing(opacityValue, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true
                })
            ]).start();
        } else {
            Animated.timing(scaleValue, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            }).start();
            Animated.timing(opacityValue, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            }).start();
        }
    }, [visible]);

    const getIconConfig = () => {
        switch (type) {
            case 'success': return { name: 'check-circle', color: '#10B981', bg: '#D1FAE5' };
            case 'error': return { name: 'error', color: '#EF4444', bg: '#FEE2E2' };
            case 'warning': return { name: 'warning', color: '#F59E0B', bg: '#FEF3C7' };
            default: return { name: 'info', color: '#3B82F6', bg: '#DBEAFE' };
        }
    };

    const { name, color, bg } = getIconConfig();

    // Default button if none provided
    const actionButtons = buttons.length > 0 ? buttons : [
        { text: 'OK', onPress: onClose, style: 'confirm' }
    ];

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <Animated.View style={[styles.alertContainer, { transform: [{ scale: scaleValue }], opacity: opacityValue }]}>

                    <View style={[styles.iconContainer, { backgroundColor: bg }]}>
                        <MaterialIcons name={name} size={32} color={color} />
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    {message ? <Text style={styles.message}>{message}</Text> : null}

                    <View style={styles.buttonContainer}>
                        {actionButtons.map((btn, index) => {
                            const isConfirm = btn.style !== 'cancel';
                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.button,
                                        isConfirm ? styles.confirmBtn : styles.cancelBtn,
                                        actionButtons.length > 1 && { flex: 1, marginHorizontal: 5 }
                                    ]}
                                    onPress={() => {
                                        if (btn.onPress) btn.onPress();
                                        onClose();
                                    }}
                                >
                                    <Text style={[styles.btnText, isConfirm ? styles.confirmText : styles.cancelText]}>
                                        {btn.text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    alertContainer: {
        width: width * 0.85,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '800', // Premium bold
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    button: {
        paddingVertical: 14,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 100,
    },
    confirmBtn: {
        backgroundColor: '#007bff',
        width: '100%',
        elevation: 3,
        shadowColor: '#007bff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    cancelBtn: {
        backgroundColor: '#F3F4F6',
    },
    confirmText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    cancelText: {
        color: '#374151',
        fontSize: 16,
        fontWeight: '600',
    }
});

export default CustomAlert;
