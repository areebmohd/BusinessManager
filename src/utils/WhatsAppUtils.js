
import { Linking, Alert, Platform } from 'react-native';

export const shareBillToWhatsApp = async (billText, phoneNumber) => {
    try {
        if (!phoneNumber) {
            Alert.alert("No Number", "No WhatsApp number available for this buyer.");
            return;
        }

        // Clean number: remove non-digits
        let targetNumber = phoneNumber.replace(/\D/g, '');

        if (targetNumber.length === 10) {
            targetNumber = '91' + targetNumber; // Assume India if 10 digits
        }

        const encodedText = encodeURIComponent(billText);
        const url = `whatsapp://send?phone=${targetNumber}&text=${encodedText}`;

        // On Android 11+, canOpenURL requires properties in AndroidManifest.xml
        // If not added, it returns false even if installed. 
        // We will try to open directly, and if that fails, show the alert.

        try {
            await Linking.openURL(url);
        } catch (err) {
            console.error("Failed to open WhatsApp URL:", err);
            Alert.alert(
                "Error",
                "Could not open WhatsApp. Please ensure it is installed.",
                [{ text: "OK" }]
            );
        }
    } catch (error) {
        console.error("Error sharing to WhatsApp:", error);
        Alert.alert("Error", "Failed to open WhatsApp.");
    }
};
