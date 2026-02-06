
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Modal, Text, TouchableOpacity, PermissionsAndroid, Platform, Linking, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import { useAlert } from '../context/AlertContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const BarcodeScannerModal = ({ visible, onClose, onScan }) => {
    const device = useCameraDevice('back');
    const { showAlert } = useAlert();
    const [isActive, setIsActive] = useState(true);
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        if (visible) {
            setIsActive(true);
            checkPermission();
        } else {
            setIsActive(false);
        }
    }, [visible]);

    const checkPermission = async () => {
        if (Platform.OS === 'android') {
            const status = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
            if (status) {
                setHasPermission(true);
            } else {
                requestCameraPermission();
            }
        } else {
            // For iOS, the library handles it better, or we can use the hook logic if needed.
            // But keeping it simple for now as user is on Windows/Android.
            setHasPermission(true);
        }
    };

    const requestCameraPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: "Camera Permission",
                        message: "App needs access to your camera to scan barcodes.",
                        buttonNeutral: "Ask Me Later",
                        buttonNegative: "Cancel",
                        buttonPositive: "OK"
                    }
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    setHasPermission(true);
                } else {
                    showAlert(
                        "Permission Denied",
                        "Camera permission is required.",
                        "error",
                        [
                            { text: "Cancel", style: "cancel", onPress: onClose },
                            { text: "Open Settings", onPress: () => Linking.openSettings() }
                        ]
                    );
                }
            } catch (err) {
                console.warn(err);
            }
        }
    };

    const codeScanner = useCodeScanner({
        codeTypes: ['ean-13', 'ean-8', 'upc-a', 'upc-e', 'qr', 'code-128', 'code-39'],
        onCodeScanned: (codes) => {
            if (codes.length > 0 && isActive) {
                const value = codes[0].value;
                if (value) {
                    setIsActive(false);
                    onScan(value);
                    onClose();
                }
            }
        }
    });

    if (!visible) return null;

    if (!hasPermission) {
        return (
            <Modal visible={visible} animationType="slide">
                <View style={styles.permissionContainer}>
                    <Text style={styles.permissionText}>Requesting Camera Permission...</Text>
                    <ActivityIndicator size="large" color="#007bff" />
                </View>
            </Modal>
        );
    }

    if (!device) {
        return (
            <Modal visible={visible} animationType="slide">
                <View style={styles.permissionContainer}>
                    <Text style={styles.permissionText}>No camera device found.</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.container}>
                <Camera
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive={isActive}
                    codeScanner={codeScanner}
                />

                <View style={styles.overlay}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Scan Barcode</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
                            <MaterialIcons name="close" size={30} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.scannerFrameContainer}>
                        <View style={styles.scannerFrame} />
                        <Text style={styles.instructionText}>Align barcode within frame</Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    permissionText: {
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
    },
    permissionButton: {
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 15,
    },
    closeText: {
        color: '#007bff',
        fontSize: 16,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 50, // Adjust for status bar
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10
    },
    closeIcon: {
        padding: 5,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
    },
    scannerFrameContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    scannerFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#00ff00',
        backgroundColor: 'transparent',
    },
    instructionText: {
        color: '#fff',
        marginTop: 20,
        fontSize: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 5,
    }
});

export default BarcodeScannerModal;
