import React, { createContext, useState, useEffect, useContext } from 'react';
import auth from '@react-native-firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [initializing, setInitializing] = useState(true);

    // Handle user state changes
    function onAuthStateChanged(user) {
        setUser(user);
        if (initializing) setInitializing(false);
    }

    useEffect(() => {
        const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
        return subscriber; // unsubscribe on unmount
    }, []);

    const signInWithPhoneNumber = async (phoneNumber) => {
        try {
            const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
            return confirmation;
        } catch (error) {
            console.error("Error sending code: ", error);
            throw error;
        }
    };

    const confirmCode = async (confirmationResult, code) => {
        try {
            await confirmationResult.confirm(code);
        } catch (error) {
            console.error("Invalid code: ", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await auth().signOut();
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    const value = React.useMemo(() => ({
        user,
        initializing,
        signInWithPhoneNumber,
        confirmCode,
        logout,
    }), [user, initializing]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
