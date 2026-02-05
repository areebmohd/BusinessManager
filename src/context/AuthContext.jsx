import React, { createContext, useState, useEffect, useContext } from 'react';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

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

        // Configure Google Signin
        GoogleSignin.configure({
            webClientId: '357903569441-td2899br6rfd7hosrgdruq6nofphtli9.apps.googleusercontent.com',
        });

        return subscriber; // unsubscribe on unmount
    }, []);



    const signInWithEmail = async (email, password) => {
        try {
            await auth().signInWithEmailAndPassword(email, password);
        } catch (error) {
            console.error("Error signing in with email: ", error);
            throw error;
        }
    };

    const signUpWithEmail = async (email, password) => {
        try {
            await auth().createUserWithEmailAndPassword(email, password);
        } catch (error) {
            console.error("Error signing up with email: ", error);
            throw error;
        }
    };

    const signInWithGoogle = async () => {
        try {
            // Check for Play Services
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

            // Get the ID token
            const signInResult = await GoogleSignin.signIn();

            // Safe handling if signInResult is strict
            let idToken = signInResult.idToken;
            if (!idToken && signInResult.data) {
                idToken = signInResult.data.idToken;
            }

            if (!idToken) {
                throw new Error('No ID token found');
            }

            // Create a Google credential with the token
            const googleCredential = auth.GoogleAuthProvider.credential(idToken);

            // Sign-in the user with the credential
            return auth().signInWithCredential(googleCredential);
        } catch (error) {
            console.error("Google Sign-In Error Details:", {
                code: error.code,
                message: error.message,
                userInfo: error.userInfo,
                nativeStack: error.nativeStack
            });
            throw error;
        }
    };

    const logout = async () => {
        try {
            await GoogleSignin.signOut(); // Sign out from Google as well
            await auth().signOut();
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    const value = React.useMemo(() => ({
        user,
        initializing,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        logout,
    }), [user, initializing]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
